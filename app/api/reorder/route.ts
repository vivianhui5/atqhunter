import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { items } = body; // Array of { type: 'gallery' | 'post', id: string, display_order: number }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Update galleries
    const galleryUpdates = items
      .filter(item => item.type === 'gallery')
      .map(item => ({
        id: item.id,
        display_order: item.display_order,
      }));

    if (galleryUpdates.length > 0) {
      for (const update of galleryUpdates) {
        await supabaseAdmin
          .from('galleries')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    }

    // Update artworks
    const artworkUpdates = items
      .filter(item => item.type === 'post')
      .map(item => ({
        id: item.id,
        display_order: item.display_order,
      }));

    if (artworkUpdates.length > 0) {
      for (const update of artworkUpdates) {
        await supabaseAdmin
          .from('artwork_posts')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

