import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Rate limit configuration per API path.
 * Keys are pathname prefixes; `default` applies when no specific match is found.
 */
const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/world-boss/report': { max: 5, windowMs: 60_000 },
  default: { max: 60, windowMs: 60_000 },
};

/** Maximum number of entries kept in the rate-limit Map to prevent unbounded growth. */
const MAX_ENTRIES = 10_000;

/** In-memory rate limit store: key -> { count, resetAt } */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Extract the client IP from request headers.
 *
 * When behind a reverse proxy (Vercel, Cloudflare, etc.), `x-forwarded-for`
 * contains a comma-separated list where the **last** entry is set by the
 * closest trusted proxy.  The first entry can be spoofed by the client, so
 * we skip it and take the last value instead.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) {
      return ips[ips.length - 1];
    }
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Remove expired entries from the rate-limit Map.
 * If the Map exceeds MAX_ENTRIES after cleanup, evict the entries with the
 * earliest resetAt (i.e. those closest to expiry) to bring it back under
 * the limit.
 */
function cleanupExpiredEntries() {
  const now = Date.now();

  // Delete all entries whose window has already expired
  for (const [key, entry] of rateLimitMap) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }

  // If the Map is still too large, evict the oldest entries first
  if (rateLimitMap.size > MAX_ENTRIES) {
    const sorted = [...rateLimitMap.entries()].sort(
      (a, b) => a[1].resetAt - b[1].resetAt,
    );
    const toDelete = sorted.slice(0, rateLimitMap.size - MAX_ENTRIES);
    for (const [key] of toDelete) {
      rateLimitMap.delete(key);
    }
  }
}

export function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Probabilistic cleanup: run ~1% of the time to avoid overhead on every
  // request while still preventing unbounded memory growth.
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  // Resolve the rate-limit config for this path
  const config =
    RATE_LIMITS[request.nextUrl.pathname] || RATE_LIMITS.default;
  const ip = getClientIp(request);
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();

  // Retrieve or initialise the rate-limit entry
  let entry = rateLimitMap.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs };
    rateLimitMap.set(key, entry);
  }
  entry.count++;

  const remaining = Math.max(0, config.max - entry.count);
  const resetTimestamp = Math.ceil(entry.resetAt / 1000);

  // Build rate-limit response headers
  const rateLimitHeaders: Record<string, string> = {
    'X-RateLimit-Limit': String(config.max),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetTimestamp),
  };

  // Reject request if quota exceeded
  if (entry.count > config.max) {
    rateLimitHeaders['Retry-After'] = String(
      Math.ceil((entry.resetAt - now) / 1000),
    );
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
      },
      { status: 429, headers: rateLimitHeaders },
    );
  }

  // Pass through with rate-limit headers attached
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(config.max));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(resetTimestamp));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
