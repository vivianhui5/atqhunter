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
    const { images } = body; // Array of { image_url: string, display_order: number }

    console.log('POST request - artworkId:', id, 'images:', images);

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: 'Images array required' }, { status: 400 });
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

    console.log('Insert result:', { data, error });

    if (error) {
      console.error('Supabase error adding images:', error);
      return NextResponse.json({ error: 'Failed to add images', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ images: data });
  } catch (error) {
    console.error('Exception in POST /api/artwork/[id]/images:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
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
  } catch (error) {
    console.error('Error in PATCH /api/artwork/[id]/images:', error);
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

    console.log('DELETE request - artworkId:', id, 'imageId:', imageId);

    if (!imageId) {
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
    const { data, error } = await supabaseAdmin
      .from('artwork_images')
      .delete()
      .eq('id', imageId)
      .eq('artwork_post_id', id)
      .select();

    console.log('Delete result:', { data, error });

    if (error) {
      console.error('Supabase error deleting image:', error);
      return NextResponse.json({ error: 'Failed to delete image', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: data });
  } catch (error) {
    console.error('Exception in DELETE /api/artwork/[id]/images:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

