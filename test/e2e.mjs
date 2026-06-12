// End-to-end playthrough: spawn → walk to torch → pick up → flare →
// ask-travel through all 7 chapters → plant the future → finale.
// Validates game state at every step and captures screenshots for review.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:8723';
const SHOTS = 'test/shots';
mkdirSync(SHOTS, { recursive: true });

const fails = [];
const check = (cond, label) => {
  console.log((cond ? '  ✔ ' : '  ✘ ') + label);
  if (!cond) fails.push(label);
};

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

const state = () => page.evaluate(() => window.game.state);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => { await page.screenshot({ path: `${SHOTS}/${name}.png` }); console.log(`  📸 ${name}`); };
const look = (yaw, pitch = 0) => page.evaluate(([y, p]) => window.game.look(y, p), [yaw, pitch]);

async function walkUntil(predicate, { key = 'w', timeout = 15000, hop = false } = {}) {
  await page.keyboard.down('Shift'); // sprint — headless fps makes walking real-time slow
  await page.keyboard.down(key);
  const t0 = Date.now();
  let ok = false, lastHop = 0;
  while (Date.now() - t0 < timeout) {
    const s = await state();
    if (predicate(s)) { ok = true; break; }
    if (hop && Date.now() - lastHop > 900) {
      lastHop = Date.now();
      await page.keyboard.down('Space');
      await sleep(150);
      await page.keyboard.up('Space');
    }
    await sleep(80);
  }
  await page.keyboard.up(key);
  await page.keyboard.up('Shift');
  return ok;
}

async function askTravel(phrase, expectZone) {
  await page.evaluate((p) => window.game.ask(p), phrase);
  const t0 = Date.now();
  let s = await state();
  while ((s.zone !== expectZone || s.traveling) && Date.now() - t0 < 9000) {
    await sleep(150);
    s = await state();
  }
  check(s.zone === expectZone, `ask "${phrase}" → ${expectZone}`);
  await sleep(1300); // fade-in + title card
  return s;
}

console.log('— LOADING —');
await page.goto(`${BASE}/index.html?test=1`);
await page.waitForFunction('window.__gameReady === true', { timeout: 30000 });
await sleep(1700); // intro fades in test mode
let s = await state();
check(s.zone === 'factory', 'spawns in the gigafactory');
check(!s.torchHeld, 'torch not yet held');

console.log('— CHAPTER 1: THE FACTORY —');
await shot('01-factory-spawn');
await look(0.5, 0.12);
await shot('02-factory-look-left');

// walk to the torch pedestal at z=14 (spawn z=30)
await look(0, -0.05);
const reached = await walkUntil((st) => Math.hypot(st.pos.x, st.pos.z - 14) < 3.0, { timeout: 25000 });
check(reached, 'walked to the torch pedestal');
s = await state();
check(/torch/i.test(s.prompt), `pickup prompt visible ("${s.prompt}")`);
await shot('03-torch-prompt');

await page.keyboard.press('e');
await sleep(400);
s = await state();
check(s.torchHeld, 'torch picked up (E)');
check(s.stage >= 1, 'objective advanced past pickup');
await shot('04-torch-held');

// flare at the hidden architecture
await look(Math.PI, 0.05); // face the factory hall (-z is yaw 0... turn around? no: hall is -z, reveals on back wall)
await look(0, 0.06);
await page.keyboard.down('f');
await sleep(2600); // headless fps ramps the flare slowly; instant on real GPUs
s = await state();
check(s.flare > 0.45, `torch flares via F (amount=${s.flare.toFixed(2)})`);
await shot('05-flare-reveal');
await page.keyboard.up('f');
await sleep(600);

console.log('— THE FIGHT: SEVER THE REAPER —');
// route: right corridor, then along the back, then in front of Robespierre
await look(-0.6, 0);
check(await walkUntil((st) => st.pos.x > 19, { timeout: 70000 }), 'reached the right corridor');
await look(0, 0);
check(await walkUntil((st) => st.pos.z < -36, { timeout: 90000 }), 'reached the back of the hall');
await look(Math.PI / 2, 0);
check(await walkUntil((st) => Math.abs(st.pos.x) < 6, { timeout: 60000 }), 'standing before the Reaper');
// aim at him and hold the flare to sever all six tendrils
await page.evaluate(() => {
  const s = window.game.state;
  const dx = 0 - s.pos.x, dz = -40 - s.pos.z;
  window.game.look(Math.atan2(-dx, -dz), 0.18);
});
await page.keyboard.down('f');
const tFight = Date.now();
let jaw = false;
while (Date.now() - tFight < 120000) {
  s = await state();
  if (/jaw hangs open/i.test(s.quest)) { jaw = true; break; }
  await sleep(400);
}
await page.keyboard.up('f');
check(jaw, `severed all six tendrils (quest: "${(await state()).quest}")`);
await shot('05b-reaper-severed');
// step into thrust range
await page.evaluate(() => {
  const s = window.game.state;
  const dx = 0 - s.pos.x, dz = -40 - s.pos.z;
  window.game.look(Math.atan2(-dx, -dz), 0.1);
});
await walkUntil((st) => Math.hypot(st.pos.x, st.pos.z + 40) < 7, { timeout: 30000 });
await page.keyboard.press('e');
await sleep(600);
s = await state();
check(s.inventory.includes('shard'), 'thrust the torch — NEURAL LACE SHARD acquired');
check(s.liberatedChapters.includes('factory'), 'chapter 1–2 liberated');

