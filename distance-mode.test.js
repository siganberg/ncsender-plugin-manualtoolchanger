// The tool setter routine used to end with G53 G91 G0 Z: G53 only lasts for
// that line, but G91 stayed modal, so the Post Tool Change G-code that runs
// next ran incremental. Run: node distance-mode.test.js
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const assert = require('assert');
function run(command, settingsRaw) {
  const code = fs.readFileSync(path.join(__dirname, 'commands.js'), 'utf8').replace(/^export \{[^}]*\};?\s*$/m, '');
  const ctx = { console, pluginContext: { armTlsWriteback() {}, getFirmwareSetting() { return null; } } };
  vm.createContext(ctx);
  vm.runInContext(code + '\n;this.__api = { onBeforeCommand, buildInitialConfig };', ctx);
  const settings = ctx.__api.buildInitialConfig(settingsRaw);
  const context = { machineState: { tool: 1, toolLengthSet: true, mpos: { x: 250, y: 300, z: -20 } }, tools: [1, 2, 3].map(n => ({ toolId: n, toolNumber: n })), safeZHeight: -5 };
  return ctx.__api.onBeforeCommand([{ command, isOriginal: true, displayCommand: null }], context, settings).map(c => c.command);
}
// Distance mode in effect when line `at` runs: the last G90/G91 before it.
function distAt(lines, at) {
  let mode = null;
  for (let i = 0; i < at; i++) {
    const m = lines[i].replace(/\(.*?\)|;.*$/g, '').match(/G9[01](?!\d)/g);
    if (m) mode = m[m.length - 1];
  }
  return mode;
}
const cfg = { toolSetter: { x: 10, y: 20, z: -80 }, parking: { x: 100, y: 50, z: 0 }, numberOfTools: 6, postToolChangeGcode: 'M8 (post marker)' };
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('M6: Post Tool Change G-code runs in G90, not G91', () => {
  const lines = run('M6 T2', cfg);
  const post = lines.findIndex(l => /post marker/.test(l));
  assert(post > 0, 'post snippet present');
  assert.equal(distAt(lines, post), 'G90');
});

t('$TLS: Post Tool Change G-code runs in G90', () => {
  const lines = run('$TLS', cfg);
  const post = lines.findIndex(l => /post marker/.test(l));
  assert(post > 0, 'post snippet present');
  assert.equal(distAt(lines, post), 'G90');
});

t('no G53 line carries G91', () => {
  for (const cmd of ['M6 T2', '$TLS']) {
    assert(!run(cmd, cfg).some(l => /G53/.test(l) && /G91/.test(l)), cmd);
  }
});

console.log(`${n} passed`);
