// The Solo's ATC Zone used to be published by the settings page when Save
// was pressed, so an update that changed it did nothing until the user saved
// again. ncSender now calls onSettingsApplied at startup, after an update, on
// Save and on connect. Run: node settings-applied.test.js
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const assert = require('assert');
const { test } = require('node:test');

const LIMITS = { minX: 0, maxX: 1200, minY: -800, maxY: 0 };
function load(pluginContext) {
  const code = fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').replace(/^export \{[^}]*\};?\s*$/m, '');
  const ctx = { console, pluginContext };
  vm.createContext(ctx);
  vm.runInContext(code + '\n;this.__api = { onSettingsApplied, keepoutZonesToPublish, buildInitialConfig };', ctx);
  return ctx.__api;
}
function host(overrides = {}) {
  const calls = [];
  return { calls, ctx: { getMachineLimits: () => LIMITS, setKeepoutZones: (z) => { calls.push(JSON.parse(JSON.stringify(z))); return true; }, ...overrides } };
}
const SOLO = { autoSwap: true, pocket1: { x: 30, y: -700 }, keepoutPadding: 60 };

test('with the Solo on, its pocket is published, cut off at the travel', () => {
  const h = host(); const api = load(h.ctx);
  api.onSettingsApplied(api.buildInitialConfig(SOLO));
  assert.deepStrictEqual(h.calls, [[{ name: 'ATC Zone', minX: 0, minY: -760, maxX: 90, maxY: -640 }]]);
});

test('with the Solo off, the zone is removed, travel known or not', () => {
  for (const limits of [LIMITS, null]) {
    const h = host({ getMachineLimits: () => limits }); const api = load(h.ctx);
    api.onSettingsApplied(api.buildInitialConfig({ ...SOLO, autoSwap: false }));
    assert.deepStrictEqual(h.calls, [[]]);
  }
});

test('the zone is left as it is while the travel is unknown', () => {
  const h = host({ getMachineLimits: () => null }); const api = load(h.ctx);
  api.onSettingsApplied(api.buildInitialConfig(SOLO));
  assert.deepStrictEqual(h.calls, []);
});

test('a pocket wholly off the bed changes nothing', () => {
  const api = load(host().ctx);
  assert.strictEqual(api.keepoutZonesToPublish(api.buildInitialConfig({ ...SOLO, pocket1: { x: -500, y: -700 } }), LIMITS), null);
});

test('Community (no keepout) and an older app are left alone', () => {
  const h = host({ setKeepoutZones: undefined }); const api = load(h.ctx);
  assert.doesNotThrow(() => api.onSettingsApplied(api.buildInitialConfig(SOLO)));
  assert.doesNotThrow(() => load({}).onSettingsApplied(api.buildInitialConfig(SOLO)));
  assert.doesNotThrow(() => load(undefined).onSettingsApplied(api.buildInitialConfig(SOLO)));
});
