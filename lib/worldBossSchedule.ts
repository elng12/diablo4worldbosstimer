import type {
  ConfidenceStatus,
  SourceType,
  WaypointConfidence,
} from '@/types/worldBoss';

export const REQUIRED_WORLD_BOSS_SETTING_KEYS = [
  'boss_pool',
  'location_pool',
  'boss_rotation',
  'location_rotation',
  'world_boss_algorithm',
  'generation_control',
  'nahantu_rule',
  'announcement_message',
] as const;

type BossConfig = {
  boss_name: string;
  boss_slug: string;
};

type LocationConfig = {
  location_name: string;
  region: string | null;
  nearest_waypoint?: string | null;
  waypoint_confidence?: WaypointConfidence | null;
  route_note?: string | null;
};

export type WorldBossAnchorRow = {
  id: string;
  anchor_spawn_time_utc: string;
  anchor_boss: string;
  anchor_boss_slug: string | null;
  anchor_location_name: string | null;
  anchor_region: string | null;
  anchor_nearest_waypoint: string | null;
  interval_minutes: number;
  boss_rotation_index: number | null;
  location_rotation_index: number | null;
  season_version: string | null;
  algorithm_version: string;
  confidence_status: ConfidenceStatus;
  is_active: boolean | null;
};

export type WorldBossGeneratedEvent = {
  boss_name: string;
  boss_slug: string;
  spawn_time_utc: string;
  region: string | null;
  location_name: string | null;
  nearest_waypoint: string | null;
  waypoint_confidence: WaypointConfidence | null;
  route_note: string | null;
  confidence_status: ConfidenceStatus;
  source_type: SourceType;
  algorithm_version: string;
  season_version: string | null;
  is_overridden: boolean;
};

type GenerationControl = {
  prediction_enabled?: boolean;
  reason?: string | null;
};

type AlgorithmSetting = {
  interval_minutes?: number;
  algorithm_version?: string;
  season_version?: string | null;
  default_confidence_status?: ConfidenceStatus;
};

export type WorldBossGenerationSettings = {
  boss_pool?: BossConfig[];
  location_pool?: LocationConfig[];
  boss_rotation?: BossConfig[];
  location_rotation?: LocationConfig[];
  world_boss_algorithm?: AlgorithmSetting;
  generation_control?: GenerationControl;
  nahantu_rule?: {
    enabled?: boolean;
  };
};

export type WorldBossGenerationPlan = {
  events: WorldBossGeneratedEvent[];
  skipped: boolean;
  reason: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBossConfig(value: unknown): value is BossConfig {
  return (
    isRecord(value) &&
    typeof value.boss_name === 'string' &&
    typeof value.boss_slug === 'string'
  );
}

function isLocationConfig(value: unknown): value is LocationConfig {
  return isRecord(value) && typeof value.location_name === 'string';
}

function normalizeArray<T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value.filter(predicate);
  return normalized.length ? normalized : undefined;
}

function normalizeSettings(
  rows: Array<{ key: string; value: unknown }>,
): WorldBossGenerationSettings {
  return rows.reduce<WorldBossGenerationSettings>((settings, row) => {
    if (row.key === 'boss_pool') {
      settings.boss_pool = normalizeArray(row.value, isBossConfig);
    }
    if (row.key === 'location_pool') {
      settings.location_pool = normalizeArray(row.value, isLocationConfig);
    }
    if (row.key === 'boss_rotation') {
      settings.boss_rotation = normalizeArray(row.value, isBossConfig);
    }
    if (row.key === 'location_rotation') {
      settings.location_rotation = normalizeArray(row.value, isLocationConfig);
    }
    if (row.key === 'world_boss_algorithm' && isRecord(row.value)) {
      settings.world_boss_algorithm = row.value as AlgorithmSetting;
    }
    if (row.key === 'generation_control' && isRecord(row.value)) {
      settings.generation_control = row.value as GenerationControl;
    }
    if (row.key === 'nahantu_rule' && isRecord(row.value)) {
      settings.nahantu_rule = row.value;
    }
    return settings;
  }, {});
}

