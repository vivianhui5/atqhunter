import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        let query = supabaseAdmin.from('site_settings').select('*');

        if (key) {
            query = query.eq('key', key);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ settings: data });
    } catch (error) {
        console.error('Error fetching site settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await requireAuth();

        const body = await request.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ setting: data });
    } catch (error) {
        console.error('Error updating site setting:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
