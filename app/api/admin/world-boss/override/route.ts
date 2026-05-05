import { NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/adminAuth';
import { apiErrorResponse, databaseNotConfiguredResponse, parseJsonBody } from '@/lib/apiUtils';
import {
  applyWorldBossOverride,
  isWorldBossDatabaseConfigured,
  type AdminOverridePayload,
} from '@/lib/worldBossData';
import { validateOrError, adminOverrideSchema } from '@/lib/validation';

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

  const result = validateOrError(adminOverrideSchema, raw);
  if ('error' in result) return result.error;

  if (!isWorldBossDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  try {
    return NextResponse.json(
      await applyWorldBossOverride(result.data as AdminOverridePayload),
    );
  } catch (error) {
    console.error('World boss override failed', error);
    const message =
      error instanceof Error ? error.message : 'World boss override failed.';
    return apiErrorResponse('OVERRIDE_FAILED', message, 500);
  }
}
