import type { ConfidenceStatus, WorldBossEventDto } from '@/types/worldBoss';

export function formatLocalDateTime(iso: string, dateStyle: 'short' | 'full' = 'short') {
  const date = new Date(iso);
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour12: true,
    weekday: dateStyle === 'full' ? 'short' : undefined,
    month: dateStyle === 'full' ? 'short' : undefined,
    day: dateStyle === 'full' ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
  return formatter.format(date);
}

export function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour12: true,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function getTimezoneState() {
  try {
    const label = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return label
      ? { label, failed: false }
      : { label: 'UTC', failed: true };
  } catch {
    return { label: 'UTC', failed: true };
  }
}

export function getSecondsUntil(iso: string) {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

export function getSecondsUntilFrom(baseIso: string, targetIso: string) {
  return Math.max(
    0,
    Math.floor((new Date(targetIso).getTime() - new Date(baseIso).getTime()) / 1000),
  );
}

export function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function confidenceClass(status: ConfidenceStatus) {
  if (status === 'Confirmed') return 'confirmed';
  if (status === 'Needs verification') return 'needs-verification';
  return 'predicted';
}

export function waypointLabel(event: WorldBossEventDto) {
  if (!event.nearest_waypoint) return 'Waypoint needs manual verification';
  if (event.waypoint_confidence === 'Confirmed') {
    return `Nearest waypoint: ${event.nearest_waypoint}`;
  }
  if (event.waypoint_confidence === 'Needs manual verification') {
    return `Waypoint needs manual verification: ${event.nearest_waypoint}`;
  }
  return `Suggested waypoint: ${event.nearest_waypoint}`;
}

export function isResponseStale(generatedAt: string, staleAfterSeconds: number) {
  return Date.now() - new Date(generatedAt).getTime() > staleAfterSeconds * 1000;
}

export function isResponseStaleFrom(
  baseIso: string,
  generatedAt: string,
  staleAfterSeconds: number,
) {
  return (
    new Date(baseIso).getTime() - new Date(generatedAt).getTime() >
    staleAfterSeconds * 1000
  );
}
