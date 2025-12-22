import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    await requireAuth();

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Gallery name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('galleries')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { message: 'Gallery created successfully', gallery: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating gallery:', error);
    return NextResponse.json(
      { error: 'Failed to create gallery' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeImages = searchParams.get('includeImages') === 'true';

    const { data: galleries, error } = await supabaseAdmin
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Optionally fetch preview images
    if (includeImages && galleries) {
      const galleriesWithImages = await Promise.all(
        galleries.map(async (gallery) => {
          const { data: artworks } = await supabaseAdmin
            .from('artwork_posts')
            .select('images:artwork_images(image_url)')
            .eq('gallery_id', gallery.id)
            .limit(4);

          const previewImages = artworks
            ?.flatMap(a => a.images?.map(img => img.image_url) || [])
            .filter(Boolean)
            .slice(0, 4) || [];

          return { ...gallery, previewImages };
        })
      );

      return NextResponse.json({ galleries: galleriesWithImages });
    }

    return NextResponse.json({ galleries });
  } catch (error) {
    console.error('Error fetching galleries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch galleries' },
      { status: 500 }
    );
  }
}

