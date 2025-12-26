import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getEffectivePassword, getEffectivePasswordForPost } from '@/lib/gallery-utils';
import { validateUUID } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const { type, id, password } = await request.json();

    if (!type || !id || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate UUID
    const validatedId = validateUUID(id, 'id');

    let isValid = false;

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
      isValid = password === effectivePassword;
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
      isValid = password === effectivePassword;
    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    if (isValid) {
      // Generate a secure token (using crypto for better security)
      const token = crypto.randomUUID();
      
      // Store token temporarily (you could use Redis or database for production)
      // For now, we'll return a hash that includes the password hash for verification
      const passwordHash = await hashPassword(password);
      
      return NextResponse.json({
        valid: true,
        token,
        passwordHash, // Hash of password for session verification
      });
    } else {
      return NextResponse.json({
        valid: false,
      });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    );
  }
}

// Helper function to hash password (using Web Crypto API)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