// jump sanity
await page.keyboard.down('Space');
let yMax = 0;
for (let i = 0; i < 20; i++) { await sleep(90); yMax = Math.max(yMax, (await state()).pos.y); }
await page.keyboard.up('Space');
check(yMax > 0.25, `jump works (peak y=${yMax.toFixed(2)})`);
await sleep(900);

console.log('— TRAVEL PANEL —');
await page.keyboard.press('t');
await sleep(450);
const panelOpen = await page.evaluate(() => document.getElementById('travel').classList.contains('open'));
check(panelOpen, 'travel panel opens with T');
await shot('06-travel-panel');
await page.keyboard.press('Escape');
await sleep(300);

console.log('— CHAPTER 3: VERSAILLES —');
await askTravel('take me to versailles', 'versailles');
await look(0, 0.04);
await shot('07-versailles');
await look(-0.9, 0.1);
await shot('08-versailles-marie');
// carry the shard into the Hall of Mirrors (around its outer wall, in through the mouth)
await look(-1.107, 0);
check(await walkUntil((st) => st.pos.x > 2038, { timeout: 90000 }), 'crossed the lawns to the hall mouth');
await look(0, 0);
check(await walkUntil((st) => st.pos.z < -12.5, { timeout: 60000 }), 'walked the Hall of Mirrors');
await page.keyboard.press('e');
await sleep(600);
s = await state();
check(s.liberatedChapters.includes('versailles'), 'deployed the shard — Versailles liberated');
await shot('08b-mirrors-deployed');

console.log('— CHAPTER 4: NFT GULAG —');
await askTravel('the NFT bazaar where rebellion is sold', 'gulag');
await look(0, 0.06);
await shot('09-gulag');

console.log('— CHAPTER 5: DAO OF THE DEAD —');
await askTravel('where the glass coffins are', 'necropolis');
await look(0, 0.04);
await shot('10-necropolis');
// flare among the graves
await page.keyboard.down('f'); await sleep(2600);
await shot('11-necropolis-flare');
await page.keyboard.up('f');

console.log('— CHAPTER 6: QUANTUM CARCERI —');
await askTravel('the quantum prison', 'carceri');
await look(0, 0.08);
await shot('12-carceri');

console.log('— CHAPTER 7: ETERNAL BETA —');
await askTravel('the eternal beta monolith', 'beta');
await look(0, 0.1);
await shot('13-beta');

console.log('— RETURN: FACTORY (revisit) —');
await askTravel('back to the burning factory', 'factory');

console.log('— EPILOGUE: THE GARDEN —');
await askTravel('the unseen garden', 'garden');
s = await state();
check(s.visited.length === 7, `all 7 chapters visited (${s.visited.length})`);
check(s.stage >= 4, `objective at planting stage (stage=${s.stage})`);
await look(0, 0.03);
await shot('14-garden');

// walk to the story circle (spawn z=34 → circle at local z=6; hop the log benches)
await look(0, -0.02);
const reachedCircle = await walkUntil(
  (st) => Math.hypot(st.pos.x - 12000, st.pos.z - 6) < 3.2,
  { timeout: 45000, hop: true },
);
check(reachedCircle, 'reached the story circle');
s = await state();
check(/plant/i.test(s.prompt), `planting prompt visible ("${s.prompt}")`);
await page.keyboard.press('e');
await sleep(300);
await page.keyboard.press('e');
await sleep(2600); // sapling grows
s = await state();
check(s.planted, 'planted the future');
check(s.stage === 5, 'finale reached');
await look(2.6, 0.05);
await shot('15-garden-planted');

console.log('— WRAP UP —');
const errs = consoleErrors.filter((e) => !/favicon/i.test(e));
check(errs.length === 0, `no console errors (${errs.length})`);
if (errs.length) console.log(errs.slice(0, 12).join('\n'));

await browser.close();
console.log(fails.length === 0 ? '\nALL CHECKS PASSED ✦' : `\n${fails.length} FAILURES:\n - ` + fails.join('\n - '));
process.exit(fails.length === 0 ? 0 : 1);
