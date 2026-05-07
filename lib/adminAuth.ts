import crypto from 'crypto';
import { NextResponse } from 'next/server';
import type { ApiErrorResponse } from '@/types/worldBoss';
import { getBearerToken } from '@/lib/apiUtils';

export function isAdminAuthorized(request: Request) {
  const expectedToken = process.env.ADMIN_API_TOKEN;
  if (!expectedToken) {
    console.warn('Admin auth failed: ADMIN_API_TOKEN not configured', {
      timestamp: new Date().toISOString(),
    });
    return false;
  }

  const token = getBearerToken(request);
  if (!token) {
    console.warn('Admin auth failed: missing bearer token', {
      timestamp: new Date().toISOString(),
    });
    return false;
  }

  try {
    const match = crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expectedToken),
    );
    if (!match) {
      console.warn('Admin auth failed: invalid token', {
        timestamp: new Date().toISOString(),
      });
    }
    return match;
  } catch {
    console.warn('Admin auth failed: token comparison error', {
      timestamp: new Date().toISOString(),
    });
    return false;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Admin authorization is required.',
      },
    } satisfies ApiErrorResponse,
    { status: 401 },
  );
}
