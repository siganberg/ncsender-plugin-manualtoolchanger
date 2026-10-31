// Pro keepout: with the Solo on, its G53 moves carry `$keepout_off` so the
// tool change and $POCKET1 can enter the ATC Zone; the move back to where
// the change started keeps its check. Run: node keepout.test.js
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const assert = require('assert');
function run(command, settingsRaw, edition) {
  const code = fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').replace(/^export \{[^}]*\};?\s*$/m, '');
  const ctx = { console, pluginContext: { armTlsWriteback() {}, getFirmwareSetting() { return null; } } };
  vm.createContext(ctx);
  vm.runInContext(code + '\n;this.__api = { onBeforeCommand, buildInitialConfig };', ctx);
  const settings = ctx.__api.buildInitialConfig(settingsRaw);
  const cmds = [{ command, isOriginal: true, displayCommand: null }];
  const ms = { tool: 1, toolLengthSet: true, mpos: { x: 300, y: -200, z: 0 } };
  const tools = [{ toolId: 1, toolNumber: 1 }, { toolId: 2, toolNumber: 2 }];
  return ctx.__api.onBeforeCommand(cmds, { machineState: ms, tools, safeZHeight: -5, edition }, settings).map(c => c.command);
}
const solo = { toolSetter: { x: 10, y: 20, z: -80 }, parking: { x: 100, y: 50 }, pocket1: { x: 5, y: 5 },
  autoSwap: true, numberOfTools: 4 };
const g53 = (lines) => lines.filter(l => /G53/.test(l));
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('Pro + Solo: every G53 move but the return carries $keepout_off', () => {
  const lines = g53(run('M6 T2', solo, 'pro'));
  const ret = lines.filter(l => /X300 Y-200/.test(l));
  assert.strictEqual(ret.length, 1);
  assert.ok(!ret[0].startsWith('$keepout_off'), ret[0]);
  assert.ok(!ret[0].includes('ncs-checked'), ret[0]);
  lines.filter(l => l !== ret[0]).forEach(l => assert.ok(l.startsWith('$keepout_off G53'), l));
});
t('Pro + Solo: $POCKET1 and $TLS carry $keepout_off', () => {
  g53(run('$POCKET1', solo, 'pro')).forEach(l => assert.ok(l.startsWith('$keepout_off G53'), l));
  g53(run('$TLS', solo, 'pro')).forEach(l => assert.ok(l.startsWith('$keepout_off G53'), l));
});
t('Community: no prefix, no marker', () => {
  run('M6 T2', solo, 'community').forEach(l => assert.ok(!/keepout_off|ncs-checked/.test(l), l));
});
t('Solo off: no prefix', () => {
  run('M6 T2', { ...solo, autoSwap: false }, 'pro').forEach(l => assert.ok(!/keepout_off|ncs-checked/.test(l), l));
});
t('keepoutPadding defaults to 60', () => {
  const code = fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').replace(/^export \{[^}]*\};?\s*$/m, '');
  const ctx = {}; vm.createContext(ctx); vm.runInContext(code + '\n;this.b = buildInitialConfig;', ctx);
  assert.strictEqual(ctx.b({}).keepoutPadding, 60);
  assert.strictEqual(ctx.b({ keepoutPadding: 25 }).keepoutPadding, 25);
});
console.log(`${n} passed`);
