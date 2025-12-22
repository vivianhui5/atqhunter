// Simple in-memory rate limiter
// For production with multiple instances, consider using Redis/Upstash

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.interval,
    });
    return {
      success: true,
      limit: options.uniqueTokenPerInterval,
      remaining: options.uniqueTokenPerInterval - 1,
      reset: now + options.interval,
    };
  }

  if (entry.count >= options.uniqueTokenPerInterval) {
    return {
      success: false,
      limit: options.uniqueTokenPerInterval,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  entry.count += 1;
  return {
    success: true,
    limit: options.uniqueTokenPerInterval,
    remaining: options.uniqueTokenPerInterval - entry.count,
    reset: entry.resetTime,
  };
}

// Helper to get client identifier (IP address)
export function getIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
  return ip.trim();
}

