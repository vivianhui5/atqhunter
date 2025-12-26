import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { rateLimit, getIdentifier } from '@/lib/rateLimit';

// No longer need to increase body size - files upload directly to R2
export const maxDuration = 30;
export const runtime = 'nodejs';

// Rate limit: 20 artwork uploads per hour per user
const ARTWORK_UPLOAD_RATE_LIMIT = {
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 1000, // 20 uploads per hour
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const identifier = getIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, ARTWORK_UPLOAD_RATE_LIMIT);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many uploads. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { title, description, price, gallery_id, is_pinned, imageUrls, password } = body;

    if (!title || !imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one image URL are required' },
        { status: 400 }
      );
    }

    // Validate image URLs
    if (!Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: 'imageUrls must be an array' },
        { status: 400 }
      );
    }

    // Validate URLs are from our Cloudflare R2 domain
    const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL;
    if (publicUrl) {
      for (const url of imageUrls) {
        if (typeof url !== 'string' || !url.startsWith(publicUrl)) {
          return NextResponse.json(
            { error: 'Invalid image URL. Must be from Cloudflare R2.' },
            { status: 400 }
          );
        }
      }
    }

    // Validate password if provided
    let passwordValue: string | null = null;
    if (password !== undefined && password !== null) {
      if (typeof password !== 'string') {
        return NextResponse.json(
          { error: 'Password must be a string' },
          { status: 400 }
        );
      }
      const trimmedPassword = password.trim();
      if (trimmedPassword.length > 0) {
        if (trimmedPassword.length < 3) {
          return NextResponse.json(
            { error: 'Password must be at least 3 characters' },
            { status: 400 }
          );
        }
        passwordValue = trimmedPassword;
      }
    }

    // Create artwork post
    const { data: artworkPost, error: artworkError } = await supabaseAdmin
      .from('artwork_posts')
      .insert([
        {
          title,
          description: description || null,
          price: price ? parseFloat(price) : null,
          gallery_id: gallery_id || null,
          is_pinned: is_pinned || false,
          password: passwordValue,
        },
      ])
      .select()
      .single();

    if (artworkError) {
      throw artworkError;
    }

    // Save image URLs (already uploaded to R2)
    const imageUploads = imageUrls.map((imageUrl: string, index: number) => ({
      artwork_post_id: artworkPost.id,
      image_url: imageUrl,
      display_order: index,
    }));

    // Insert image records
    const { error: imagesError } = await supabaseAdmin
      .from('artwork_images')
      .insert(imageUploads);

    if (imagesError) {
      throw imagesError;
    }

    return NextResponse.json(
      { message: 'Artwork uploaded successfully', artwork: artworkPost },
      { 
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to upload artwork' },
      { status: 500 }
    );
  }
}
