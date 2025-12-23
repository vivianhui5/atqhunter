import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { wouldCreateCircularReference } from '@/lib/gallery-utils';
import { Gallery } from '@/types/database';

export async function POST(request: Request) {
  try {
    await requireAuth();

    const { name, parent_id } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Gallery name is required' },
        { status: 400 }
      );
    }

    // Validate and sanitize name
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 200) {
      return NextResponse.json(
        { error: 'Gallery name must be between 1 and 200 characters' },
        { status: 400 }
      );
    }

    // Validate parent_id if provided
    if (parent_id) {
      const { data: parent } = await supabaseAdmin
        .from('galleries')
        .select('id')
        .eq('id', parent_id)
        .single();

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent gallery not found' },
          { status: 400 }
        );
      }

      // Check for circular reference (get all galleries first)
      const { data: allGalleries } = await supabaseAdmin
        .from('galleries')
        .select('*');

      if (allGalleries && wouldCreateCircularReference('', parent_id, allGalleries as Gallery[])) {
        return NextResponse.json(
          { error: 'Cannot create circular reference' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('galleries')
      .insert([{ 
        name: trimmedName,
        parent_id: parent_id || null
      }])
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
    const flat = searchParams.get('flat') === 'true'; // Return flat list instead of tree

    const { data: galleries, error } = await supabaseAdmin
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!galleries) {
      return NextResponse.json({ galleries: [] });
    }

    // Optionally fetch preview images
    let galleriesWithData = galleries;
    if (includeImages) {
      galleriesWithData = await Promise.all(
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
    }

    // Return flat list if requested, otherwise return as-is (will be built into tree on client if needed)
    return NextResponse.json({ galleries: galleriesWithData, flat });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch galleries' },
      { status: 500 }
    );
  }
}

