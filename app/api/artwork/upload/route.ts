import { NextResponse } from 'next/server';
import { uploadToCloudflare } from '@/lib/cloudflare';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { rateLimit, getIdentifier } from '@/lib/rateLimit';

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

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const galleryId = formData.get('gallery_id') as string | null;
    const isPinned = formData.get('is_pinned') === 'true';
    const images = formData.getAll('images') as File[];

    if (!title || images.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one image are required' },
        { status: 400 }
      );
    }

    // Create artwork post
    const { data: artworkPost, error: artworkError } = await supabaseAdmin
      .from('artwork_posts')
      .insert([
        {
          title,
          description,
          price: price ? parseFloat(price) : null,
          gallery_id: galleryId || null,
          is_pinned: isPinned,
        },
      ])
      .select()
      .single();

    if (artworkError) {
      throw artworkError;
    }

    // Upload images to Cloudflare and save URLs
    const imageUploads = await Promise.all(
      images.map(async (image, index) => {
        const buffer = Buffer.from(await image.arrayBuffer());
        const imageUrl = await uploadToCloudflare(
          buffer,
          image.name,
          image.type
        );

        return {
          artwork_post_id: artworkPost.id,
          image_url: imageUrl,
          display_order: index,
        };
      })
    );

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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload artwork' },
      { status: 500 }
    );
  }
}
