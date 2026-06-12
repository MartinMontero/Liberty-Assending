// Fast visual review: teleport through zones, pick torch via API path, screenshot angles.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const SHOTS = 'test/shots';
mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('PAGEERROR:', e));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (fn, arg) => page.evaluate(fn, arg);

await page.goto('http://localhost:8723/index.html?test=1');
await page.waitForFunction('window.__gameReady === true', { timeout: 30000 });
await sleep(1500);
await ev(() => document.getElementById('narration').style.opacity = 0);
await ev(() => document.getElementById('toast').style.opacity = 0);

const plan = [
  { zone: 'factory', views: [[0, 0.04, 'a'], [0.62, 0.08, 'b'], [-0.7, 0.1, 'c']] },
  { zone: 'versailles', views: [[0, 0.05, 'a'], [0.85, 0.12, 'b'], [-1.1, 0.06, 'c']] },
  { zone: 'gulag', views: [[0, 0.05, 'a'], [0.8, 0.04, 'b'], [-1.2, 0.12, 'c']] },
  { zone: 'necropolis', views: [[0, 0.04, 'a'], [0.9, 0.05, 'b'], [-0.8, 0.1, 'c']] },
  { zone: 'carceri', views: [[0, 0.08, 'a'], [1.1, 0.15, 'b'], [-1.0, 0.05, 'c']] },
  { zone: 'beta', views: [[0, 0.1, 'a'], [1.0, 0.08, 'b'], [-1.0, 0.06, 'c']] },
  { zone: 'garden', views: [[0, 0.03, 'a'], [1.3, 0.05, 'b'], [-2.6, 0.08, 'c']] },
];

// grab the torch first (so it appears in shots) — teleport next to it
await ev(() => { const p = window.game; p.look(0, 0); });
// walk-free pickup: jump player to the pedestal via travel API then nudge
await ev(() => window.game.travelTo('factory'));
await sleep(2500);
await page.keyboard.down('Shift');
await page.keyboard.down('w');
await page.waitForFunction(() => {
  const s = window.game.state;
  return Math.hypot(s.pos.x, s.pos.z - 14) < 3.0;
}, { timeout: 30000 });
await page.keyboard.up('w');
await page.keyboard.up('Shift');
await ev(() => window.game.use());
await sleep(300);
console.log('torch:', (await ev(() => window.game.state.torchHeld)) ? 'held' : 'MISSING');
await ev(() => document.getElementById('toast').style.opacity = 0);

for (const step of plan) {
  await ev((id) => window.game.travelTo(id), step.zone);
  await sleep(2600);
  await ev(() => { document.getElementById('narration').style.opacity = 0; document.getElementById('titlecard').style.opacity = 0; });
  await sleep(400);
  for (const [yaw, pitch, tag] of step.views) {
    await ev(([y, p]) => window.game.look(y, p), [yaw, pitch]);
    await sleep(450);
    await page.screenshot({ path: `${SHOTS}/z-${step.zone}-${tag}.png` });
  }
  console.log('shot', step.zone);
}

// flare shot in factory
await ev((id) => window.game.travelTo(id), 'factory');
await sleep(2600);
await ev(() => { document.getElementById('narration').style.opacity = 0; document.getElementById('titlecard').style.opacity = 0; });
await ev(() => window.game.look(0, 0.02));
await ev(() => window.game.flare(true));
await sleep(3200);
await page.screenshot({ path: `${SHOTS}/z-factory-flare.png` });
await ev(() => window.game.flare(false));
console.log('shot flare');

await browser.close();
console.log('done');
