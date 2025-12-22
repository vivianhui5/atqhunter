import { NextResponse } from 'next/server';
import { uploadToCloudflare } from '@/lib/cloudflare';
import { requireAuth } from '@/lib/auth';
import { rateLimit, getIdentifier } from '@/lib/rateLimit';

// Rate limit: 50 uploads per hour per user
const UPLOAD_RATE_LIMIT = {
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 1000, // 50 uploads per hour
};

export async function POST(request: Request) {
  try {
    await requireAuth();

    // Rate limiting
    const identifier = getIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, UPLOAD_RATE_LIMIT);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many uploads. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Upload to Cloudflare
    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = await uploadToCloudflare(buffer, file.name, file.type);

    return NextResponse.json(
      { url: imageUrl },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

