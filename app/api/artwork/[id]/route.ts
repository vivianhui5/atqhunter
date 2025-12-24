import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: artwork, error } = await supabaseAdmin
      .from('artwork_posts')
      .select(`
        *,
        gallery:galleries(*),
        images:artwork_images(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { artwork },
      { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch artwork' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, price, gallery_id, is_pinned, password } = body;

    // Validate password if provided
    let passwordValue: string | null | undefined = undefined;
    if (password !== undefined) {
      if (password === null || password === '') {
        passwordValue = null; // Explicitly remove password
      } else if (typeof password === 'string') {
        const trimmedPassword = password.trim();
        if (trimmedPassword.length > 0) {
          if (trimmedPassword.length < 3) {
            return NextResponse.json(
              { error: 'Password must be at least 3 characters' },
              { status: 400 }
            );
          }
          passwordValue = trimmedPassword;
        } else {
          passwordValue = null; // Empty string means remove password
        }
      } else {
        return NextResponse.json(
          { error: 'Password must be a string or null' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: {
      title?: string;
      description?: string;
      price?: number | null;
      gallery_id?: string | null;
      is_pinned?: boolean;
      password?: string | null;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (gallery_id !== undefined) updateData.gallery_id = gallery_id;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (passwordValue !== undefined) {
      updateData.password = passwordValue;
    }

    const { error } = await supabaseAdmin
      .from('artwork_posts')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('[ARTWORK-PATCH] Supabase error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ARTWORK-PATCH] Error:', error instanceof Error ? error.message : 'Unknown error');
    const errorMessage = error instanceof Error ? error.message : 'Failed to update artwork';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('artwork_posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete artwork' },
      { status: 500 }
    );
  }
}

