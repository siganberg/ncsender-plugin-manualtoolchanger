// Probe -> tool is one prompt and one pause: "remove the probe and install
// T1", then the TLS. Two pauses back to back with no move between them let
// Continue on the first release the second, and the TLS ran on an empty
// spindle. Run: node probe-swap.test.js
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const assert = require('assert');
function run(command, ms, settingsRaw, tools) {
  const code = fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').replace(/^export \{[^}]*\};?\s*$/m, '');
  const ctx = { console, pluginContext: { armTlsWriteback() {}, getFirmwareSetting() { return null; } } };
  vm.createContext(ctx);
  vm.runInContext(code + '\n;this.__api = { onBeforeCommand, buildInitialConfig };', ctx);
  const settings = ctx.__api.buildInitialConfig(settingsRaw);
  const cmds = [{ command, isOriginal: true, displayCommand: null }];
  return ctx.__api.onBeforeCommand(cmds, { machineState: ms, tools, safeZHeight: -5 }, settings).map(c => c.command);
}
const base = { toolSetter: { x: 10, y: 20, z: -80 }, parking: { x: 100, y: 50, z: 0 }, pocket1: { x: 5, y: 5, z: 0 },
  loadRpm: 1200, unloadRpm: 1500 };
const holding = (tool) => ({ tool, toolLengthSet: true, mpos: { x: 0, y: 0, z: 0 } });
const lib = [{ toolId: 1, toolNumber: 1 }, { toolId: 2, toolNumber: 2 }];
const pauses = (lines) => lines.filter(l => /^M0$/.test(l.trim())).length;
const msgs = (lines) => lines.filter(l => /PLUGIN_MANUALTOOLCHANGE:/.test(l));
const firstTls = (lines) => lines.findIndex(l => /G38\.[23]/.test(l));
const lastPause = (lines) => lines.map(l => l.trim()).lastIndexOf('M0');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('probe -> T1 by hand: one prompt naming the probe, one pause, TLS after it', () => {
  const lines = run('M6 T1', holding(99), base, lib);
  assert.strictEqual(pauses(lines), 1, lines.join('\n'));
  assert.deepStrictEqual(msgs(lines).map(l => l.trim()), ['(MSG, PLUGIN_MANUALTOOLCHANGE:SWAP_FROM_PROBE_MANUAL_1)']);
  assert.ok(firstTls(lines) > lastPause(lines), 'TLS runs after the prompt');
});

t('probe -> T1 through the Solo: one prompt naming the probe, one pause', () => {
  const lines = run('M6 T1', holding(99), { ...base, autoSwap: true, numberOfTools: 4 }, lib);
  assert.strictEqual(pauses(lines), 1, lines.join('\n'));
  assert.ok(msgs(lines).some(l => l.includes('LOAD_AFTER_PROBE_MESSAGE_1')), lines.join('\n'));
});

t('probe -> nothing (T0) keeps the "unload probe" prompt', () => {
  const lines = run('M6 T0', holding(99), base, lib);
  assert.strictEqual(pauses(lines), 1, lines.join('\n'));
  assert.ok(msgs(lines).some(l => l.includes('MANUAL_UNLOAD_PROBE_99')), lines.join('\n'));
});

t('with a Probe Unload routine the load prompt is the usual swap one', () => {
  const lines = run('M6 T1', holding(99), { ...base, probeUnloadGcode: 'G4 P0.1' }, lib);
  assert.strictEqual(pauses(lines), 1, lines.join('\n'));
  assert.ok(msgs(lines).some(l => l.includes('SWAP_MESSAGE_MANUAL_1')), lines.join('\n'));
});

t('T1 -> T2 by hand is unchanged: one prompt', () => {
  const lines = run('M6 T2', holding(1), base, lib);
  assert.strictEqual(pauses(lines), 1, lines.join('\n'));
  assert.ok(msgs(lines).some(l => /(LOAD|SWAP)_MESSAGE_MANUAL_2\)/.test(l)), lines.join('\n'));
});

t('T1 -> probe is unchanged: one "load probe" prompt', () => {
  const lines = run('M6 T99', holding(1), base, lib);
  assert.ok(msgs(lines).some(l => l.includes('MANUAL_LOAD_PROBE_99')), lines.join('\n'));
});

console.log(`${n} passed`);
