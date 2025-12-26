import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generatePresignedUploadUrl } from '@/lib/cloudflare';
import { rateLimit, getIdentifier } from '@/lib/rateLimit';

// Rate limit: 100 presigned URL requests per hour per IP
const PRESIGNED_URL_RATE_LIMIT = {
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 100, // 100 requests per hour
};

export async function POST(request: Request) {
  try {
    await requireAuth();

    // Rate limiting
    const identifier = getIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, PRESIGNED_URL_RATE_LIMIT);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
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

    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(contentType) && !fileName.toLowerCase().endsWith('.heic')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, WEBP, HEIC are allowed.' },
        { status: 400 }
      );
    }

    const { uploadUrl, publicUrl, key } = await generatePresignedUploadUrl(fileName, contentType);

    return NextResponse.json(
      { uploadUrl, publicUrl, key },
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
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

