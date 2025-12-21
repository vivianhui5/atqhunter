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

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ galleries: data });
  } catch (error) {
    console.error('Error fetching galleries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch galleries' },
      { status: 500 }
    );
  }
}

