import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getEffectivePassword, getEffectivePasswordForPost } from '@/lib/gallery-utils';
import { validateUUID } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const { type, id } = await request.json();

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate UUID
    const validatedId = validateUUID(id, 'id');

    let isProtected = false;
    let hasOwnPassword = false;

    if (type === 'gallery') {
      // Get gallery and all galleries to check password
      const { data: gallery, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', validatedId)
        .single();

      if (galleryError || !gallery) {
        return NextResponse.json(
          { error: 'Gallery not found' },
          { status: 404 }
        );
      }

      // Get all galleries for password inheritance check
      const { data: allGalleries } = await supabase
        .from('galleries')
        .select('*');

      const effectivePassword = getEffectivePassword(gallery, allGalleries || []);
      isProtected = effectivePassword !== null;
      hasOwnPassword = gallery.password !== null && gallery.password.length > 0;
    } else if (type === 'artwork') {
      // Get artwork
      const { data: artwork, error: artworkError } = await supabase
        .from('artwork_posts')
        .select(`
          *,
          gallery:galleries(*)
        `)
        .eq('id', validatedId)
        .single();

      if (artworkError || !artwork) {
        return NextResponse.json(
          { error: 'Artwork not found' },
          { status: 404 }
        );
      }

      // Get all galleries for password inheritance check
      const { data: allGalleries } = await supabase
        .from('galleries')
        .select('*');

      const effectivePassword = getEffectivePasswordForPost(artwork, allGalleries || []);
      isProtected = effectivePassword !== null;
      hasOwnPassword = artwork.password !== null && artwork.password.length > 0;
    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      isProtected,
      hasOwnPassword,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check protection status' },
      { status: 500 }
    );
  }
}

