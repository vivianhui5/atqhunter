import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { validateUUID } from '@/lib/validation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const validatedId = validateUUID(id, 'id');

    const { data: artwork, error } = await supabaseAdmin
      .from('artwork_posts')
      .select(`
        *,
        gallery:galleries(*),
        images:artwork_images(*)
      `)
      .eq('id', validatedId)
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
    const validatedId = validateUUID(id, 'id');
    const body = await request.json();
    const { title, description, price, gallery_id, password } = body;

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
      password?: string | null;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (gallery_id !== undefined) {
      // Validate gallery_id if provided (must be null or valid UUID)
      if (gallery_id === null || gallery_id === '') {
        updateData.gallery_id = null;
      } else if (typeof gallery_id === 'string') {
        updateData.gallery_id = validateUUID(gallery_id, 'gallery_id');
      } else {
        return NextResponse.json(
          { error: 'gallery_id must be a string or null' },
          { status: 400 }
        );
      }
    }
    if (passwordValue !== undefined) {
      updateData.password = passwordValue;
    }

    const { error } = await supabaseAdmin
      .from('artwork_posts')
      .update(updateData)
      .eq('id', validatedId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
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
    const validatedId = validateUUID(id, 'id');

    const { error } = await supabaseAdmin
      .from('artwork_posts')
      .delete()
      .eq('id', validatedId);

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

