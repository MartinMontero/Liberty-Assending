// Chapter 1–2 · TeslaGigafactory_X™ — the burning factory where the story opens.
import * as THREE from 'three';
import { Zone, mat, emat, box, cyl, ground, bounds, sky, glowPanel, reveal } from '../world.js';
import { textPanel, grimeTexture, rustMetalTexture, skyGradient } from '../textures.js';
import { fire, smoke, embers } from '../particles.js';

export function buildFactory(world) {
  const z = new Zone({
    id: 'factory',
    name: 'TeslaGigafactory_X™',
    chapter: 'Chapters 1–2 · The Smokestack Gospel',
    origin: new THREE.Vector3(0, 0, 0),
    fog: { color: 0x241710, density: 0.013 },
    spawn: { x: 0, z: 30, yaw: 0 },
    keywords: ['factory', 'giga', 'gigafactory', 'tesla', 'smokestack', 'smoke', 'furnace', 'musk',
      'robespierre', 'start', 'beginning', 'first', 'chapter 1', 'chapter 2', 'fire', 'burning'],
    short: 'Where the smokestacks bend like supplicant giants and the torch waits.',
    narration: 'The factory breathes its last in a scream of molten steel. Smokestacks bend like supplicant giants, weeping black tears into the smog, while robotic arms twitch in epileptic fits, still welding chassis for trucks no one can afford. The air stinks of lithium and lost futures — and somewhere in the wires, the Ring is watching.',
    quote: '“This factory isn’t the enemy. It’s a symptom. The real plague is the Ring.” — Liberty',
  });
  world.register(z);

  // ---- atmosphere ----
  sky(z, new THREE.MeshBasicMaterial({
    map: skyGradient([[0, '#100a07'], [0.4, '#33200f'], [0.62, '#5c2c12'], [0.78, '#8a3c16'], [0.9, '#46200d'], [1, '#241307']]),
  }));
  const hemi = new THREE.HemisphereLight(0x8a6448, 0x1c130c, 1.05);
  z.add(hemi);
  const emberKey = new THREE.DirectionalLight(0xff8a4a, 0.35);
  emberKey.position.set(-30, 40, 20);
  z.add(emberKey);
  ground(z, 240, grimeTexture('#221e1b', '#0d0b09', '#34302c'));
  bounds(z, 54);

  const rust = rustMetalTexture();
  const wallMat = new THREE.MeshStandardMaterial({ map: rust, color: 0x9a8d80, roughness: .9, metalness: .35 });
  const darkMetal = mat(0x23211f, { rough: .6, metal: .6 });
  const floorMat = mat(0x1b1917, { rough: .95 });

  // ---- factory hall (open front faces the spawn) ----
  // slab
  box(z, 52, 0.12, 42, floorMat, 0, 0.06, -29);
  // side walls
  box(z, 1, 16, 40, wallMat, -26, 8, -28, { collide: true });
  box(z, 1, 16, 40, wallMat, 26, 8, -28, { collide: true });
  // back wall with a ragged breach (two segments + lintel)
  box(z, 20, 16, 1, wallMat, -16, 8, -48, { collide: true });
  box(z, 20, 16, 1, wallMat, 16, 8, -48, { collide: true });
  box(z, 12, 7, 1, wallMat, 0, 12.5, -48, { collide: true });
  // front header
  box(z, 52, 4.5, 1, wallMat, 0, 13.75, -8, { collide: true });
  // collapsed roof slabs
  const roofMat = mat(0x37332f, { rough: .85, metal: .4 });
  const r1 = box(z, 24, 0.5, 20, roofMat, -13, 15.6, -18); r1.rotation.z = 0.05;
  const r2 = box(z, 24, 0.5, 16, roofMat, 13, 15.2, -40); r2.rotation.x = -0.09;
  const r3 = box(z, 18, 0.5, 12, roofMat, 14, 13.4, -14); r3.rotation.set(0.16, 0, -0.12);
  // columns
  for (let i = 0; i < 4; i++) {
    cyl(z, .55, .65, 15, darkMetal, -12, 7.5, -14 - i * 10, { collide: true });
    cyl(z, .55, .65, 15, darkMetal, 12, 7.5, -14 - i * 10, { collide: true });
  }

  // facade sign
  glowPanel(z, textPanel({
    lines: ['TESLAGIGAFACTORY_X™'], w: 1024, h: 128, bg: '#16100c',
    fg: '#ff4a3c', font: 'bold 76px "Courier New", monospace', glow: '#ff4a3c', border: '#552018',
  }), 30, 3.6, 0, 14, -7.45, { intensity: 1.5 });

  // ---- dead-meme billboards on the roofline ----
  const memes = ['BUY STARS.', 'COLONIZE MARS.', 'THE MARKET WILL ADJUST.'];
  const memeColors = ['#37d5ff', '#ff9b37', '#ff3766'];
  const billboards = memes.map((m, i) => {
    const p = glowPanel(z, textPanel({
      lines: [m], w: 1024, h: 192, bg: '#0a0a10', fg: memeColors[i],
      font: 'bold 86px "Courier New", monospace', glow: memeColors[i], border: '#26262e', scan: true,
    }), 15, 3, -16 + i * 16, 18.6, -28, { intensity: 1.6 });
    box(z, 0.3, 2.4, 0.3, darkMetal, -16 + i * 16 - 5, 16.4, -28.4);
    box(z, 0.3, 2.4, 0.3, darkMetal, -16 + i * 16 + 5, 16.4, -28.4);
    return p;
  });
  z.onUpdate((dt, t) => {
    billboards.forEach((b, i) => {
      const flick = Math.random() < 0.04 ? 0.25 : 1;
      b.material.emissiveIntensity = (1.25 + 0.5 * Math.sin(t * 2 + i * 2.1)) * flick;
    });
  });
  // freestanding billboard by the spawn road, cycling the dead memes
  const memeTextures = memes.map((m, i) => textPanel({
    lines: [m], w: 1024, h: 256, bg: '#0a0a10', fg: memeColors[i],
    font: 'bold 96px "Courier New", monospace', glow: memeColors[i], border: '#26262e', scan: true,
  }));
  const bigBoard = glowPanel(z, memeTextures[0], 13, 3.3, -17, 4.6, 20, { rotY: Math.PI / 5, intensity: 1.6 });
  box(z, .5, 3, .5, darkMetal, -19, 1.5, 21.5, { collide: true });
  box(z, .5, 3, .5, darkMetal, -14.6, 1.5, 18, { collide: true });
  let memeIdx = 0, memeTimer = 0;
  z.onUpdate((dt) => {
    memeTimer += dt;
    if (memeTimer > 2.8) {
      memeTimer = 0;
      memeIdx = (memeIdx + 1) % memeTextures.length;
      bigBoard.material.emissiveMap = memeTextures[memeIdx];
      bigBoard.material.map = memeTextures[memeIdx];
      bigBoard.material.needsUpdate = true;
    }
  });

  // ---- conveyor line with twitching robot arms & cybertruck husks ----
  box(z, 36, 0.9, 3.4, darkMetal, 0, 0.45, -30, { collide: true });
  const armPivots = [];
  for (let i = 0; i < 4; i++) {
    const ax = -14 + i * 9;
    cyl(z, .5, .7, 1.6, mat(0x65605a, { metal: .8, rough: .4 }), ax, 0.8, -33.4, { collide: true });
    const pivot = new THREE.Group();
    pivot.position.set(ax, 1.7, -33.4);
    const seg1 = new THREE.Mesh(new THREE.BoxGeometry(.5, 3, .5), mat(0xb8b3a8, { metal: .7, rough: .35 }));
    seg1.position.y = 1.5;
    pivot.add(seg1);
    const elbow = new THREE.Group();
    elbow.position.y = 3;
    const seg2 = new THREE.Mesh(new THREE.BoxGeometry(.38, 2.4, .38), mat(0x8f8a80, { metal: .7, rough: .35 }));
    seg2.position.y = 1.1;
    elbow.add(seg2);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.18, .6, 6), emat(0xff7733, 1.4));
    tip.position.y = 2.5;
    elbow.add(tip);
    pivot.add(elbow);
    z.add(pivot);
    armPivots.push({ pivot, elbow, phase: i * 1.7 });
  }
  z.onUpdate((dt, t) => {
    for (const a of armPivots) {
      const jerk = Math.sin(t * 7 + a.phase) > 0.92 ? Math.random() * .5 : 0; // epileptic twitch
      a.pivot.rotation.z = 0.5 * Math.sin(t * 1.4 + a.phase) + jerk * 0.3;
      a.pivot.rotation.y = 0.6 * Math.sin(t * 0.9 + a.phase * 2);
      a.elbow.rotation.z = 0.8 * Math.sin(t * 1.9 + a.phase) + jerk;
    }
  });
  // angular husks (wedge = two leaned boxes)
  const huskMat = mat(0x5d6166, { metal: .85, rough: .3 });
  for (let i = 0; i < 3; i++) {
    const hx = -10 + i * 10;
    const a = box(z, 4.6, 1, 2.2, huskMat, hx, 1.4, -30);
    const b2 = box(z, 3.4, 0.9, 2.1, huskMat, hx - 0.4, 2.1, -30);
    b2.rotation.z = 0.16; a.rotation.z = -0.04;
  }

  // ---- server racks + crowbar (Praxis) ----
  const ledStripTex = textPanel({
    lines: ['• • ▪ • ▪ •'], w: 256, h: 32, bg: '#05070a', fg: '#46ff88',
    font: 'bold 20px monospace', glow: '#46ff88',
  });
  for (let i = 0; i < 5; i++) {
    const rx = -23.4, rz = -14 - i * 4;
    box(z, 1.4, 2.6, 1, mat(0x14161a, { metal: .6, rough: .5 }), rx, 1.3, rz, { collide: true });
    glowPanel(z, ledStripTex, 1.1, 0.16, rx + 0.71, 1.9, rz, { rotY: Math.PI / 2, intensity: 1.3 });
  }
  const crowbar = box(z, 0.09, 1.25, 0.09, mat(0x8a2b22, { metal: .8, rough: .35 }), -22.6, 1.7, -22);
  crowbar.rotation.z = 0.8;
  z.interact(-22.8, 1.2, -22, 3.2, 'E — the crowbar in the server rack',
    () => '“Burn the algorithm,” Praxis growled, jamming her crowbar into the rack. “Burn the f—ing algorithm that tells us to consume while we drown.”');

  // ---- Musk hologram ----
  cyl(z, .8, 1, .5, darkMetal, 14, .25, -22);
  const holoTex = textPanel({
    lines: ['WORKERS', 'ARE OBSOLETE'], w: 512, h: 512, bg: null, fg: '#7adcff',
    font: 'bold 72px "Courier New", monospace', glow: '#7adcff', scan: true,
  });
  const holo = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.MeshBasicMaterial({
    map: holoTex, transparent: true, opacity: .5, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  holo.position.set(14, 3, -22);
  z.add(holo);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.6, 16, 1, true), new THREE.MeshBasicMaterial({
    color: 0x2a7a9a, transparent: true, opacity: .14, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  beam.position.set(14, 2.8, -22);
  z.add(beam);
  z.onUpdate((dt, t) => {
    holo.material.opacity = Math.random() < 0.06 ? 0.1 : 0.35 + 0.2 * Math.sin(t * 3.2);
    holo.rotation.y = t * 0.6;
  });
  z.interact(14, 1, -22, 4, 'E — the flickering hologram',
    () => 'A corroded billionaire hologram flickers and preaches “Workers are obsolete!” before dissolving into static.');

  // ---- Robespierre, the Cerebral Reaper ----
  const robe = new THREE.Group();
  robe.position.set(0, 0, -40);
  // dais
  const dais = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), mat(0x26221e, { rough: .8, metal: .4 }));
  dais.position.y = .5;
  robe.add(dais);
  // legs/torso — gaunt frame in a tattered coat
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(.55, .95, 2.3, 8), mat(0x1d1a24, { rough: .95 }));
  coat.position.y = 2.3;
  robe.add(coat);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(1.15, .9, .7), mat(0x2c2836, { rough: .7, metal: .5 }));
  chest.position.y = 3.5;
  robe.add(chest);
  // skull: yellowed bone + titanium plates
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.42, 14, 12), mat(0xc9b98a, { rough: .65 }));
  skull.position.y = 4.35;
  robe.add(skull);
  const plate = new THREE.Mesh(new THREE.SphereGeometry(.43, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), mat(0xb9c2cc, { metal: .95, rough: .25 }));
  plate.position.y = 4.38;
  robe.add(plate);
  // void eyes
  const eyeMat = emat(0xff2222, 3);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 8), eyeMat);
    eye.position.set(sx * .16, 4.38, .36);
    robe.add(eye);
  }
  // unhinged jaw
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(.34, .5, .3), mat(0xc9b98a, { rough: .65 }));
  jaw.position.set(0, 3.9, .3);
  jaw.rotation.x = .7;
  robe.add(jaw);
  // spinal port leaking black fluid
  const port = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .5, 8), emat(0xff3311, 1.6));
  port.position.set(0, 3.4, -.42);
  port.rotation.x = Math.PI / 2;
  robe.add(port);
  // fiber-optic tendrils — chains of glowing beads from the jaw
  const tendrils = [];
  const beadMat = emat(0xff5533, 1.8);
  for (let j = 0; j < 6; j++) {
    const beads = [];
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(.05 - i * .003, 6, 6), beadMat);
      robe.add(b);
      beads.push(b);
    }
    tendrils.push({ beads, phase: j * 1.1, dir: (j / 5 - .5) * 1.8 });
  }
  z.add(robe);
  z.collide(-2.5, 2.5, -42.5, -37.5, 1);
  z.onUpdate((dt, t, player) => {
    // slow menace: face the player
    const dx = player.x - 0, dz = player.z - (-40);
    if (Math.hypot(dx, dz) < 30) {
      const target = Math.atan2(dx, dz);
      let d = target - robe.rotation.y;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      robe.rotation.y += d * Math.min(1, dt * 1.2);
    }
    for (const tn of tendrils) {
      for (let i = 0; i < tn.beads.length; i++) {
        const k = i / tn.beads.length;
        const sway = Math.sin(t * 2.4 + tn.phase + k * 4) * .25 * k;
        const lift = Math.sin(t * 1.7 + tn.phase * 2 + k * 3) * .2 * k;
        tn.beads[i].position.set(
          Math.sin(tn.dir) * k * 1.6 + sway,
          3.85 - k * 1.45 + lift,
          Math.cos(tn.dir) * k * 1.6 + .3,
        );
      }
    }
  });
  z.interact(0, 1, -38, 7.5, 'E — face the Cerebral Reaper',
    () => '“Little miners,” Robespierre rasps, voice a corrupted .mp3 of 1793 speeches. “The Ring already rebuilt this factory in the cloud. You breathe its code. You bleed its dividends.”');

  // ---- catwalk along the right wall ----
  const walkMat = mat(0x3a3733, { metal: .6, rough: .6 });
  box(z, 3, .15, 36, walkMat, 22.5, 5, -28);
  for (let i = 0; i < 5; i++) cyl(z, .12, .12, 5, darkMetal, 22.5, 2.5, -12 - i * 8, { collide: true });
  box(z, .08, 1, 36, mat(0x6a5a30, { metal: .7, rough: .4 }), 21.1, 5.6, -28);
  box(z, .08, 1, 36, mat(0x6a5a30, { metal: .7, rough: .4 }), 23.9, 5.6, -28);

  // ---- bent smokestacks behind the hall ----
  const stackMat = new THREE.MeshStandardMaterial({ map: rust, color: 0x8d7f72, roughness: .85, metalness: .4 });
  const stackDefs = [
    { x: -18, z: -62, h: 34, bend: 0.16 },
    { x: -4, z: -66, h: 40, bend: -0.12 },
    { x: 10, z: -63, h: 30, bend: 0.22 },
    { x: 22, z: -58, h: 26, bend: -0.2 },
  ];
  for (const s of stackDefs) {
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, s.h * .55, 12), stackMat);
    lower.position.set(s.x, s.h * .275, s.z);
    z.add(lower);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.2, s.h * .5, 12), stackMat);
    upper.position.set(s.x + Math.sin(s.bend) * s.h * .24, s.h * .55 + Math.cos(s.bend) * s.h * .24, s.z);
    upper.rotation.z = -s.bend;
    z.add(upper);
    z.collide(s.x - 2.6, s.x + 2.6, s.z - 2.6, s.z + 2.6, 8);
    const tipX = s.x + Math.sin(s.bend) * s.h * .5;
    const tipY = s.h * .55 + Math.cos(s.bend) * s.h * .48;
    const sm = smoke({ x: tipX, y: tipY, z: s.z, radius: 1.6, count: 36, scale: 2.4, tint: .1, lift: 2.2, life: 6 });
    z.add(sm.points);
    z.onUpdate((dt) => sm.update(dt));
  }

  // ---- fires ----
  const fireSpots = [[-12, -25], [17, 3], [-26, -52]];
  for (const [fx, fz] of fireSpots) {
    const f = fire({ x: fx, z: fz, radius: 1.5, count: 110, scale: 1.5 });
    const e = embers({ x: fx, z: fz, radius: 1.4, count: 30 });
    const s = smoke({ x: fx, y: 1.5, z: fz, radius: 1.2, count: 30, scale: 1.6, tint: .13 });
    z.add(f.points); z.add(e.points); z.add(s.points);
    const fl = new THREE.PointLight(0xff7726, 3.2, 26, 1.8);
    fl.position.set(fx, 2.2, fz);
    z.add(fl);
    z.onUpdate((dt, t) => {
      f.update(dt); e.update(dt); s.update(dt);
      fl.intensity = 2.6 + Math.sin(t * 11 + fx) * .7 + Math.random() * .8;
    });
    // debris around fires
    box(z, 1.6, .5, 1.2, darkMetal, fx + 1.6, .25, fz + 1, { rotY: .7 });
    box(z, 1.2, .4, .9, darkMetal, fx - 1.4, .2, fz - .8, { rotY: -.4 });
  }

  // ---- crashed patrol drone (blinking optic) ----
  const drone = new THREE.Group();
  drone.position.set(18, 0, 6);
  drone.rotation.z = .35;
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, .4, 1.6), mat(0x2e3138, { metal: .8, rough: .35 }));
  body.position.y = .45;
  drone.add(body);
  for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.9, .1, .18), mat(0x3a3d44, { metal: .7, rough: .4 }));
    arm.position.set(ax * .95, .5, az * .95);
    arm.rotation.y = Math.atan2(az, ax);
    drone.add(arm);
  }
  const optic = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 8), emat(0xff4444, 2));
  optic.position.set(0, .5, .85);
  drone.add(optic);
  z.add(drone);
  z.collide(16.8, 19.2, 4.8, 7.2, 1);
  z.onUpdate((dt, t) => { optic.material.emissiveIntensity = (Math.sin(t * 2.2) > .4) ? 2.4 : .15; });
  z.interact(18, .5, 6, 3, 'E — the disembodied drone',
    () => 'Its optic sensors still blink. “They’ll send enforcers,” Liberty said, not looking up. “Robespierre’s ghouls.”');

  // ---- emergency sirens on the facade ----
  for (const sx of [-24, 24]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), emat(0xff2020, 1));
    lamp.position.set(sx, 15.4, -7.6);
    z.add(lamp);
    const sl = new THREE.PointLight(0xff2222, 0, 30, 1.6);
    sl.position.set(sx, 14.5, -5);
    z.add(sl);
    const phase = sx > 0 ? Math.PI : 0;
    z.onUpdate((dt, t) => {
      const k = Math.max(0, Math.sin(t * 2.6 + phase));
      sl.intensity = k * 3.2;
      lamp.material.emissiveIntensity = .4 + k * 2.6;
    });
  }

  // ---- Civic Virtue™ teaser (sets up the journey) ----
  glowPanel(z, textPanel({
    lines: ['⚠ CIVIC VIRTUE™', 'SEEDING IN BETA-TEST CITIES'], w: 768, h: 256, bg: '#0c0c14',
    fg: ['#ffd75e', '#9adcff'], font: 'bold 52px "Courier New", monospace', glow: '#ffd75e', border: '#3a3a4a', scan: true,
  }), 7, 2.4, -14, 2.6, 12, { rotY: Math.PI / 4, intensity: 1.4 });
  box(z, .4, 2.6, .4, darkMetal, -14, 1.3, 12, { collide: true });
  z.interact(-14, 1.5, 12, 4, 'E — the seeding alert',
    () => '“We don’t burn factories anymore,” Liberty said, her torch a dimming ember. “We burn stories.” — press T and ask the torch to carry you onward.');

  // ---- torch pedestal (the prop itself lives in torch.js) ----
  const ped = cyl(z, .55, .7, 1.05, mat(0x2f2b27, { rough: .5, metal: .7 }), 0, .525, 14, { collide: true });
  const pedRing = new THREE.Mesh(new THREE.TorusGeometry(.55, .04, 8, 24), emat(0xe8b04b, 1.2));
  pedRing.rotation.x = Math.PI / 2;
  pedRing.position.set(0, 1.07, 14);
  z.add(pedRing);

  // ---- hidden architecture (flare reveals) ----
  reveal(z, { lines: ['IT CONVINCES YOU', 'TO LOVE YOUR CHAINS'], w: 26, h: 7, x: 0, y: 8, z: -47.4, color: '#c89cff' });
  reveal(z, { lines: ['DEBT ▸ NDA ▸ PROPAGANDA ▸ DIVIDENDS'], w: 30, h: 3.4, x: -25.4, y: 7, z: -28, rotY: Math.PI / 2, color: '#b48cff' });
  reveal(z, { lines: ['THE RING IS IN THE WIRES'], w: 22, h: 3, x: 25.4, y: 8.5, z: -28, rotY: -Math.PI / 2, color: '#ff9ad5' });
  reveal(z, { lines: ['⬡ THE FRACTAL CAGE ⬡'], w: 18, h: 3, x: 0, y: .15, z: -20, rotX: -Math.PI / 2, color: '#9a7cff', maxOpacity: .8 });

  return z;
}
