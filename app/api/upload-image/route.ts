import { NextResponse } from 'next/server';
import { uploadToCloudflare } from '@/lib/cloudflare';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await requireAuth();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File required' }, { status: 400 });
    }

    // Upload to Cloudflare
    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = await uploadToCloudflare(buffer, file.name, file.type);

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