function getRotationItem<T>(items: T[], index: number) {
  return items[((index % items.length) + items.length) % items.length];
}

function resolveLocation(
  rotationLocation: LocationConfig,
  locationPool: LocationConfig[] | undefined,
) {
  return (
    locationPool?.find(
      (location) =>
        location.location_name === rotationLocation.location_name &&
        (!rotationLocation.region || location.region === rotationLocation.region),
    ) ?? rotationLocation
  );
}

export function validateRequiredSettings(rows: Array<{ key: string }>) {
  const presentKeys = new Set(rows.map((row) => row.key));
  return REQUIRED_WORLD_BOSS_SETTING_KEYS.filter((key) => !presentKeys.has(key));
}

export function buildWorldBossGenerationPlan(
  anchor: WorldBossAnchorRow,
  settingRows: Array<{ key: string; value: unknown }>,
  limit = 20,
  baseTime = new Date(),
): WorldBossGenerationPlan {
  const missingSettings = validateRequiredSettings(settingRows);
  if (missingSettings.length) {
    throw new Error(`Missing world boss settings: ${missingSettings.join(', ')}`);
  }

  if (anchor.confidence_status !== 'Confirmed') {
    throw new Error('Active world boss anchor must be Confirmed before generation.');
  }

  const settings = normalizeSettings(settingRows);
  const generationControl = settings.generation_control;

  if (generationControl?.prediction_enabled === false) {
    return {
      events: [],
      skipped: true,
      reason: generationControl.reason ?? 'World boss prediction is disabled.',
    };
  }

  const bossRotation = settings.boss_rotation;
  const locationRotation = settings.location_rotation;

  if (!bossRotation?.length || !locationRotation?.length) {
    throw new Error('Boss and location rotations are required before generation.');
  }

  const algorithm = settings.world_boss_algorithm;
  const intervalMinutes =
    anchor.interval_minutes || algorithm?.interval_minutes || 210;
  const intervalMs = intervalMinutes * 60 * 1000;
  const algorithmVersion =
    anchor.algorithm_version || algorithm?.algorithm_version || 'world-boss-v1';
  const seasonVersion = anchor.season_version ?? algorithm?.season_version ?? 'current';
  const defaultStatus =
    algorithm?.default_confidence_status === 'Needs verification'
      ? 'Needs verification'
      : 'Predicted';
  const anchorTime = new Date(anchor.anchor_spawn_time_utc).getTime();

  if (!Number.isFinite(anchorTime)) {
    throw new Error('Active world boss anchor has an invalid spawn time.');
  }

  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const baseTimeMs = baseTime.getTime();
  const firstFutureOffset =
    baseTimeMs >= anchorTime
      ? Math.floor((baseTimeMs - anchorTime) / intervalMs) + 1
      : 0;
  const events = Array.from({ length: safeLimit }, (_, index) => {
    const scheduleIndex = firstFutureOffset + index;
    const boss = getRotationItem(
      bossRotation,
      (anchor.boss_rotation_index ?? 0) + scheduleIndex,
    );
    const rotationLocation = getRotationItem(
      locationRotation,
      (anchor.location_rotation_index ?? 0) + scheduleIndex,
    );
    const location = resolveLocation(rotationLocation, settings.location_pool);
    const spawnTime = new Date(
      anchorTime + intervalMs * scheduleIndex,
    ).toISOString();

    return {
      boss_name: boss.boss_name,
      boss_slug: boss.boss_slug,
      spawn_time_utc: spawnTime,
      region: location.region ?? null,
      location_name: location.location_name,
      nearest_waypoint: location.nearest_waypoint ?? null,
      waypoint_confidence: location.waypoint_confidence ?? null,
      route_note: location.route_note ?? null,
      confidence_status: defaultStatus,
      source_type: 'algorithm',
      algorithm_version: algorithmVersion,
      season_version: seasonVersion,
      is_overridden: false,
    } satisfies WorldBossGeneratedEvent;
  });

  return {
    events,
    skipped: false,
    reason: settings.nahantu_rule?.enabled
      ? 'Nahantu rule is enabled; P0 keeps advisory behavior only.'
      : null,
  };
}
