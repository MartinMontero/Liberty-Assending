// Chapter 1–2 · TeslaGigafactory_X™ — the burning factory where the story opens.
import * as THREE from 'three';
import { Zone, mat, emat, box, cyl, ground, bounds, sky, glowPanel, reveal, aoBlob, cable } from '../world.js';
import { textPanel, grimeTexture, rustMetalTexture, paintedSky, noiseNormalTexture, scorchTexture } from '../textures.js';
import { fire, smoke, embers, Particles, FlameSprite } from '../particles.js';

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

  // ---- atmosphere: smoke billows rim-lit by the burning city (cover-art sky) ----
  sky(z, new THREE.MeshBasicMaterial({
    map: paintedSky({
      stops: [[0, '#0d0806'], [0.38, '#2c1a0d'], [0.6, '#5c2c12'], [0.76, '#9a4418'], [0.88, '#4a220e'], [1, '#241307']],
      clouds: [
        { y: .3, count: 10, size: 64, color: 'rgba(18,11,8,.55)', rim: 'rgba(255,110,30,.18)', spread: .2 },
        { y: .52, count: 12, size: 46, color: 'rgba(26,15,9,.5)', rim: 'rgba(255,140,40,.26)', spread: .14 },
        { y: .7, count: 8, size: 34, color: 'rgba(40,20,10,.45)', rim: 'rgba(255,170,60,.3)', spread: .08 },
      ],
    }),
  }));
  const hemi = new THREE.HemisphereLight(0x8a6448, 0x1c130c, 1.05);
  z.add(hemi);
  const emberKey = new THREE.DirectionalLight(0xff8a4a, 0.35);
  emberKey.position.set(-30, 40, 20);
  z.add(emberKey);
  const groundNormal = noiseNormalTexture({ strength: 2.2 });
  ground(z, 240, grimeTexture('#221e1b', '#0d0b09', '#34302c'), { normal: groundNormal, normalScale: .8 });
  bounds(z, 54);

  const rust = rustMetalTexture();
  const wallNormal = noiseNormalTexture({ strength: 1.4, blobs: 500 });
  wallNormal.repeat.set(6, 3);
  const wallMat = new THREE.MeshStandardMaterial({
    map: rust, color: 0x9a8d80, roughness: .9, metalness: .35,
    normalMap: wallNormal, normalScale: new THREE.Vector2(.7, .7),
  });
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

  // ---- THE FIGHT: the torch doesn't burn him — it severs his connection ----
  const fight = { severed: 0, jawOpen: false, defeated: false, heat: 0, lashT: 0 };
  z.meter = { label: 'COGNITIVE DISSONANCE', color: '#ff4a3c', value: 0 };
  z.onUpdate((dt, t, player, p) => {
    const dx = player.x - 0, dz = player.z - (-40);
    const dist = Math.hypot(dx, dz);
    if (dist < 30 && !fight.defeated) {
      const target = Math.atan2(dx, dz);
      let d = target - robe.rotation.y;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      robe.rotation.y += d * Math.min(1, dt * 1.2);
    }
    // tendrils sway; severed ones wither
    for (const tn of tendrils) {
      if (tn.severed) {
        for (const b of tn.beads) { b.scale.multiplyScalar(1 - dt * 2.4); if (b.scale.x < .08) b.visible = false; }
        continue;
      }
      for (let i = 0; i < tn.beads.length; i++) {
        const k = i / tn.beads.length;
        const reach = fight.defeated ? 0 : Math.max(0, 1 - dist / 14) * .9; // they reach for you
        const sway = Math.sin(t * 2.4 + tn.phase + k * 4) * .25 * k;
        const lift = Math.sin(t * 1.7 + tn.phase * 2 + k * 3) * .2 * k;
        tn.beads[i].position.set(
          Math.sin(tn.dir) * k * (1.6 + reach) + sway,
          3.85 - k * (1.45 - reach * .4) + lift,
          Math.cos(tn.dir) * k * (1.6 + reach * 1.6) + .3,
        );
      }
    }
    if (fight.defeated) { z.meter.value = Math.max(0, z.meter.value - dt * .3); return; }
    // cognitive dissonance: his memetic payload, rising in his presence
    if (dist < 13) {
      z.meter.value = Math.min(1, z.meter.value + dt * .085);
      fight.lashT += dt;
      if (fight.lashT > 3.4) {            // a tendril lashes — payload spike
        fight.lashT = 0;
        z.meter.value = Math.min(1, z.meter.value + .14);
        z.fxFlash = true;
        world.sfx('dox');
      }
    } else {
      z.meter.value = Math.max(0, z.meter.value - dt * .12);
    }
    if (z.meter.value >= 1) {             // obey and revolt, consume and destroy
      z.meter.value = .35;
      z.fxFlash = true;
      world.sfx('dox');
      world.notify('OBEY AND REVOLT · CONSUME AND DESTROY — the payload floods your nervous system. Step back. Breathe. The torch is the counter-narrative.', 6);
    }
    // severing: hold F aimed at him, close enough
    if (world.flare > .55 && dist < 17 && fight.severed < 6) {
      const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
      const facing = (fx * dx / dist + fz * dz / dist) < -.72; // looking toward him
      if (facing) {
        fight.heat += dt;
        if (fight.heat > .8) {
          fight.heat = 0;
          const tn = tendrils.find(x => !x.severed);
          if (tn) {
            tn.severed = true;
            fight.severed++;
            world.sfx('sever');
            z.fxFlash = true;
            if (fight.severed === 1) world.notify('“Look past his face — he’s a puppet. The Ring’s in the wires.” The beam SEVERS a tendril from the core.', 5);
            if (fight.severed === 6) {
              fight.jawOpen = true;
              world.notify('His tendrils hang dead. The jaw gapes — pneumatic, hungry, OPEN.', 5);
            }
          }
        }
      }
    }
    if (fight.jawOpen && !fight.defeated) {
      jaw.rotation.x = Math.min(1.5, jaw.rotation.x + dt * 1.2);
      port.material.emissiveIntensity = 2.4 + Math.sin(t * 9) * 1.2;
    }
  });
  z.interact(0, 1, -38, 8.5,
    () => fight.defeated ? 'E — the slumped Reaper'
      : fight.jawOpen ? 'E — THRUST THE TORCH INTO HIS JAW'
      : 'face the Reaper — hold F to sever his tendrils',
    () => {
      if (fight.defeated) return 'The last shard of his organic mind sleeps now. “All revolutions end in teeth,” the Corp-Statists whispered. Not this one.';
      if (!fight.jawOpen) return '“Little miners,” Robespierre rasps, a corrupted .mp3 of 1793. “You breathe its code. You bleed its dividends.” — sever all six tendrils first: hold F, aimed at him.';
      // the thrust
      fight.defeated = true;
      eyeMat.emissiveIntensity = .12;
      port.material.emissiveIntensity = 0;
      robe.rotation.x = .32;
      z.fxFlash = true;
      world.sfx('finale');
      world.grant('shard', 'NEURAL LACE SHARD — it whispers: Civic Virtue™, seeding in Versailles');
      world.liberate('factory', 'THE SMOKESTACK GOSPEL');
      return 'The factory erupts in a supernova of decrypted data. For three seconds the Ring breaks — his human eye blinks: “Liberté…” Then the killswitch. From the wreck of his spine you pull a NEURAL LACE SHARD, whispering of the Ring’s next move.';
    });

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

  // ---- fires (layered billboard flames + particles + scorch decals) ----
  const scorchTex = scorchTexture();
  const fireSpots = [[-12, -25], [17, 3], [-26, -52]];
  for (const [fx, fz] of fireSpots) {
    const f = fire({ x: fx, z: fz, radius: 1.5, count: 110, scale: 1.5 });
    const e = embers({ x: fx, z: fz, radius: 1.4, count: 30 });
    const s = smoke({ x: fx, y: 1.5, z: fz, radius: 1.2, count: 30, scale: 1.6, tint: .13 });
    z.add(f.points); z.add(e.points); z.add(s.points);
    const flames = [
      new FlameSprite({ x: fx, y: 0, z: fz, w: 2.6, h: 4.4, layers: 3 }),
      new FlameSprite({ x: fx + 1, y: 0, z: fz - .6, w: 1.5, h: 2.4, layers: 2 }),
      new FlameSprite({ x: fx - .9, y: 0, z: fz + .7, w: 1.2, h: 2, layers: 2 }),
    ];
    for (const fb of flames) z.add(fb.group);
    const scorch = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9),
      new THREE.MeshBasicMaterial({ map: scorchTex, transparent: true, opacity: .85, depthWrite: false }),
    );
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(fx, .03, fz);
    z.add(scorch);
    const fl = new THREE.PointLight(0xff7726, 3.2, 26, 1.8);
    fl.position.set(fx, 2.2, fz);
    z.add(fl);
    z.onUpdate((dt, t) => {
      f.update(dt); e.update(dt); s.update(dt);
      for (const fb of flames) fb.update(t);
      fl.intensity = 2.6 + Math.sin(t * 11 + fx) * .7 + Math.random() * .8;
    });
    // debris around fires
    box(z, 1.6, .5, 1.2, darkMetal, fx + 1.6, .25, fz + 1, { rotY: .7 });
    box(z, 1.2, .4, .9, darkMetal, fx - 1.4, .2, fz - .8, { rotY: -.4 });
  }

  // ---- swinging work lamps over the assembly line ----
  const lamps = [];
  for (let i = 0; i < 3; i++) {
    const lx = -11 + i * 11, lz = -30;
    const pivotL = new THREE.Group();
    pivotL.position.set(lx, 13.4, lz);
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 5.6, 5), mat(0x141312, { rough: .8 }));
    wire.position.y = -2.8;
    pivotL.add(wire);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(.55, .6, 10, 1, true), mat(0x2c2a26, { metal: .7, rough: .4, extra: { side: THREE.DoubleSide } }));
    shade.position.y = -5.7;
    pivotL.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), emat(0xffd9a0, 2.2));
    bulb.position.y = -5.9;
    pivotL.add(bulb);
    const lampLight = new THREE.PointLight(0xffc070, 1.5, 17, 1.9);
    lampLight.position.y = -6.1;
    pivotL.add(lampLight);
    z.add(pivotL);
    lamps.push({ pivotL, phase: i * 2.4 });
  }
  z.onUpdate((dt, t) => {
    for (const L of lamps) {
      L.pivotL.rotation.z = Math.sin(t * .7 + L.phase) * .08;
      L.pivotL.rotation.x = Math.cos(t * .55 + L.phase) * .06;
    }
  });

  // ---- power cables sagging through the hall + conduit pipes ----
  cable(z, -25.5, 11, -14, -12, 13.5, -14, 2.2);
  cable(z, -12, 13.5, -14, 12, 13.5, -16, 2.6);
  cable(z, 12, 13.5, -16, 25.5, 11, -20, 2);
  cable(z, -25.5, 10, -34, 0, 12.5, -36, 2.8);
  cable(z, 0, 12.5, -36, 25.5, 10.5, -32, 2.4);
  cable(z, -12, 13.5, -24, -12.6, 1.2, -30, .4, .03); // dangling feed to the line
  const pipeMat = mat(0x3c3833, { metal: .7, rough: .45 });
  for (const py of [3.1, 4]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 38, 8), pipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(-25.2, py, -28);
    z.add(pipe);
  }
  for (let i = 0; i < 3; i++) {
    const drop = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 3.1, 8), pipeMat);
    drop.position.set(-25.2, 1.55, -16 - i * 10);
    z.add(drop);
    z.add(new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), pipeMat)).position.set(-25.2, 3.1, -16 - i * 10);
  }

  // ---- drifting ash + welding sparks off the robot arms ----
  const ash = new Particles({
    count: 90,
    additive: false,
    flutter: .6,
    spawn: (p) => {
      p.x = (Math.random() - .5) * 100; p.z = (Math.random() - .5) * 100;
      p.y = 1 + Math.random() * 12;
      p.vy = -.22 - Math.random() * .2; p.vx = .25;
      p.life = 6 + Math.random() * 6;
      p.size = .05 + Math.random() * .06;
      const g = .28 + Math.random() * .2;
      p.r = g; p.g = g * .92; p.b = g * .82;
    },
  });
  z.add(ash.points);
  const sparks = new Particles({
    count: 36,
    gravity: -7,
    spawn: (p) => {
      const arm = Math.floor(Math.random() * 4);
      p.x = -14 + arm * 9 + (Math.random() - .5); p.y = 4.4 + Math.random(); p.z = -33 + Math.random();
      const a = Math.random() * Math.PI * 2;
      p.vx = Math.cos(a) * (1 + Math.random() * 2.4); p.vz = Math.sin(a) * (1 + Math.random() * 2.4);
      p.vy = 1 + Math.random() * 2.6;
      p.life = .3 + Math.random() * .5;
      p.size = .035 + Math.random() * .04;
      p.r = 1; p.g = .85; p.b = .5;
    },
  });
  z.add(sparks.points);
  z.onUpdate((dt) => { ash.update(dt); sparks.update(dt); });

  // ---- contact shadows ----
  aoBlob(z, 0, 14, 1.5, .6);                      // torch pedestal
  aoBlob(z, 0, -40, 4.4, .6);                     // Robespierre dais
  aoBlob(z, 14, -22, 1.8, .5);                    // hologram projector
  aoBlob(z, 18, 6, 2.2, .55);                     // crashed drone
  aoBlob(z, -17, 20, 2.4, .45);                   // billboard posts
  aoBlob(z, -14, 12, 1.4, .45);                   // civic-virtue sign
  for (let i = 0; i < 5; i++) aoBlob(z, -23.4, -14 - i * 4, 1.6, .5);   // racks
  for (let i = 0; i < 3; i++) aoBlob(z, -10 + i * 10, -30, 3.4, .5);    // husks on the line
  for (const s of stackDefs) aoBlob(z, s.x, s.z, 4.4, .6);              // smokestacks

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

  // ---- the Fellowship of Rational Resistance, camped by the road ----
  function figure(x, zz, rotY, coatColor, name, accentBuild) {
    const f = new THREE.Group();
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(.32, .52, 1.5, 9), mat(coatColor, { rough: .9 }));
    coat.position.y = 1.05;
    f.add(coat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.23, 10, 8), mat(0x9a7a62, { rough: .8 }));
    head.position.y = 2.02;
    f.add(head);
    accentBuild?.(f);
    f.position.set(x, 0, zz);
    f.rotation.y = rotY;
    z.add(f);
    z.collide(x - .5, x + .5, zz - .5, zz + .5, 2.1);
    aoBlob(z, x, zz, 1.1, .5);
    glowPanel(z, textPanel({
      lines: [name], w: 256, h: 64, bg: null, fg: '#e8b04b', font: 'bold 38px "Courier New", monospace', glow: '#e8b04b',
    }), 1.3, .33, x, 2.55, zz, { rotY, intensity: 1.2, double: true, cutout: true });
    return f;
  }
  // Logos — systems analyst, eyes like overclocked processors
  figure(8, 21, -2.6, 0x24303a, 'LOGOS', (f) => {
    const tab = new THREE.Mesh(new THREE.PlaneGeometry(.42, .3), emat(0x7adcff, 1.6));
    tab.position.set(.28, 1.35, .3);
    tab.rotation.set(-.6, .5, 0);
    f.add(tab);
  });
  z.interact(8, 1, 21, 3, 'E — Logos, at the HoloProjector',
    () => '“It’s a dual-gateway algorithm,” Logos hisses, tracing the ouroboros. “Profit as god fused with purity as law. It doesn’t just rule — it convinces you to love your chains. Take the torch. Modulate it: hold F, and CUT him from the wires.”');
  // Praxis — union organizer turned hacktivist (by her crowbar, at the racks)
  figure(-21.6, -17.5, 1.9, 0x3a2430, 'PRAXIS', (f) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(.07, .9, .07), mat(0x8a2b22, { metal: .8, rough: .35 }));
    bar.position.set(-.34, 1.2, .12);
    bar.rotation.z = .5;
    f.add(bar);
  });
  // Soma — biohacker, splicing adrenal mods (near the downed drone)
  figure(15.5, 8.5, 2.8, 0x2a3626, 'SOMA', (f) => {
    const syr = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .3, 6), emat(0x7dffb0, 1.4));
    syr.position.set(.3, 1.45, .22);
    syr.rotation.z = 1.2;
    f.add(syr);
  });
  z.interact(15.5, 1, 8.5, 3, 'E — Soma, mid-splice',
    () => 'Soma glances up from splicing adrenal mods into his veins. “Let them come. We’ll feed their patrol drones hallucinogens — watch the A.I. trip.” His grin is all teeth.');

  // the One Ring schematic, etched into the smoke by the stolen HoloProjector
  cyl(z, .5, .7, .5, darkMetal, 5, .25, 23);
  const ringHolo = new THREE.Mesh(new THREE.TorusGeometry(1.5, .16, 10, 40), new THREE.MeshBasicMaterial({
    color: 0x9a5cff, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  ringHolo.position.set(5, 2.8, 23);
  z.add(ringHolo);
  const ringHolo2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, .05, 8, 40), new THREE.MeshBasicMaterial({
    color: 0xff4a6a, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  ringHolo2.position.set(5, 2.8, 23);
  z.add(ringHolo2);
  glowPanel(z, textPanel({
    lines: ['THE ONE RING', 'profit-as-god ⊕ purity-as-law'], w: 640, h: 170, bg: null,
    fg: ['#b48cff', '#8a9cc0'], font: 'bold 42px "Courier New", monospace', glow: '#b48cff',
  }), 4.4, 1.2, 5, 4.6, 23, { intensity: 1.4, double: true, cutout: true });
  z.onUpdate((dt, t) => {
    ringHolo.rotation.y = t * .7;
    ringHolo.rotation.x = .4 + Math.sin(t * .5) * .2;
    ringHolo2.rotation.y = -t * .9;
    ringHolo2.rotation.x = .4 - Math.sin(t * .5) * .2;
    ringHolo.material.opacity = .4 + .2 * Math.sin(t * 2.7);
  });

  // ---- chapter quest line ----
  z.quest = () => {
    if (!world.torchRef?.held) return 'Take up Liberty’s torch — it waits on the pedestal';
    if (fight.defeated) return '⚑ Liberated — the shard whispers of Versailles (press T)';
    if (fight.jawOpen) return 'His jaw hangs open — thrust the torch into it (E)';
    return `Face Robespierre in the hall — hold F to sever his tendrils (${fight.severed}/6)`;
  };

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
