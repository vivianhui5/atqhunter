import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('artwork_posts')
      .select(`
        *,
        gallery:galleries(*),
        images:artwork_images(*)
      `)
      .eq('gallery_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ artworks: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch gallery artworks' },
      { status: 500 }
    );
  }
}

