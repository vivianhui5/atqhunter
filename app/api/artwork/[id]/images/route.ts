import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { deleteFromCloudflare } from '@/lib/cloudflare';

// Add new images to existing artwork
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Images array required' }, { status: 400 });
    }

    // Validate image data structure
    if (!images.every((img: any) => img.image_url && typeof img.display_order === 'number')) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }

    // Insert new images
    const { data, error } = await supabaseAdmin
      .from('artwork_images')
      .insert(
        images.map((img) => ({
          artwork_post_id: id,
          image_url: img.image_url,
          display_order: img.display_order,
        }))
      )
      .select();

    if (error) {
      return NextResponse.json({ error: 'Failed to add images' }, { status: 500 });
    }

    return NextResponse.json({ images: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update image display order
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { images } = body; // Array of { id: string, display_order: number }

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: 'Images array required' }, { status: 400 });
    }

    // Update display order for each image
    const updates = images.map((img) =>
      supabaseAdmin
        .from('artwork_images')
        .update({ display_order: img.display_order })
        .eq('id', img.id)
        .eq('artwork_post_id', id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete an image
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId || typeof imageId !== 'string') {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // First, get the image URL so we can delete from storage
    const { data: imageData } = await supabaseAdmin
      .from('artwork_images')
      .select('image_url')
      .eq('id', imageId)
      .eq('artwork_post_id', id)
      .single();

    if (imageData?.image_url) {
      // Delete from Cloudflare storage
      await deleteFromCloudflare(imageData.image_url);
    }

    // Delete from database
    const { error } = await supabaseAdmin
      .from('artwork_images')
      .delete()
      .eq('id', imageId)
      .eq('artwork_post_id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

