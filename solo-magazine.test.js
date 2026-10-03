// RapidChangeSolo magazine: with Auto Swap on, a tool goes through the Solo
// only when the Tool Library puts it in one of the Magazine Size slots.
// Anything else (outside the magazine, unknown to the library, the probe) is
// swapped by hand. Run: node solo-magazine.test.js
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
const solo = { toolSetter: { x: 10, y: 20, z: -80 }, parking: { x: 100, y: 50, z: 0 }, pocket1: { x: 5, y: 5, z: 0 },
  autoSwap: true, numberOfTools: 4, loadRpm: 1200, unloadRpm: 1500 };
const empty = { tool: 0, toolLengthSet: true, mpos: { x: 0, y: 0, z: 0 } };
const holding = (tool) => ({ ...empty, tool });
// Loading through the Solo spins the spindle; a hand load shows the manual message.
const soloLoad = (lines, id) => lines.some(l => l.includes(`LOAD_MESSAGE_${id}`)) && lines.some(l => /^M3 S1200/.test(l.trim()));
const handLoad = (lines, id) => lines.some(l => /LOAD_MESSAGE_MANUAL_|SWAP_MESSAGE_MANUAL_/.test(l) && l.endsWith(`_${id})`));
const library = [
  { toolId: 300, toolNumber: 2 },      // in the magazine
  { toolId: 50, toolNumber: null },    // a 3D probe kept outside the magazine
  { toolId: 77, toolNumber: 6 },       // a slot past the Magazine Size
];
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('a tool in a magazine slot loads through the Solo', () => {
  const lines = run('M6 T300', empty, solo, library);
  assert.ok(soloLoad(lines, 300), lines.join('\n'));
});

t('a tool kept outside the magazine (3D probe) is loaded by hand', () => {
  const lines = run('M6 T50', empty, solo, library);
  assert.ok(handLoad(lines, 50), lines.join('\n'));
  assert.ok(!lines.some(l => /^M3 S/.test(l.trim())), 'no spin for a hand load');
});

t('a tool the library does not know is loaded by hand (no T = slot fallback)', () => {
  const lines = run('M6 T3', empty, solo, library);
  assert.ok(handLoad(lines, 3), lines.join('\n'));
});

t('a slot past the Magazine Size is loaded by hand', () => {
  const lines = run('M6 T77', empty, solo, library);
  assert.ok(handLoad(lines, 77), lines.join('\n'));
});

t('Tool Library off: built-in Tool N in slot N goes through the Solo', () => {
  const builtIn = [1, 2, 3, 4].map(n => ({ toolId: n, toolNumber: n }));
  const lines = run('M6 T3', empty, solo, builtIn);
  assert.ok(soloLoad(lines, 3), lines.join('\n'));
});

t('unloading a hand-loaded tool is a hand swap, not a Solo spin-off', () => {
  const lines = run('M6 T300', holding(50), solo, library);
  assert.ok(!lines.some(l => /^M4 S1500/.test(l.trim())), 'the 3D probe must not be spun off');
});

t('unloading a magazine tool spins it off in the Solo', () => {
  const lines = run('M6 T50', holding(300), solo, library);
  assert.ok(lines.some(l => /^M4 S1500/.test(l.trim())), lines.join('\n'));
});

t('without the Solo every tool is a hand swap', () => {
  const lines = run('M6 T300', empty, { ...solo, autoSwap: false }, library);
  assert.ok(handLoad(lines, 300), lines.join('\n'));
  assert.ok(!lines.some(l => /^M[34] S/.test(l.trim())));
});

console.log(`${n} passed`);
