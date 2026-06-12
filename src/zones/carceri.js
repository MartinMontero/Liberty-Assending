// Chapter 6 · Quantum Carceri — the superposition prison.
import * as THREE from 'three';
import { Zone, mat, emat, box, ground, bounds, sky, glowPanel, reveal } from '../world.js';
import { textPanel, canvasTexture } from '../textures.js';
import { fireflies } from '../particles.js';

export function buildCarceri(world) {
  const z = new Zone({
    id: 'carceri',
    name: 'Quantum Carceri',
    chapter: 'Chapter 6 · Quantum Carceri',
    origin: new THREE.Vector3(8000, 0, 0),
    fog: { color: 0x0c0616, density: 0.017 },
    spawn: { x: 0, z: 34, yaw: 0 },
    keywords: ['quantum', 'carceri', 'prison', 'warden', 'superposition', 'cell', 'cells',
      'probability', 'guilt', 'chapter 6', 'schrodinger', 'paradox'],
    short: 'Every corridor both escape route and dead end; guilty until observed.',
    narration: 'The sky is a flicker of collapsing probabilities. The prison exists in superposition — every corridor both escape route and dead end, every door a portal to a cell that hasn’t been built yet. The Quantum Warden drifts in a haze of collapsing wave functions, a chorus of all possible oppressions.',
    quote: '“You are already guilty. You have always been guilty.” — the Quantum Warden',
  });
  world.register(z);

  // ---- probability-storm sky (animated shader) ----
  const stormMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } },
    vertexShader: /* glsl */`
      varying vec3 vP;
      void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uT;
      varying vec3 vP;
      void main(){
        vec3 d = normalize(vP);
        float bands = sin(d.y * 14.0 + uT * .5 + sin(d.x * 6.0 + uT * .3) * 2.0);
        float swirl = sin(atan(d.z, d.x) * 5.0 - uT * .4 + d.y * 8.0);
        float k = smoothstep(-.2, 1.0, bands * .5 + swirl * .5);
        float flick = step(.985, fract(sin(floor(uT * 9.0) * 78.233) * 43758.5)) * .35;
        vec3 deep = vec3(.03, .01, .09);
        vec3 violet = vec3(.26, .08, .45);
        vec3 magenta = vec3(.55, .12, .5);
        vec3 col = mix(deep, violet, k) + magenta * pow(max(0.0, swirl), 6.0) * .4 + flick;
        gl_FragColor = vec4(col, 1.0);
      }`,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  sky(z, stormMat);
  z.onUpdate((dt, t) => { stormMat.uniforms.uT.value = t; });

  const hemi = new THREE.HemisphereLight(0x6a4ab0, 0x0a0614, 0.75);
  z.add(hemi);
  const key = new THREE.PointLight(0xc060ff, 2, 60, 1.6);
  key.position.set(0, 22, -10);
  z.add(key);

  // void-grid ground
  const gridTex = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#0a0712'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(150,90,255,.4)'; ctx.lineWidth = 2;
    for (let i = 0; i <= w; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(150,90,255,.18)';
    for (let i = 0; i < 24; i++) ctx.fillRect(Math.floor(Math.random() * 8) * 64, Math.floor(Math.random() * 8) * 64, 64, 64);
  }, { repeat: [14, 14] });
  const floor = ground(z, 240, gridTex, { rough: .8 });
  floor.material.emissive = new THREE.Color(0xffffff);
  floor.material.emissiveMap = gridTex;
  floor.material.emissiveIntensity = .55;
  bounds(z, 50);

  // ---- phasing cell blocks ----
  const cellMat = () => new THREE.MeshStandardMaterial({
    color: 0x1a1430, roughness: .35, metalness: .6, transparent: true, opacity: .8,
    emissive: 0x5a2a9a, emissiveIntensity: .35,
  });
  const barTexture = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(220,190,255,.9)';
    for (let x = 8; x < w; x += 24) ctx.fillRect(x, 0, 6, h);
  }, { srgb: false });
  const cells = [];
  const cellDefs = [
    [-16, 0, -6, 0], [16, 2, -10, .5], [-24, 4, -20, 1], [24, 1, -24, 1.5],
    [-8, 6, -30, 2], [8, 3, -34, 2.5], [0, 8, -18, 3], [-30, 2, 4, 3.5],
    [30, 5, 8, 4], [-14, 1, 16, 4.5], [18, 7, 20, 5],
  ];
  for (const [cx, cy, cz, phase] of cellDefs) {
    const cell = new THREE.Group();
    const bx = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 5), cellMat());
    cell.add(bx);
    const bars = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.6), new THREE.MeshBasicMaterial({
      map: barTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: .9,
    }));
    bars.position.z = 2.55;
    cell.add(bars);
    cell.position.set(cx, cy + 2, cz);
    z.add(cell);
    cells.push({ cell, bx, bars, phase, baseY: cy + 2 });
  }
  z.onUpdate((dt, t) => {
    for (const c of cells) {
      const k = .5 + .5 * Math.sin(t * .9 + c.phase);            // existence amplitude
      c.bx.material.opacity = .1 + k * .75;
      c.bars.material.opacity = .05 + k * .8;
      c.cell.position.y = c.baseY + Math.sin(t * .55 + c.phase * 2) * .8;
      c.cell.rotation.y = Math.sin(t * .3 + c.phase) * .3;
    }
  });

  // ---- superposed doors: a corridor where every door is open AND closed ----
  for (let i = 0; i < 5; i++) {
    const dz = 6 - i * 7;
    const frame = new THREE.Group();
    frame.position.set(-2, 0, dz);
    const fmat = mat(0x2a2244, { metal: .5, rough: .5 });
    const l = new THREE.Mesh(new THREE.BoxGeometry(.4, 4.4, .4), fmat); l.position.set(-1.4, 2.2, 0); frame.add(l);
    const r = new THREE.Mesh(new THREE.BoxGeometry(.4, 4.4, .4), fmat); r.position.set(1.4, 2.2, 0); frame.add(r);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, .4, .4), fmat); top.position.set(0, 4.4, 0); frame.add(top);
    const doorClosed = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.2), new THREE.MeshStandardMaterial({
      color: 0x130e26, emissive: 0x40208a, emissiveIntensity: .5, transparent: true, opacity: .6, side: THREE.DoubleSide,
    }));
    doorClosed.position.y = 2.1;
    frame.add(doorClosed);
    const doorOpen = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.2), new THREE.MeshStandardMaterial({
      color: 0x130e26, emissive: 0x40208a, emissiveIntensity: .5, transparent: true, opacity: .3, side: THREE.DoubleSide,
    }));
    doorOpen.position.set(1.25, 2.1, -1.2);
    doorOpen.rotation.y = Math.PI / 2.4;
    frame.add(doorOpen);
    z.add(frame);
    const ph = i * 1.3;
    z.onUpdate((dt, t) => {
      const k = .5 + .5 * Math.sin(t * 1.1 + ph);
      doorClosed.material.opacity = k * .75;
      doorOpen.material.opacity = (1 - k) * .75;
    });
  }

  // ---- the Quantum Warden: a figure in superposition ----
  const warden = new THREE.Group();
  const wardenCopies = [];
  for (let i = 0; i < 3; i++) {
    const copy = new THREE.Group();
    const robe = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.6, 10), new THREE.MeshStandardMaterial({
      color: 0xd8c8ff, roughness: .3, metalness: .2, transparent: true, opacity: .3,
      emissive: 0x8a5aff, emissiveIntensity: .6, depthWrite: false,
    }));
    robe.position.y = 1.8;
    copy.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.42, 12, 10), new THREE.MeshStandardMaterial({
      color: 0xffffff, transparent: true, opacity: .35, emissive: 0xb09aff, emissiveIntensity: .9, depthWrite: false,
    }));
    head.position.y = 4;
    copy.add(head);
    for (const ex of [-.15, .15]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 6), emat(0xffffff, 4));
      eye.position.set(ex, 4.05, .36);
      copy.add(eye);
    }
    warden.add(copy);
    wardenCopies.push({ copy, phase: i * 2.1 });
  }
  warden.position.set(0, 0, -26);
  z.add(warden);
  const wardenLight = new THREE.PointLight(0xb08aff, 2, 22, 1.8);
  wardenLight.position.set(0, 3, -26);
  z.add(wardenLight);
  z.onUpdate((dt, t, player, playerWorld) => {
    // drifts slowly toward you, never quite arriving
    const dx = player.x - warden.position.x, dz = player.z - warden.position.z;
    const d = Math.hypot(dx, dz);
    if (d > 9 && d < 34) {
      warden.position.x += (dx / d) * dt * .55;
      warden.position.z += (dz / d) * dt * .55;
    }
    warden.rotation.y = Math.atan2(dx, dz);
    wardenLight.position.set(warden.position.x, 3, warden.position.z);
    for (const wc of wardenCopies) {
      const k = Math.sin(t * 1.7 + wc.phase);
      wc.copy.position.x = Math.sin(t * .9 + wc.phase) * .5;
      wc.copy.position.z = Math.cos(t * 1.2 + wc.phase) * .3;
      wc.copy.children.forEach((ch) => {
        if (ch.material && ch.material.transparent) ch.material.opacity = .12 + .25 * Math.abs(k);
      });
    }
  });
  z.interact(0, 1.5, -26, 9, 'E — face the Quantum Warden', () => {
    return 'It wears your worst memory like a mask. “Mija… you failed me. You’ll fail them too.” — Logos screams from four timelines away: “It’s a Bayesian guilt trap! Break the probability distribution!”';
  });

  // ---- the Apology Algorithm shrine ----
  const tablets = [
    ['ADMIT HARM', '“I left you.”'],
    ['REJECT ABSOLUTION', '“I don’t deserve forgiveness.”'],
    ['ACT ANYWAY', '“I’ll fight until I do.”'],
  ];
  tablets.forEach(([title, sub], i) => {
    const tx = -8 + i * 8;
    const tablet = glowPanel(z, textPanel({
      lines: [title, sub], w: 640, h: 320, bg: '#120a24', fg: ['#ffd9a0', '#cbb4ff'],
      font: 'bold 52px Georgia, serif', glow: '#ffd9a0', border: '#3a2a5a',
    }), 4.4, 2.2, tx, 3, -44, { intensity: 1.3, double: true });
    z.onUpdate((dt, t) => {
      tablet.position.y = 3 + Math.sin(t * .8 + i * 2.1) * .3;
      tablet.rotation.y = Math.sin(t * .4 + i) * .15;
    });
  });
  z.interact(0, 1.5, -42, 8, 'E — the Apology Algorithm', () => {
    return 'Admit Harm. Reject Absolution. Act Anyway. The equations rupture — you are both coward and survivor, failure and catalyst. The Warden’s binary logic short-circuits.';
  });

  // paradox text ring
  glowPanel(z, textPanel({
    lines: ['THE ONLY WAY OUT', 'IS TO ALREADY BE FREE'], w: 1280, h: 300, bg: null, fg: '#e8d8ff',
    font: 'italic bold 84px Georgia, serif', glow: '#b48aff',
  }), 26, 6, 0, 14, -34, { intensity: 1.6, double: true, cutout: true });
  const eq1 = glowPanel(z, textPanel({
    lines: ['P(GUILT | OBSERVED) = 1'], w: 768, h: 110, bg: null, fg: '#8adcff',
    font: 'bold 54px "Courier New", monospace', glow: '#8adcff',
  }), 10, 1.4, -20, 7, -2, { rotY: -.35, intensity: 1.4, cutout: true });
  const eq2 = glowPanel(z, textPanel({
    lines: ['ψ = COWARD + SURVIVOR'], w: 768, h: 110, bg: null, fg: '#ff9ad5',
    font: 'bold 54px "Courier New", monospace', glow: '#ff9ad5',
  }), 10, 1.4, 20, 9, 0, { rotY: .35, intensity: 1.4, cutout: true });
  z.onUpdate((dt, t) => {
    eq1.position.y = 7 + Math.sin(t * .6) * .5;
    eq2.position.y = 9 + Math.cos(t * .5) * .5;
  });

  // probability motes
  const motes = fireflies({ box: [70, 16, 70], cy: 8, count: 90, color: [.7, .5, 1], size: .14 });
  z.add(motes.points);
  z.onUpdate((dt) => motes.update(dt));

  // ---- reveals ----
  reveal(z, { lines: ['BAYESIAN GUILT TRAP'], w: 18, h: 2.8, x: 0, y: 6, z: 18, color: '#8adcff' });
  reveal(z, { lines: ['OBSERVATION ≠ LEGITIMACY'], w: 20, h: 2.8, x: -26, y: 5, z: -12, rotY: Math.PI / 2, color: '#b48cff' });
  reveal(z, { lines: ['YOU WERE ALWAYS FREE'], w: 16, h: 2.8, x: 0, y: .15, z: -8, rotX: -Math.PI / 2, color: '#ffd9a0', maxOpacity: .9 });

  return z;
}
