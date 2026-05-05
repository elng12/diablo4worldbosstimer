import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const LIMITS = {
  report: { max: 5, windowMs: 60000 },
  default: { max: 60, windowMs: 60000 },
} as const;

function getRateLimitKey(request: NextRequest): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';
  const path = request.nextUrl.pathname;
  return `${ip}:${path}`;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/api/')) {
    const key = getRateLimitKey(request);
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    const limit =
      path === '/api/world-boss/report' ? LIMITS.report : LIMITS.default;

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + limit.windowMs });
    } else if (entry.count >= limit.max) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } },
        { status: 429 },
      );
    } else {
      entry.count += 1;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
