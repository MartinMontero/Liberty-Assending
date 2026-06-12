import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));
await page.goto('http://localhost:8723/test/smoke.html');
await page.waitForFunction('window.__SMOKE_OK === true', { timeout: 15000 });
await page.screenshot({ path: 'test/smoke.png' });

// check the canvas isn't black
const stats = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  const g = document.createElement('canvas');
  g.width = c.width; g.height = c.height;
  const ctx = g.getContext('2d');
  ctx.drawImage(c, 0, 0);
  const d = ctx.getImageData(0, 0, g.width, g.height).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i+1] + d[i+2];
  return { avg: sum / (d.length / 4 * 3) };
});
console.log('pixel avg:', stats.avg.toFixed(2), '| console errors:', errors.length ? errors : 'none');
await browser.close();
process.exit(stats.avg > 5 && errors.length === 0 ? 0 : 1);
