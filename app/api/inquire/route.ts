import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit, getIdentifier } from '@/lib/rateLimit';

// Initialize Resend client
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
};

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
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[INQUIRE] RESEND_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Email service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

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
    try {
      const resend = getResendClient();
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: ['huikh2r@yahoo.com'],
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
              <p><strong>Reply directly to this email</strong> to respond to ${safeSenderEmail}</p>
              <p style="margin-top: 10px; font-size: 12px; color: #a8a29e;">(The sender will receive your reply automatically)</p>
            </div>
          </div>
        `,
      });

      if (error) {
        // Log full error server-side for debugging (only in development)
        const errorDetails = {
          message: error.message,
          name: error.name,
          statusCode: 'statusCode' in error ? (error as { statusCode?: number }).statusCode : undefined,
        };
        console.error('[INQUIRE] Resend API error:', JSON.stringify(errorDetails, null, 2));
        
        // In development, show more helpful error messages
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        // Check for specific error types
        if (error.message?.includes('API key') || error.message?.includes('Unauthorized') || error.message?.includes('401')) {
          return NextResponse.json(
            { 
              error: isDevelopment 
                ? 'Invalid Resend API key. Please check your RESEND_API_KEY in .env.local'
                : 'Email service configuration error. Please contact support.' 
            },
            { status: 500 }
          );
        }
        
        if (error.message?.includes('domain') || error.message?.includes('from') || error.message?.includes('422')) {
          return NextResponse.json(
            { 
              error: isDevelopment
                ? 'Resend domain/from address issue. You may need to verify a domain or use a different from address.'
                : 'Email service configuration error. Please contact support.' 
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { 
            error: isDevelopment 
              ? `Failed to send email: ${error.message}` 
              : 'Failed to send email. Please try again later.' 
          },
          { status: 500 }
        );
      }

      // Success
      if (!data) {
        console.error('[INQUIRE] Resend returned no data and no error');
        return NextResponse.json(
          { error: 'Failed to send email. Please try again later.' },
          { status: 500 }
        );
      }
    } catch (resendError) {
      // Catch any exceptions from Resend
      console.error('[INQUIRE] Resend exception:', resendError instanceof Error ? resendError.message : 'Unknown error');
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
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
    // Log error server-side for debugging
    console.error('[INQUIRE] Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

