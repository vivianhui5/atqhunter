import { NextResponse } from 'next/server';
import { uploadToCloudflare } from '@/lib/cloudflare';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading artwork:', error);
    return NextResponse.json(
      { error: 'Failed to upload artwork' },
      { status: 500 }
    );
  }
}
