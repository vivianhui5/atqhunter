import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit, getIdentifier } from '@/lib/rateLimit';

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limit: 5 inquiries per hour per IP
const INQUIRY_RATE_LIMIT = {
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 20, // 5 requests per hour
};

// Sanitize HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Sanitize and format message (preserve line breaks)
function sanitizeMessage(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const identifier = getIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, INQUIRY_RATE_LIMIT);

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

    const { senderEmail, subject, message, artworkTitle } = await request.json();

    // Validate inputs
    if (!senderEmail || !subject || !message || !artworkTitle) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate and sanitize inputs
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Limit input lengths to prevent abuse
    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject too long' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message too long' },
        { status: 400 }
      );
    }

    if (artworkTitle.length > 500) {
      return NextResponse.json(
        { error: 'Invalid artwork title' },
        { status: 400 }
      );
    }

    // Sanitize all user inputs
    const safeSubject = escapeHtml(subject);
    const safeMessage = sanitizeMessage(message);
    const safeArtworkTitle = escapeHtml(artworkTitle);
    const safeSenderEmail = escapeHtml(senderEmail);

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'ATQ Hunter <onboarding@resend.dev>',
      to: ['huikh2r@yahoo.com'],
      cc: [senderEmail],
      subject: `ATQHunter - ${safeSubject}`,
      replyTo: senderEmail,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1c1917; border-bottom: 2px solid #e7e5e4; padding-bottom: 10px;">
            New Inquiry from ATQ Hunter
          </h2>
          
          <div style="margin: 20px 0; padding: 15px; background: #f5f5f4; border-radius: 8px;">
            <p style="margin: 5px 0;"><strong>Antique:</strong> ${safeArtworkTitle}</p>
            <p style="margin: 5px 0;"><strong>From:</strong> ${safeSenderEmail}</p>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${safeSubject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #57534e; font-size: 16px; margin-bottom: 10px;">Message:</h3>
            <div style="padding: 15px; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px;">
              ${safeMessage}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e7e5e4; color: #78716c; font-size: 14px;">
            <p>This inquiry was sent through the ATQ Hunter website.</p>
            <p>Reply directly to this email to respond to ${safeSenderEmail}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      // Log error server-side only, don't expose details to client
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
        },
      }
    );
  } catch (error) {
    // Log error server-side only, don't expose details to client
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

