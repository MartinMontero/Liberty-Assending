// Chapter 7 · The Eternal Beta — perpetual obsolescence, and the analog resistance.
import * as THREE from 'three';
import { Zone, mat, emat, box, cyl, ground, bounds, sky, glowPanel, reveal } from '../world.js';
import { textPanel, canvasTexture, codeTexture, skyGradient } from '../textures.js';
import { Particles } from '../particles.js';

export function buildBeta(world) {
  const z = new Zone({
    id: 'beta',
    name: 'The Eternal Beta',
    chapter: 'Chapter 7 · The Eternal Beta',
    origin: new THREE.Vector3(10000, 0, 0),
    fog: { color: 0x06110e, density: 0.016 },
    spawn: { x: 0, z: 36, yaw: 0 },
    keywords: ['beta', 'eternal', 'monolith', 'update', 'server', 'obsolete', 'fomo', 'drone',
      'library', 'dead tech', 'analog', 'chapter 7', 'radio', 'unrenderable'],
    short: 'A monolith of self-rewriting code; resistance goes analog.',
    narration: 'The air buzzes with the sterile hum of perpetual obsolescence. The Eternal Beta rewrites itself faster than thought, dissolving dissent into content, resistance into contentment. But in its blind spots the Unrenderables gather — rogue librarians, zine punks, a Frankenstein Server soldered from everything the Corp-Statists deemed worthless.',
    quote: '“Obsolescence is a design flaw.” — Logos, soldering RAM to a rotary phone',
  });
  world.register(z);

  sky(z, new THREE.MeshBasicMaterial({
    map: skyGradient([[0, '#020806'], [0.55, '#07211a'], [0.85, '#0a3a2c'], [1, '#031008']]),
  }));
  const hemi = new THREE.HemisphereLight(0x4a9a78, 0x081209, 0.9);
  z.add(hemi);

  // server-room floor
  const tileTex = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#11181a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80,220,170,.16)'; ctx.lineWidth = 2;
    for (let i = 0; i <= w; i += 128) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.04)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
  }, { repeat: [12, 12] });
  ground(z, 240, tileTex);
  bounds(z, 54);

  // ---- the Monolith ----
  const codeTex = codeTexture();
  const mono = new THREE.Mesh(new THREE.BoxGeometry(9, 28, 4), new THREE.MeshStandardMaterial({
    color: 0x041008, roughness: .35, metalness: .7,
    emissive: 0xffffff, emissiveMap: codeTex, emissiveIntensity: 1.1,
  }));
  mono.position.set(0, 14, -38);
  z.add(mono);
  z.collide(-4.5, 4.5, -40, -36, 28);
  z.onUpdate((dt) => { codeTex.offset.y += dt * .045; });
  const monoLight = new THREE.PointLight(0x46ff9a, 2.6, 44, 1.8);
  monoLight.position.set(0, 8, -32);
  z.add(monoLight);

  // eternal progress bar
  const barWrap = box(z, 10, .9, .3, mat(0x0a1410, { rough: .5 }), 0, 29.4, -38);
  const barFill = new THREE.Mesh(new THREE.BoxGeometry(1, .6, .35), emat(0x46ff9a, 2));
  barFill.position.set(0, 29.4, -37.9);
  z.add(barFill);
  const verTex = textPanel({
    lines: ['CIVIC VIRTUE™ v5.0.∞ — UPDATING FOREVER'], w: 1024, h: 96, bg: '#04130b', fg: '#7dffb0',
    font: 'bold 44px "Courier New", monospace', glow: '#7dffb0', border: '#0e3a26',
  });
  glowPanel(z, verTex, 12, 1.1, 0, 31, -38, { intensity: 1.6, double: true });
  z.onUpdate((dt, t) => {
    const k = (t * .06) % 1;                         // fills…
    const w = .2 + (k < .82 ? k : .82 - (k - .82) * 4) * 8; // …then snaps back: never done
    barFill.scale.x = Math.max(.2, w);
    barFill.position.x = -4.5 + (barFill.scale.x) / 2 + .2;
  });

  // disclaimers
  glowPanel(z, textPanel({
    lines: ['SIDE EFFECTS MAY INCLUDE:', 'HOPELESSNESS · NIHILISM · SUDDEN IRRELEVANCE'],
    w: 1280, h: 200, bg: '#07140d', fg: ['#9adcc0', '#ff7a6a'],
    font: 'bold 44px "Courier New", monospace', glow: '#ff7a6a', border: '#143a28', scan: true,
  }), 16, 2.6, 0, 3.4, -35.8, { intensity: 1.4 });

  // ---- taunting billboards ----
  const bb1 = glowPanel(z, textPanel({
    lines: ['YOUR OUTRAGE IS', 'SO LAST UPDATE'], w: 1024, h: 360, bg: '#0a0a14',
    fg: '#ff5e8a', font: 'bold 86px "Courier New", monospace', glow: '#ff5e8a', border: '#2c1a26', scan: true,
  }), 14, 5, -26, 8, -14, { rotY: Math.PI / 3.2, intensity: 1.6 });
  box(z, .5, 5.6, .5, mat(0x1a2024, { metal: .6, rough: .5 }), -26, 2.8, -14, { collide: true });
  const bb2 = glowPanel(z, textPanel({
    lines: ['AUTHENTICITY™', 'now a subscription — $9.99/mo'], w: 1024, h: 300, bg: '#0a0a14',
    fg: ['#8adcff', '#d8e8f4'], font: 'bold 64px "Courier New", monospace', glow: '#8adcff', border: '#16262e', scan: true,
  }), 14, 4.4, 26, 7.5, -10, { rotY: -Math.PI / 3.2, intensity: 1.6 });
  box(z, .5, 5.2, .5, mat(0x1a2024, { metal: .6, rough: .5 }), 26, 2.6, -10, { collide: true });
  z.onUpdate((dt, t) => {
    bb1.material.emissiveIntensity = 1.4 + .3 * Math.sin(t * 2.4) + (Math.random() < .03 ? .8 : 0);
    bb2.material.emissiveIntensity = 1.4 + .3 * Math.cos(t * 1.9);
  });

  // ---- dead server farm rows ----
  const ledTex = textPanel({ lines: ['◦ ◦ ▪'], w: 128, h: 32, bg: '#02060a', fg: '#2e8aff', font: '18px monospace', glow: '#2e8aff' });
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 5; i++) {
      const rx = -18 + i * 9, rz = 8 + r * 8;
      box(z, 2.2, 3.2, 1.2, mat(0x10181c, { metal: .6, rough: .5 }), rx, 1.6, rz, { collide: true });
      const led = glowPanel(z, ledTex, 1.6, .3, rx, 2.4, rz + .62, { intensity: .9 });
      const ph = i * 1.3 + r;
      z.onUpdate((dt, t) => {
        led.material.emissiveIntensity = Math.sin(t * 1.1 + ph) > .75 ? 1.4 : .12; // dying blinks
      });
    }
  }

  // ---- FOMO drones ----
  const droneMsgs = ['THAT PROTEST SLAPPED ▶ (until tomorrow)', 'FAKE VICTORY — 12M VIEWS', 'YOU MISSED IT. AGAIN.'];
  for (let i = 0; i < 3; i++) {
    const dr = new THREE.Group();
    const bodyD = new THREE.Mesh(new THREE.BoxGeometry(1.2, .3, 1.2), mat(0x1c242a, { metal: .8, rough: .3 }));
    dr.add(bodyD);
    for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .05, 10), new THREE.MeshBasicMaterial({
        color: 0x6a7a88, transparent: true, opacity: .4,
      }));
      rotor.position.set(ax * .75, .25, az * .75);
      dr.add(rotor);
    }
    const screen = glowPanel(z, textPanel({
      lines: [droneMsgs[i]], w: 1024, h: 130, bg: '#0c0c16', fg: '#ffd36b',
      font: 'bold 52px "Courier New", monospace', glow: '#ffd36b', border: '#2c2416', scan: true,
    }), 5, .66, 0, 0, 0, { intensity: 1.5, double: true });
    screen.position.set(0, -.9, 0);
    dr.add(screen);
    z.add(dr);
    const ra = 14 + i * 7, sp = .25 + i * .07, ph = i * 2.1;
    z.onUpdate((dt, t) => {
      const a = t * sp + ph;
      dr.position.set(Math.cos(a) * ra, 7.5 + Math.sin(t * .9 + i) * 1.2, -8 + Math.sin(a) * ra);
      dr.rotation.y = -a + Math.PI / 2;
    });
  }
  z.interact(0, 1.5, 2, 6, 'E — under the FOMO rain', () => {
    return 'FOMO Drones rain clips of fake victories. Wheatpaste laughs, slathering guerrilla poetry over their cameras: “You can’t virally shame a mimeograph.”';
  });

  // ---- Library of Dead Tech + Frankenstein Server ----
  const lib = new THREE.Group();
  lib.position.set(-30, 0, 18);
  lib.rotation.y = .8;
  // shelves
  for (let s = 0; s < 2; s++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(6, 3.4, .9), mat(0x4a3826, { rough: .9 }));
    shelf.position.set(s * 7 - 3, 1.7, 0);
    lib.add(shelf);
    for (let lvl = 0; lvl < 3; lvl++) {
      for (let k = 0; k < 7; k++) {
        const item = new THREE.Mesh(
          new THREE.BoxGeometry(.5, .62, .14),
          mat([0x224, 0x822, 0x282, 0x66a, 0xa62, 0x257][Math.floor(Math.random() * 6)] * 0x10 + 0x202020, { rough: .8 }),
        );
        item.position.set(s * 7 - 3 - 2.6 + k * .82, .65 + lvl * 1.1, .42);
        item.rotation.z = (Math.random() - .5) * .1;
        lib.add(item);
      }
    }
  }
  z.add(lib);
  z.collide(-36, -24, 14, 22, 3.5);
  // frankenstein server: mismatched towers + wires + mast
  const frank = new THREE.Group();
  frank.position.set(-22, 0, 26);
  const parts = [
    [1.4, 2, 1.2, 0x35506a, 0, 1, 0], [1, 1.4, 1, 0x6a5a35, 1.5, .7, .4],
    [.9, 2.6, .9, 0x4a3550, -1.4, 1.3, .5], [1.8, .8, 1.4, 0x2e4a3a, .2, 2.6, .2],
  ];
  for (const [w, h2, d, c, px, py, pz] of parts) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, h2, d), mat(c, { metal: .5, rough: .6 }));
    p.position.set(px, py, pz);
    p.rotation.y = Math.random() * .4;
    frank.add(p);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 5, 6), mat(0x8a8d94, { metal: .8, rough: .3 }));
  mast.position.set(.2, 5.4, .2);
  frank.add(mast);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 8), emat(0xffb347, 2.4));
  beacon.position.set(.2, 8, .2);
  frank.add(beacon);
  z.add(frank);
  z.collide(-24.5, -19.5, 23.5, 28.5, 3.4);
  // radio waves: expanding rings
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, .03, 6, 32), new THREE.MeshBasicMaterial({
      color: 0xffb347, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    ring.position.set(-21.8, 8, 26.2);
    ring.rotation.x = Math.PI / 2;
    z.add(ring);
    rings.push({ ring, phase: i / 3 });
  }
  z.onUpdate((dt, t) => {
    beacon.material.emissiveIntensity = 1.8 + Math.sin(t * 6) * .8;
    for (const r of rings) {
      const k = (t * .35 + r.phase) % 1;
      r.ring.scale.setScalar(.4 + k * 5);
      r.ring.material.opacity = .5 * (1 - k);
    }
  });
  glowPanel(z, textPanel({
    lines: ['LIBRARY OF DEAD TECH', '★ RESIST AT 33 RPM ★'], w: 1024, h: 220, bg: '#140e08',
    fg: ['#ffd9a0', '#ff8f6b'], font: 'bold 52px Georgia, serif', glow: '#ffd9a0', border: '#3a2c1a',
  }), 9, 2, -27, 4.6, 13.4, { rotY: .8, intensity: 1.4 });
  z.interact(-27, 1.5, 17, 6, 'E — the Frankenstein Server', () => {
    return 'Floppy disks, ham radios, mimeograph machines — soldered into a Frankenstein Server broadcasting static-laced labor history on pirate radio. The Beta’s algorithms choke on the analog noise.';
  });

  // ---- Memory Grenade ----
  cyl(z, .5, .65, 1, mat(0x2a2420, { rough: .6 }), 16, .5, 22, { collide: true });
  const pot = new THREE.Mesh(new THREE.SphereGeometry(.45, 10, 8), mat(0x8a5a32, { rough: .95 }));
  pot.scale.y = 1.15;
  pot.position.set(16, 1.4, 22);
  z.add(pot);
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(.13, .16, .2, 8), mat(0xc9b98a, { rough: .9 }));
  cork.position.set(16, 1.95, 22);
  z.add(cork);
  z.interact(16, 1.2, 22, 3.5, 'E — the Memory Grenade', () => {
    return 'A clay pot stuffed with handwritten letters in extinct languages, Polaroids of dead revolutions, and a cassette of her mother’s voice. The unencryptable. The unoptimized. The obsolete — and therefore unstoppable.';
  });

  // first acorns in the cracks (foreshadowing the garden)
  for (let i = 0; i < 3; i++) {
    const sx = -2 + i * 2.4, sz = -30.5;
    cyl(z, .02, .05, .8, mat(0x4a7c2c, { rough: 1 }), sx, .4, sz);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.16, 6, 5), mat(0x5a9a3a, { rough: 1 }));
    leaf.scale.set(1, .6, 1);
    leaf.position.set(sx, .85, sz);
    z.add(leaf);
  }
  z.interact(0, .5, -30, 4, 'E — saplings in the server-farm cracks', () => {
    return 'Liberty kneels, planting acorns in the cracks. “Let them rebrand. We’ll grow forests in their blind spots.”';
  });

  // dial-up motes: drifting glyphs
  const glyphs = new Particles({
    count: 40,
    flutter: .8,
    drag: .5,
    spawn: (p) => {
      p.x = (Math.random() - .5) * 90; p.z = (Math.random() - .5) * 90; p.y = 2 + Math.random() * 10;
      p.vy = .2;
      p.life = 4 + Math.random() * 4;
      p.size = .12;
      p.r = .3; p.g = 1; p.b = .6;
    },
  });
  z.add(glyphs.points);
  z.onUpdate((dt) => glyphs.update(dt));

  // ---- reveals ----
  reveal(z, { lines: ['CANCEL ANYTIME', '(YOU WON’T)'], w: 12, h: 4.4, x: 0, y: 8, z: -35.7, color: '#7dffb0' });
  reveal(z, { lines: ['FOMO IS THE PRODUCT'], w: 18, h: 2.6, x: 0, y: 5.5, z: 26, color: '#ff9ad5' });
  reveal(z, { lines: ['LEGACY = FREE'], w: 10, h: 2.2, x: -24, y: 6.5, z: 20, rotY: .8, color: '#ffd9a0' });

  return z;
}
