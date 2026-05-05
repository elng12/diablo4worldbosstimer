import crypto from 'crypto';
import { NextResponse } from 'next/server';
import type { ApiErrorResponse } from '@/types/worldBoss';
import { getBearerToken } from '@/lib/apiUtils';

export function isAdminAuthorized(request: Request) {
  const expectedToken = process.env.ADMIN_API_TOKEN;
  if (!expectedToken) return false;

  const token = getBearerToken(request);
  if (!token) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expectedToken),
    );
  } catch {
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
