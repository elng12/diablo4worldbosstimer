import { NextResponse } from 'next/server';
import { apiErrorResponse, parseJsonBody } from '@/lib/apiUtils';
import { createWorldBossReport } from '@/lib/worldBossData';
import { validateOrError, worldBossReportSchema } from '@/lib/validation';
import type { WorldBossReportPayload } from '@/types/worldBoss';

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await parseJsonBody(request);
  } catch {
    return apiErrorResponse('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const result = validateOrError(worldBossReportSchema, raw);
  if ('error' in result) return result.error;

  try {
    return NextResponse.json(await createWorldBossReport(result.data as WorldBossReportPayload));
  } catch (error) {
    console.error('Failed to create world boss report', error);
    return apiErrorResponse('REPORT_CREATE_FAILED', 'Report could not be submitted.', 500);
  }
}
