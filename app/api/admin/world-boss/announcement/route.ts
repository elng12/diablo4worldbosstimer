import { NextResponse } from 'next/server';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/adminAuth';
import { apiErrorResponse, databaseNotConfiguredResponse, parseJsonBody } from '@/lib/apiUtils';
import {
  getAdminAnnouncement,
  updateAdminAnnouncement,
  isWorldBossDatabaseConfigured,
} from '@/lib/worldBossData';
import { validateOrError, adminAnnouncementSchema } from '@/lib/validation';

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  if (!isWorldBossDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  try {
    const announcement = await getAdminAnnouncement();
    return NextResponse.json({ ok: true, announcement });
  } catch (error) {
    console.error('Failed to fetch announcement', error);
    const message =
      error instanceof Error ? error.message : 'Failed to fetch announcement.';
    return apiErrorResponse('FETCH_FAILED', message, 500);
  }
}

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) {
    return unauthorizedResponse();
  }

  let raw: unknown;
  try {
    raw = await parseJsonBody(request);
  } catch {
    return apiErrorResponse('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const result = validateOrError(adminAnnouncementSchema, raw);
  if ('error' in result) return result.error;

  if (!isWorldBossDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  try {
    return NextResponse.json(
      await updateAdminAnnouncement(result.data.enabled, result.data.message ?? null),
    );
  } catch (error) {
    console.error('Failed to update announcement', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update announcement.';
    return apiErrorResponse('UPDATE_FAILED', message, 500);
  }
}
