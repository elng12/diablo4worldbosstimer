import { NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/adminAuth';
import {
  apiErrorResponse,
  databaseNotConfiguredResponse,
  parseJsonBody,
} from '@/lib/apiUtils';
import {
  isWorldBossDatabaseConfigured,
  resetWorldBossAnchor,
  type AdminAnchorResetPayload,
} from '@/lib/worldBossData';
import { validateOrError, adminAnchorResetSchema } from '@/lib/validation';

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  let raw: unknown;
  try {
    raw = await parseJsonBody(request);
  } catch {
    return apiErrorResponse('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const result = validateOrError(adminAnchorResetSchema, raw);
  if ('error' in result) return result.error;

  if (!isWorldBossDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  try {
    return NextResponse.json(
      await resetWorldBossAnchor(result.data as AdminAnchorResetPayload),
    );
  } catch (error) {
    console.error('World boss anchor reset failed', error);
    const message =
      error instanceof Error ? error.message : 'World boss anchor reset failed.';
    return apiErrorResponse('ANCHOR_RESET_FAILED', message, 500);
  }
}
