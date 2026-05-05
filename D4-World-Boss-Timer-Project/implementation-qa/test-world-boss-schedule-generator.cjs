const assert = require('node:assert/strict');
const fs = require('node:fs');
const moduleBuiltin = require('node:module');
const path = require('node:path');
const typescript = require('typescript');

const scheduleModulePath = path.resolve(
  __dirname,
  '../../lib/worldBossSchedule.ts',
);
const source = fs.readFileSync(scheduleModulePath, 'utf8');
const output = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
});

const compiledModule = new moduleBuiltin.Module(scheduleModulePath, module);
compiledModule.filename = scheduleModulePath;
compiledModule.paths = moduleBuiltin.Module._nodeModulePaths(
  path.dirname(scheduleModulePath),
);
compiledModule._compile(output.outputText, scheduleModulePath);

const {
  buildWorldBossGenerationPlan,
} = compiledModule.exports;

const anchor = {
  id: 'anchor_1',
  anchor_spawn_time_utc: '2026-05-04T07:30:00.000Z',
  anchor_boss: 'Ashava',
  anchor_boss_slug: 'ashava',
  anchor_location_name: 'Caen Adar',
  anchor_region: 'Scosglen',
  anchor_nearest_waypoint: 'Corbach',
  interval_minutes: 210,
  boss_rotation_index: 0,
  location_rotation_index: 1,
  season_version: 'S13',
  algorithm_version: 'world-boss-v1',
  confidence_status: 'Confirmed',
  is_active: true,
};

const settings = [
  {
    key: 'boss_pool',
    value: [
      { boss_name: 'Ashava', boss_slug: 'ashava' },
      { boss_name: 'Avarice', boss_slug: 'avarice' },
      { boss_name: 'Wandering Death', boss_slug: 'wandering-death' },
    ],
  },
  {
    key: 'location_pool',
    value: [
      {
        location_name: 'The Crucible',
        region: 'Fractured Peaks',
        nearest_waypoint: 'Yelesna',
        waypoint_confidence: 'Needs manual verification',
        route_note: 'Travel east from Yelesna and follow the arena road.',
      },
      {
        location_name: 'Caen Adar',
        region: 'Scosglen',
        nearest_waypoint: 'Corbach',
        waypoint_confidence: 'Needs manual verification',
        route_note: 'Ride northwest from Corbach and enter the arena from the southern path.',
      },
    ],
  },
  {
    key: 'boss_rotation',
    value: [
      { boss_name: 'Ashava', boss_slug: 'ashava' },
      { boss_name: 'Avarice', boss_slug: 'avarice' },
      { boss_name: 'Wandering Death', boss_slug: 'wandering-death' },
    ],
  },
  {
    key: 'location_rotation',
    value: [
      { location_name: 'The Crucible', region: 'Fractured Peaks' },
      { location_name: 'Caen Adar', region: 'Scosglen' },
    ],
  },
  {
    key: 'world_boss_algorithm',
    value: {
      interval_minutes: 210,
      algorithm_version: 'world-boss-v1',
      season_version: 'S13',
      default_confidence_status: 'Predicted',
    },
  },
  {
    key: 'generation_control',
    value: { prediction_enabled: true, reason: null },
  },
  {
    key: 'nahantu_rule',
    value: { enabled: false },
  },
  {
    key: 'announcement_message',
    value: { enabled: false, message: null },
  },
];

const plan = buildWorldBossGenerationPlan(
  anchor,
  settings,
  20,
  new Date('2026-05-05T00:00:00.000Z'),
);

assert.equal(plan.skipped, false);
assert.equal(plan.events.length, 20);
assert.equal(plan.events[0].spawn_time_utc, '2026-05-05T01:00:00.000Z');
assert.equal(plan.events[0].boss_name, 'Wandering Death');
assert.equal(plan.events[0].location_name, 'The Crucible');
assert.equal(plan.events[0].confidence_status, 'Predicted');
assert.equal(plan.events[0].source_type, 'algorithm');
assert.equal(plan.events[0].is_overridden, false);

const disabledPlan = buildWorldBossGenerationPlan(
  anchor,
  settings.map((setting) =>
    setting.key === 'generation_control'
      ? {
          ...setting,
          value: { prediction_enabled: false, reason: 'maintenance' },
        }
      : setting,
  ),
  20,
  new Date('2026-05-05T00:00:00.000Z'),
);

assert.equal(disabledPlan.skipped, true);
assert.equal(disabledPlan.events.length, 0);
assert.equal(disabledPlan.reason, 'maintenance');

console.log('world boss schedule generator smoke passed');
