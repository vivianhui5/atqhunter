import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { wouldCreateCircularReference } from '@/lib/gallery-utils';
import { Gallery } from '@/types/database';
import { validateUUID } from '@/lib/validation';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const validatedId = validateUUID(id, 'id');
    const body = await request.json();
    const { name, parent_id, password, cover_image_url } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json(
          { error: 'Gallery name must be a string' },
          { status: 400 }
        );
      }

      const trimmedName = name.trim();
      if (trimmedName.length === 0 || trimmedName.length > 200) {
        return NextResponse.json(
          { error: 'Gallery name must be between 1 and 200 characters' },
          { status: 400 }
        );
      }
    }

    // Validate parent_id if provided
    let validatedParentId: string | null = null;
    if (parent_id !== undefined) {
      if (parent_id === null || parent_id === '') {
        validatedParentId = null;
      } else if (typeof parent_id === 'string') {
        validatedParentId = validateUUID(parent_id, 'parent_id');
        
        if (validatedParentId === validatedId) {
          return NextResponse.json(
            { error: 'Gallery cannot be its own parent' },
            { status: 400 }
          );
        }
        
        // Check if parent exists
        const { data: parent } = await supabaseAdmin
          .from('galleries')
          .select('id')
          .eq('id', validatedParentId)
          .single();

        if (!parent) {
          return NextResponse.json(
            { error: 'Parent gallery not found' },
            { status: 400 }
          );
        }

        // Check for circular reference
        const { data: allGalleries } = await supabaseAdmin
          .from('galleries')
          .select('*');

        if (allGalleries && wouldCreateCircularReference(validatedId, validatedParentId, allGalleries as Gallery[])) {
          return NextResponse.json(
            { error: 'Cannot create circular reference' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'parent_id must be a string or null' },
          { status: 400 }
        );
      }
    }

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

    // Build update object
    const updateData: { name?: string; parent_id?: string | null; password?: string | null; cover_image_url?: string | null } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (parent_id !== undefined) {
      updateData.parent_id = validatedParentId;
    }
    if (passwordValue !== undefined) {
      updateData.password = passwordValue;
    }
    if (cover_image_url !== undefined) {
      updateData.cover_image_url = cover_image_url || null;
    }

    const { error } = await supabaseAdmin
      .from('galleries')
      .update(updateData)
      .eq('id', validatedId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to update gallery' },
      { status: 500 }
    );
  }
}

// Recursively collect all child gallery IDs in depth-first order (deepest first)
async function getAllChildGalleryIds(parentId: string): Promise<string[]> {
  const { data: children } = await supabaseAdmin
    .from('galleries')
    .select('id')
    .eq('parent_id', parentId);

  if (!children || children.length === 0) {
    return [];
  }

  const childIds: string[] = [];
  for (const child of children) {
    // First, recursively get all descendants (deepest first)
    const descendantIds = await getAllChildGalleryIds(child.id);
    childIds.push(...descendantIds);
    // Then add the child itself (so it comes after its descendants)
    childIds.push(child.id);
  }

  return childIds;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const validatedId = validateUUID(id, 'id');

    // Recursively get all child gallery IDs
    const childIds = await getAllChildGalleryIds(validatedId);
    const allGalleryIds = [validatedId, ...childIds];

    // First, update all artworks in this gallery and all child galleries to have no gallery
    await supabaseAdmin
      .from('artwork_posts')
      .update({ gallery_id: null })
      .in('gallery_id', allGalleryIds);

    // Delete all child galleries first (deepest first, then their parents)
    // The getAllChildGalleryIds function returns IDs in depth-first order
    for (const childId of childIds) {
      const { error } = await supabaseAdmin
        .from('galleries')
        .delete()
        .eq('id', childId);

      if (error) {
        throw error;
      }
    }

    // Finally, delete the parent gallery
    const { error } = await supabaseAdmin
      .from('galleries')
      .delete()
      .eq('id', validatedId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete gallery' },
      { status: 500 }
    );
  }
}
