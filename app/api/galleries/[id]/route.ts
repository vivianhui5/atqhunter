import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { wouldCreateCircularReference } from '@/lib/gallery-utils';
import { Gallery } from '@/types/database';

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
    const body = await request.json();
    const { name, parent_id } = body;

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
    if (parent_id !== undefined) {
      if (parent_id === id) {
        return NextResponse.json(
          { error: 'Gallery cannot be its own parent' },
          { status: 400 }
        );
      }

      if (parent_id) {
        // Check if parent exists
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

        // Check for circular reference
        const { data: allGalleries } = await supabaseAdmin
          .from('galleries')
          .select('*');

        if (allGalleries && wouldCreateCircularReference(id, parent_id, allGalleries as Gallery[])) {
          return NextResponse.json(
            { error: 'Cannot create circular reference' },
            { status: 400 }
          );
        }
      }
    }

    // Build update object
    const updateData: { name?: string; parent_id?: string | null } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (parent_id !== undefined) updateData.parent_id = parent_id || null;

    const { error } = await supabaseAdmin
      .from('galleries')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[GALLERY-PATCH] Error:', err instanceof Error ? err.message : 'Unknown error');
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

    // Recursively get all child gallery IDs
    const childIds = await getAllChildGalleryIds(id);
    const allGalleryIds = [id, ...childIds];

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
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[GALLERY-DELETE] Error:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to delete gallery' },
      { status: 500 }
    );
  }
}
