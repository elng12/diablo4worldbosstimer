import { NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/adminAuth';
import { apiErrorResponse, databaseNotConfiguredResponse, parseJsonBody } from '@/lib/apiUtils';
import { updateWorldBossReportStatus, isWorldBossDatabaseConfigured } from '@/lib/worldBossData';
import { validateOrError, adminReportStatusSchema } from '@/lib/validation';

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

  const result = validateOrError(adminReportStatusSchema, raw);
  if ('error' in result) return result.error;

  if (!isWorldBossDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  try {
    return NextResponse.json(
      await updateWorldBossReportStatus(result.data.report_id, result.data.status),
    );
  } catch (error) {
    console.error('Failed to update report status', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update report status.';
    return apiErrorResponse('UPDATE_FAILED', message, 500);
  }
}
