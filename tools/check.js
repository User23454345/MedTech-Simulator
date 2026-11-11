// Rendert eine Route headless und meldet JS-Fehler.
// Usage: node tools/check.js '<hash-route>' [jsToEvalAfterLoad] [outfile.png]
const { chromium } = require('playwright');
(async () => {
  const [route = '#/', evalJs, out = 'check.png'] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const msgs = [];
  p.on('pageerror', e => msgs.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) msgs.push(m.type().toUpperCase() + ': ' + m.text()); });
  p.on('requestfailed', r => msgs.push('REQFAILED: ' + r.url()));
  await p.goto('file://' + require('path').resolve(__dirname, '..', 'index.html') + route);
  await p.waitForTimeout(1500);
  if (evalJs) { try { const r = await p.evaluate(evalJs); if (r !== undefined) console.log('EVAL:', JSON.stringify(r)); } catch (e) { msgs.push('EVALERROR: ' + e.message); } await p.waitForTimeout(1500); }
  await p.screenshot({ path: out });
  console.log(msgs.filter(m => process.env.ALL || !(m.startsWith('REQFAILED') || /ERR_FILE_NOT_FOUND/.test(m))).join('\n') || 'OK – no errors');
  await b.close();
})();
