// Chapter 5 · DAO of the Dead — a necropolis of glass coffins stacked like server racks.
import * as THREE from 'three';
import { Zone, mat, emat, box, cyl, ground, bounds, sky, glowPanel, reveal, glowSprite, aoBlob } from '../world.js';
import { textPanel, grimeTexture, skyGradient, starsTexture, glowTexture, noiseNormalTexture } from '../textures.js';
import { fireflies, smoke } from '../particles.js';

export function buildNecropolis(world) {
  const z = new Zone({
    id: 'necropolis',
    name: 'DAO of the Dead',
    chapter: 'Chapter 5 · DAO of the Dead',
    origin: new THREE.Vector3(6000, 0, 0),
    fog: { color: 0x070b14, density: 0.015 },
    spawn: { x: 0, z: 30, yaw: 0 },
    keywords: ['dao', 'dead', 'necropolis', 'coffin', 'coffins', 'grave', 'graves', 'ghost', 'ghosts',
      'maria', 'soul', 'souls', 'chapter 5', 'catacomb', 'mourning', 'grief'],
    short: 'Glass coffins hum with unquiet graves; grief is collateral here.',
    narration: 'The necropolis hums with the static of unquiet graves. Glass coffins stack like server racks, each holding a digitized soul — ancestors mined for trauma, their worst memories minted and dividend-bearing. The air reeks of burnt sage and encryption keys, and the DAO’s manifesto pulses in blood-red code overhead.',
    quote: '“They can burn books, mija, but not memory.” — Maria Kwan',
  });
  world.register(z);

  // ---- night sky with a pale moon ----
  sky(z, new THREE.MeshBasicMaterial({
    map: skyGradient([[0, '#01020a'], [0.6, '#060a18'], [1, '#02030a']]),
  }));
  const starDome = new THREE.Mesh(new THREE.SphereGeometry(370, 24, 16), new THREE.MeshBasicMaterial({
    map: starsTexture(500), transparent: true, side: THREE.BackSide, fog: false, depthWrite: false,
  }));
  z.add(starDome);
  const moon = glowSprite(z, glowTexture('rgba(210,225,255,1)'), 0xcfdcff, 46, -120, 150, -240, .9);
  moon.material.fog = false;
  const hemi = new THREE.HemisphereLight(0x405e9a, 0x06080e, 0.7);
  z.add(hemi);
  const moonLight = new THREE.DirectionalLight(0x9ab4e8, .65);
  moonLight.position.set(-60, 80, -90);
  z.add(moonLight);

  ground(z, 240, grimeTexture('#0c0f14', '#04050a', '#1a2030', 2400), { normal: noiseNormalTexture({ strength: 2 }), normalScale: .7 });
  bounds(z, 54);

  // ground mist
  const mist = smoke({ x: 0, y: .2, z: 0, radius: 40, count: 60, scale: 5, tint: .05, lift: .14, life: 12 });
  z.add(mist.points);
  z.onUpdate((dt) => mist.update(dt));

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x86b4d0, roughness: .08, metalness: .25, transparent: true, opacity: .16, side: THREE.DoubleSide,
  });
  const frameMat = mat(0x12161e, { metal: .7, rough: .4 });
  const soulTex = glowTexture('rgba(150,200,255,1)');

  // ---- coffin racks (server-rack stacks of glass coffins) ----
  const epitaphs = [
    'PTSD NFT — RARE ANGUISH', 'ANCESTRAL CURSE — 50% DIVIDENDS', 'LAST LULLABY — BID NOW',
    'GRIEF FUTURES — Q3 BUNDLE', 'DECEASED CREATOR — ROYALTIES 4EVER', 'WAR MEMORY — FRACTIONALIZED',
  ];
  const souls = [];
  const coffinEdges = [];
  const rackUnits = [];
  const rackDefs = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      rackDefs.push({ x: -21 + col * 14, zz: -2 - row * 18, rotY: row === 0 ? 0 : Math.PI });
    }
  }
  rackDefs.forEach((rd, ri) => {
    const rackUnit = { x: rd.x, z: rd.zz, souls: [], freed: false };
    rackUnits.push(rackUnit);
    const rack = new THREE.Group();
    rack.position.set(rd.x, 0, rd.zz);
    rack.rotation.y = rd.rotY;
    // uprights
    for (const px of [-1.4, 1.4]) {
      for (const pz of [-.8, .8]) {
        const up = new THREE.Mesh(new THREE.BoxGeometry(.16, 7.4, .16), frameMat);
        up.position.set(px, 3.7, pz);
        rack.add(up);
      }
    }
    for (let lvl = 0; lvl < 3; lvl++) {
      const y = 1.1 + lvl * 2.3;
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(3, .12, 1.8), frameMat);
      shelf.position.y = y - .65;
      rack.add(shelf);
      // glass coffin
      const cof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 1.3), glassMat);
      cof.position.y = y;
      rack.add(cof);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(2.56, 1.06, 1.36), new THREE.MeshBasicMaterial({
        color: 0x4a90c8, wireframe: true, transparent: true, opacity: .22,
      }));
      edge.position.y = y;
      rack.add(edge);
      coffinEdges.push(edge);
      // soul inside
      const soul = new THREE.Sprite(new THREE.SpriteMaterial({
        map: soulTex, color: 0x9fc8ff, transparent: true, opacity: .8,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      soul.scale.setScalar(.9);
      soul.position.set((Math.random() - .5) * 1.4, y, 0);
      rack.add(soul);
      const soulRec = { soul, phase: Math.random() * 9, baseY: y, freed: false };
      souls.push(soulRec);
      rackUnit.souls.push(soulRec);
    }
    // epitaph plaque
    const ep = epitaphs[ri % epitaphs.length];
    glowPanel(z, textPanel({
      lines: [ep], w: 768, h: 80, bg: '#0a0d14', fg: '#ff4455',
      font: 'bold 40px "Courier New", monospace', glow: '#ff4455', border: '#26111a',
    }), 3, .32, rd.x + (rd.rotY === 0 ? 0 : 0), 7.7, rd.zz + (rd.rotY === 0 ? .95 : -.95), { rotY: rd.rotY, intensity: 1.5 });
    z.add(rack);
    z.collide(rd.x - 1.6, rd.x + 1.6, rd.zz - 1, rd.zz + 1, 7.4);
  });
  const nq = { root: false, freedRacks: 0, maria: false };
  z.onUpdate((dt, t, player) => {
    for (const s of souls) {
      if (s.freed) {
        s.soul.position.y += dt * 2.6;
        s.soul.material.opacity = Math.max(0, s.soul.material.opacity - dt * .4);
        continue;
      }
      s.soul.material.opacity = .5 + .35 * Math.sin(t * 1.6 + s.phase);
      s.soul.position.y = s.baseY + Math.sin(t * .9 + s.phase) * .18;
    }
    // crack the coffins: flare beside a rack once the dead have root access
    if (nq.root && world.flare > .55) {
      for (const ru of rackUnits) {
        if (ru.freed) continue;
        if (Math.hypot(player.x - ru.x, player.z - ru.z) < 6.5) {
          ru.freed = true;
          nq.freedRacks++;
          for (const s of ru.souls) s.freed = true;
          world.sfx('free');
          z.fxFlash = true;
          if (nq.freedRacks === 1) world.notify('The glass CRACKS. Souls pour upward, remembering themselves — unprofitable, unarchivable, free.', 5);
        }
      }
    }
  });

  // ---- Maria Kwan's coffin — the heart of the chapter ----
  const shrine = new THREE.Group();
  shrine.position.set(0, 0, -12);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.6, .8, 2.2), mat(0x1c2028, { rough: .6 }));
  plinth.position.y = .4;
  shrine.add(plinth);
  const mcof = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.15, 1.4), glassMat.clone());
  mcof.material.opacity = .22;
  mcof.position.y = 1.4;
  shrine.add(mcof);
  const msoul = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(255,215,150,1)'), color: 0xffd9a0, transparent: true, opacity: .9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  msoul.scale.setScalar(1.15);
  msoul.position.y = 1.45;
  shrine.add(msoul);
  z.add(shrine);
  z.collideMesh(plinth);
  glowPanel(z, textPanel({
    lines: ['MARIA KWAN (1984–2032)', '“MOTHER’S DAY MELTDOWN™” COLLECTION'], w: 1024, h: 170, bg: '#0c0a10',
    fg: ['#ffd9a0', '#ff4455'], font: 'bold 46px "Courier New", monospace', glow: '#ffd9a0', border: '#3a2a1a',
  }), 4.6, .8, 0, 2.9, -10.9, { intensity: 1.5 });
  let mariaFreed = false;
  const mariaSwarm = fireflies({ box: [3, 2, 3], cx: 0, cy: 1.6, cz: -12, count: 70, color: [1, .8, .42], size: .15 });
  mariaSwarm.points.visible = false;
  z.add(mariaSwarm.points);
  z.onUpdate((dt, t) => {
    msoul.material.opacity = mariaFreed ? 0 : .65 + .3 * Math.sin(t * 2.2);
    if (mariaFreed) {
      mariaSwarm.cfg.spawn = (p) => {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 6;
        p.x = Math.cos(a) * r; p.z = -12 + Math.sin(a) * r; p.y = 1 + Math.random() * 5;
        p.vy = .5 + Math.random() * .9;
        p.life = 2.5 + Math.random() * 4;
        p.size = .14; p.r = 1; p.g = .8; p.b = .42;
      };
      mariaSwarm.update(dt);
    }
  });
  z.interact(0, 1.4, -12, 4,
    () => nq.maria ? 'E — where Maria was' : 'E — press your palm to Maria’s coffin',
    () => {
      if (nq.maria) return 'Fireflies, where her fear used to be priced.';
      if (!nq.root) return 'The DAO’s lock chews at your palm: BID TO OWN HER FEAR. Give the dead root access first — the smart-contract heart, deeper in.';
      nq.maria = true;
      mariaFreed = true;
      mariaSwarm.points.visible = true;
      world.grant('lullaby', 'MARIA’S LULLABY — too analog to tokenize');
      return '“Mija… you can’t save me. Only remember me.” The torch encodes her unrecorded lullabies — data too human for the blockchain. “Te quiero. Now go haunt them.” Her ghost dissolves into fireflies.';
    });
  z.onUpdate(() => {
    if (nq.root && nq.freedRacks >= 5 && nq.maria) world.liberate('necropolis', 'DAO OF THE DEAD');
  });
  z.quest = () => {
    if (!nq.root) return 'Give the dead root access — the smart-contract heart, past the racks (E)';
    if (nq.freedRacks < 5) return `Crack the coffins — hold F beside the racks (${nq.freedRacks}/5 racks freed)`;
    if (!nq.maria) return 'Maria Kwan waits in the center aisle — press your palm (E)';
    return '⚑ Liberated — the prison of probabilities remains (press T)';
  };

  // ---- the DAO hydra core + manifesto ----
  const hydra = new THREE.Group();
  hydra.position.set(0, 0, -40);
  const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 3.4, 16, 6), new THREE.MeshStandardMaterial({
    color: 0x0c0a12, roughness: .3, metalness: .8, emissive: 0x33060a, emissiveIntensity: .8, flatShading: true,
  }));
  obelisk.position.y = 8;
  hydra.add(obelisk);
  // venture-phantom heads orbiting
  const heads = [];
  for (let i = 0; i < 5; i++) {
    const head = new THREE.Group();
    const sk = new THREE.Mesh(new THREE.SphereGeometry(.55, 10, 8), new THREE.MeshStandardMaterial({
      color: 0x10141c, roughness: .4, metalness: .6, transparent: true, opacity: .85,
    }));
    head.add(sk);
    for (const ex of [-.2, .2]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 6), emat(0xff2233, 2.6));
      eye.position.set(ex, .08, .45);
      head.add(eye);
    }
    hydra.add(head);
    heads.push({ head, phase: i / 5 * Math.PI * 2 });
  }
  z.add(hydra);
  z.collide(-3.6, 3.6, -43.6, -36.4, 16);
  const redGlow = new THREE.PointLight(0xff2233, 2.4, 36, 1.9);
  redGlow.position.set(0, 9, -36);
  z.add(redGlow);
  const manifesto = glowPanel(z, textPanel({
    lines: ['DEATH IS A LIQUID ASSET'], w: 1536, h: 160, bg: null, fg: '#ff2433',
    font: 'bold 92px "Courier New", monospace', glow: '#ff2433',
  }), 24, 2.5, 0, 18.6, -40, { intensity: 2, double: true, cutout: true });
  z.onUpdate((dt, t, player, p) => {
    for (const h of heads) {
      const a = t * .5 + h.phase;
      h.head.position.set(Math.cos(a) * 4.6, 7.5 + Math.sin(t * .8 + h.phase) * 1.6, Math.sin(a) * 4.6);
      h.head.lookAt(p.feet.x, 1.6, p.feet.z);
    }
    manifesto.material.emissiveIntensity = 1.6 + .7 * Math.sin(t * 2.6);
    redGlow.intensity = 2 + .8 * Math.sin(t * 2.6);
  });
  z.interact(0, 1.5, -35, 7,
    () => nq.root ? 'E — the open-sourced heart' : 'E — deploy the Copyleft Ouija Board',
    () => {
      if (nq.root) return 'The ledger lies open. Every epitaph is forkable now.';
      nq.root = true;
      for (const e of coffinEdges) { e.material.color.set(0x46ff9a); e.material.opacity = .5; }
      world.sfx('dialup');
      z.fxFlash = true;
      return 'Logos deploys a Copyleft Ouija Board, open-sourcing the necropolis. “They built this on stolen ghosts. Let’s give the dead ROOT ACCESS.” The coffin seals flicker green — flare the torch beside the racks to crack them.';
    });

  // ---- mausoleums with neurograffiti ----
  const mausoleumDefs = [[-30, -30, .3], [30, -28, -.4], [28, 14, .8]];
  for (const [mx, mz, rot] of mausoleumDefs) {
    const m = box(z, 7, 4.5, 5, mat(0x222831, { rough: .85 }), mx, 2.25, mz, { collide: true, rotY: rot });
    const roof2 = box(z, 7.8, .7, 5.8, mat(0x171c24, { rough: .8 }), mx, 4.85, mz, { rotY: rot });
    glowPanel(z, textPanel({
      lines: ['YOU ARE NOT', 'A STOCK PHOTO'], w: 512, h: 256, bg: null, fg: '#46ff9a',
      font: 'bold 58px "Comic Sans MS", cursive, sans-serif', glow: '#46ff9a',
    }), 5.4, 2.7, mx + Math.sin(rot) * 2.56, 2.3, mz + Math.cos(rot) * 2.56, { rotY: rot, intensity: 1.6, cutout: true });
  }

  // griefbots hovering, repurposed and chanting
  for (let i = 0; i < 2; i++) {
    const bot = new THREE.Group();
    const bb = new THREE.Mesh(new THREE.SphereGeometry(.35, 10, 8), mat(0x2a3040, { metal: .8, rough: .3 }));
    bot.add(bb);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), emat(0x46ff9a, 2));
    lens.position.set(0, -.1, .3);
    bot.add(lens);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .05, 6, 18), mat(0x3a4254, { metal: .7, rough: .4 }));
    ring.rotation.x = Math.PI / 2;
    bot.add(ring);
    z.add(bot);
    const cx = i === 0 ? -30 : 30, cz = i === 0 ? -30 : -28;
    z.onUpdate((dt, t) => {
      const a = t * .7 + i * Math.PI;
      bot.position.set(cx + Math.cos(a) * 5, 3.2 + Math.sin(t * 1.3 + i) * .5, cz + Math.sin(a) * 5);
      bot.rotation.y = -a;
    });
  }
  z.interact(-30, 1.5, -30, 6, 'E — the graffiti mausoleum',
    () => 'Praxis hacked the griefbots — drones built to harvest tear-duct data — and set them spray-painting “You Are Not a Stock Photo” on every mausoleum wall. They chant union hymns now.');

  // ambient soul fireflies
  const drift = fireflies({ box: [80, 7, 80], cy: 4, count: 70, color: [.55, .75, 1], size: .13 });
  z.add(drift.points);
  z.onUpdate((dt) => drift.update(dt));

  // contact shadows
  for (const rd of rackDefs) aoBlob(z, rd.x, rd.zz, 2.6, .5);
  aoBlob(z, 0, -12, 3.2, .5);   // Maria's shrine
  aoBlob(z, 0, -40, 5.6, .55);  // the hydra
  for (const [mx, mz] of [[-30, -30], [30, -28], [28, 14]]) aoBlob(z, mx, mz, 5.4, .5);

  // ---- reveals ----
  reveal(z, { lines: ['THEY FARM', 'GENERATIONAL GRIEF'], w: 18, h: 6, x: 0, y: 5.5, z: 22, color: '#ff6a7a' });
  reveal(z, { lines: ['LEDGER OF STOLEN GHOSTS'], w: 20, h: 2.6, x: -24, y: 4, z: -14, rotY: Math.PI / 2, color: '#b48cff' });
  reveal(z, { lines: ['NECROECONOMICS ▾ 1215nm'], w: 14, h: 2.4, x: 0, y: .15, z: 2, rotX: -Math.PI / 2, color: '#8a9cff', maxOpacity: .85 });

  return z;
}
