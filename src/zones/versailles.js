// Chapter 3 · The Meme Wars of Old Versailles — a metaverse palace under a Twitch sky.
import * as THREE from 'three';
import { Zone, mat, emat, box, cyl, ground, bounds, sky, glowPanel, reveal, glowSprite } from '../world.js';
import { textPanel, glitchGrassTexture, palaceWallTexture, chatTexture, glowTexture, mirrorShardTexture, skyGradient } from '../textures.js';
import { Particles, fireflies } from '../particles.js';

export function buildVersailles(world) {
  const z = new Zone({
    id: 'versailles',
    name: 'Old Versailles',
    chapter: 'Chapter 3 · The Meme Wars of Old Versailles',
    origin: new THREE.Vector3(2000, 0, 0),
    fog: { color: 0x9fd4e8, density: 0.0085 },
    spawn: { x: 0, z: 34, yaw: 0 },
    keywords: ['versailles', 'palace', 'marie', 'queen', 'meme', 'metaverse', 'mirror', 'mirrors',
      'macaron', 'guillotine', 'chapter 3', 'vr', 'court', 'peacock'],
    short: 'VR lawns glitching under a Twitch-stream sky; the Queen is live.',
    narration: 'The air smells of burnt pixels and rosewater algorithms. VR grass glitches between manicured lawns and a block-game server, and the sky itself is a stream — chat scrolling like constellations. Holographic peacocks fan tails of trending hashtags while Marie-AI-nette floats atop her Macarons of Power™, auto-tuned to ASMR perfection.',
    quote: '“Why revolt when you can resolve? Download Civic Virtue™!” — Marie-AI-nette',
  });
  world.register(z);

  // ---- Twitch-stream sky: bright VR day + scrolling chat constellation overlay ----
  sky(z, new THREE.MeshBasicMaterial({
    map: skyGradient([[0, '#3a7ec8'], [0.45, '#7ab8e0'], [0.75, '#c8e8f4'], [1, '#9ad0e8']]),
  }));
  const chatTex = chatTexture();
  chatTex.repeat.set(6, 3);
  const chatDome = sky(z, new THREE.MeshBasicMaterial({
    map: chatTex, transparent: true, opacity: .8, depthWrite: false,
  }), 360);
  chatDome.renderOrder = 1;
  z.onUpdate((dt) => { chatTex.offset.y -= dt * 0.012; chatTex.offset.x += dt * 0.004; });
  const hemi = new THREE.HemisphereLight(0xeaf6ff, 0x5a7a4a, 1.15);
  z.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.1);
  sun.position.set(30, 50, 20);
  z.add(sun);

  ground(z, 240, glitchGrassTexture());
  bounds(z, 54);

  const gold = mat(0xd4a43c, { metal: .85, rough: .3 });
  const cream = new THREE.MeshStandardMaterial({ map: palaceWallTexture(), color: 0xffffff, roughness: .8 });

  // ---- palace facade ----
  box(z, 76, 14, 2, cream, 0, 7, -34, { collide: true });
  box(z, 80, 1.2, 3, gold, 0, 14.6, -34);
  // pilasters + glowing windows
  const winTex = textPanel({ lines: ['▦'], w: 64, h: 128, bg: '#3a3422', fg: '#ffd98a', font: 'bold 60px serif', glow: '#ffd98a' });
  for (let i = 0; i < 9; i++) {
    const wx = -32 + i * 8;
    box(z, 1.2, 14, .6, gold, wx, 7, -32.9);
    if (i < 8) {
      glowPanel(z, winTex, 2.2, 4.4, wx + 4, 8.5, -32.95, { intensity: 1.1 });
      glowPanel(z, winTex, 2.2, 3.2, wx + 4, 3.2, -32.95, { intensity: .9 });
    }
  }
  // roof
  const roof = box(z, 78, 3, 6, mat(0x40506a, { rough: .6, metal: .3 }), 0, 16.4, -34);
  roof.rotation.x = 0.0;
  glowPanel(z, textPanel({
    lines: ['✦ MARIE’S LIVE — 10M SUBS ✦'], w: 1024, h: 128, bg: '#1a0f24',
    fg: '#ff6bd5', font: 'bold 64px "Courier New", monospace', glow: '#ff6bd5', border: '#ff6bd5',
  }), 26, 3.2, 0, 19.6, -33, { intensity: 1.7 });

  // ---- NFT champagne fountain ----
  cyl(z, 5.4, 5.7, .8, mat(0xcfd8da, { rough: .4 }), 0, .4, 0, { collide: true, seg: 24 });
  const champagnePool = new THREE.Mesh(new THREE.CylinderGeometry(5.05, 5.05, .1, 24), new THREE.MeshStandardMaterial({
    color: 0xc89030, roughness: .15, metalness: .6, emissive: 0xa87420, emissiveIntensity: .5,
  }));
  champagnePool.position.set(0, .84, 0);
  z.add(champagnePool);
  cyl(z, 1.2, 1.5, 1.6, mat(0xcfd8da, { rough: .4 }), 0, 1.2, 0, { seg: 18 });
  cyl(z, 2.4, 2.6, .35, mat(0xcfd8da, { rough: .4 }), 0, 2.1, 0, { seg: 20 });
  cyl(z, .6, .8, 1.4, mat(0xcfd8da, { rough: .4 }), 0, 2.9, 0, { seg: 14 });
  const champagne = new Particles({
    count: 130,
    gravity: -3.4,
    spawn: (p) => {
      const a = Math.random() * Math.PI * 2;
      p.x = Math.cos(a) * .4; p.z = Math.sin(a) * .4; p.y = 3.6;
      const sp = 1.4 + Math.random() * 1.4;
      p.vx = Math.cos(a) * sp; p.vz = Math.sin(a) * sp; p.vy = 2.6 + Math.random() * 1.6;
      p.life = 1.1 + Math.random() * .8;
      p.size = .12 + Math.random() * .14;
      p.r = 1; p.g = .85; p.b = .45;
    },
  });
  z.add(champagne.points);
  z.onUpdate((dt) => champagne.update(dt));
  const goldGlow = new THREE.PointLight(0xffd98a, 1.6, 18, 2);
  goldGlow.position.set(0, 3.4, 0);
  z.add(goldGlow);
  // golden filigree hashtag above
  glowPanel(z, textPanel({
    lines: ['#LetThemEatCrypto'], w: 1024, h: 160, bg: null, fg: '#ffd35e',
    font: 'italic bold 88px Georgia, serif', glow: '#ffd35e',
  }), 13, 2, 0, 7.2, 0, { intensity: 2, double: true, cutout: true });
  z.interact(0, 1, 0, 7.5, 'E — the NFT champagne fountain',
    () => 'The fountain spews NFT champagne — every droplet minted, every splash a transaction. #LetThemEatCrypto glitters in gold filigree above.');

  // ---- Macarons of Power™ pyramid + Marie-AI-nette ----
  const pastel = [0xffb3c8, 0xc8e8b0, 0xb0d0ff, 0xfff0b0, 0xe0c0ff];
  const pyr = new THREE.Group();
  pyr.position.set(-22, 0, -12);
  let level = 0;
  for (let count = 4; count >= 1; count--, level++) {
    for (let i = 0; i < count; i++) {
      for (let jj = 0; jj < count; jj++) {
        const m = new THREE.Mesh(
          new THREE.CylinderGeometry(.85, .85, .55, 14),
          mat(pastel[(level + i + jj) % pastel.length], { rough: .6 }),
        );
        m.position.set((i - (count - 1) / 2) * 1.9, .35 + level * .72, (jj - (count - 1) / 2) * 1.9);
        pyr.add(m);
        const cream2 = new THREE.Mesh(new THREE.CylinderGeometry(.88, .88, .12, 14), mat(0xfff4e0, { rough: .5 }));
        cream2.position.copy(m.position);
        pyr.add(cream2);
      }
    }
  }
  z.add(pyr);
  z.collide(-26, -18, -16, -8, 3.4);

  // Marie: deepfake gown + auto-tuned halo
  const marie = new THREE.Group();
  const gownTex = textPanel({
    lines: ['build your brand ✧', 'manifest abundance', 'disrupt inequity ✧', 'rise & grind, darlings'],
    w: 512, h: 512, bg: '#7a3a8a', fg: '#ffd6f0', font: 'italic 40px Georgia, serif',
  });
  const gown = new THREE.Mesh(new THREE.ConeGeometry(1.7, 3.4, 18), new THREE.MeshStandardMaterial({
    map: gownTex, roughness: .55, emissive: 0x551a66, emissiveIntensity: .35,
  }));
  gown.position.y = 1.7;
  marie.add(gown);
  const bodice = new THREE.Mesh(new THREE.CylinderGeometry(.42, .62, 1, 12), mat(0xe8d0f4, { rough: .5 }));
  bodice.position.y = 3.9;
  marie.add(bodice);
  const faceTex = textPanel({ lines: ['✿ ◡ ✿'], w: 256, h: 256, bg: '#f4dcc8', fg: '#7a3050', font: 'bold 72px serif' });
  const head = new THREE.Mesh(new THREE.SphereGeometry(.55, 16, 14), new THREE.MeshStandardMaterial({ map: faceTex, roughness: .6 }));
  head.position.y = 4.9;
  marie.add(head);
  const wig = new THREE.Mesh(new THREE.SphereGeometry(.62, 12, 10), mat(0xf2f0fa, { rough: .8 }));
  wig.position.set(0, 5.25, -.12);
  wig.scale.set(1, .8, 1);
  marie.add(wig);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.85, .05, 8, 32), emat(0xff7ad5, 2));
  halo.position.y = 5.6;
  halo.rotation.x = Math.PI / 2.3;
  marie.add(halo);
  marie.position.set(-22, 3.6, -12);
  z.add(marie);
  z.onUpdate((dt, t, player) => {
    marie.position.y = 3.6 + Math.sin(t * .9) * .35;
    halo.rotation.z = t;
    const dx = player.x - (-22), dz = player.z - (-12);
    marie.rotation.y = Math.atan2(dx, dz);
  });
  z.interact(-22, 1.5, -12, 8, 'E — approach Marie-AI-nette',
    () => '“Darling proletarians!” Marie-AI-nette coos, auto-tuned to ASMR perfection. “Why revolt when you can resolve? Download Civic Virtue™ and let’s disrupt inequity — one verified virtue-point at a time!”');

  // ---- holographic peacocks with hashtag tails ----
  const tags = ['#LetThemEatCrypto', '#EatTheRichChallenge', '#CivicVirtueBeta'];
  for (let i = 0; i < 3; i++) {
    const peacock = new THREE.Group();
    const bmat = new THREE.MeshBasicMaterial({
      color: 0x66e8ff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const bodyP = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), bmat);
    bodyP.scale.set(.7, 1, 1.3);
    bodyP.position.y = 1.1;
    peacock.add(bodyP);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.09, .14, 1.1, 8), bmat);
    neck.position.set(0, 1.8, .5);
    neck.rotation.x = -.4;
    peacock.add(neck);
    const headP = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 8), bmat);
    headP.position.set(0, 2.35, .72);
    peacock.add(headP);
    const tailTex = textPanel({
      lines: [tags[i], tags[(i + 1) % 3], tags[(i + 2) % 3], tags[i]], w: 1024, h: 512, bg: null,
      fg: ['#66ffe0', '#ff8ae8', '#ffe066', '#8ab4ff'], font: 'bold 54px "Courier New", monospace', glow: '#66ffe0',
    });
    const tail = new THREE.Mesh(new THREE.CircleGeometry(2.6, 26, 0, Math.PI), new THREE.MeshBasicMaterial({
      map: tailTex, transparent: true, opacity: .75, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    tail.position.set(0, 1.5, -.4);
    peacock.add(tail);
    const px = [14, -8, 24][i], pz = [10, 16, -8][i];
    peacock.position.set(px, 0, pz);
    peacock.rotation.y = i * 2.1;
    z.add(peacock);
    z.onUpdate((dt, t) => {
      tail.material.opacity = .55 + .25 * Math.sin(t * 2 + i * 2);
      peacock.position.y = Math.abs(Math.sin(t * 1.3 + i)) * .12;
      peacock.rotation.y += dt * .14;
    });
  }

  // ---- Guillotine™ stage ----
  const stage = box(z, 10, 1.1, 8, mat(0x6a4a8a, { rough: .6 }), 24, .55, -20, { collide: true });
  const gMat = mat(0x3a2a4a, { rough: .5 });
  box(z, .5, 7.5, .5, gMat, 21.5, 4.85, -22);
  box(z, .5, 7.5, .5, gMat, 26.5, 4.85, -22);
  box(z, 5.5, .6, .5, gMat, 24, 8.9, -22);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.6, .18), new THREE.MeshStandardMaterial({
    color: 0xc8d4e0, metalness: .95, roughness: .15, emissive: 0x8ab4ff, emissiveIntensity: .25,
  }));
  blade.position.set(24, 7.4, -22);
  blade.rotation.z = .12;
  z.add(blade);
  glowPanel(z, textPanel({
    lines: ['GUILLOTINE™', 'tag 3 friends who “deserve” it'], w: 768, h: 220, bg: '#14081f',
    fg: ['#ff5e8a', '#d8c8ff'], font: 'bold 56px "Courier New", monospace', glow: '#ff5e8a', border: '#ff5e8a',
  }), 8, 2.3, 24, 10.6, -22, { intensity: 1.6, double: true });
  z.onUpdate((dt, t) => {
    blade.position.y = 7.4 + Math.max(0, Math.sin(t * .7)) * .5; // it never quite drops
  });
  z.interact(24, 1.6, -20, 6, 'E — the Guillotine™ stage',
    () => 'A teen climate activist is dragged onstage, carbon score flashing red. Liberty’s torch lashes out, coding a counter-meme: “I’M A THREAT? GOOD.” The blade glitches — and slices the macaron pyramid instead.');

  // ---- Hall of Mirrors wing ----
  box(z, 2, 9, 26, cream, 36, 4.5, -13, { collide: true });
  box(z, 2, 9, 26, cream, 44, 4.5, -13, { collide: true });
  box(z, 10, 1, 26, mat(0x40506a, { rough: .6 }), 40, 9.5, -13);
  const shardTex = mirrorShardTexture();
  for (let i = 0; i < 6; i++) {
    const sz = -24 + i * 4.4;
    const sh1 = glowPanel(z, shardTex, 2.6, 6, 37.1, 4.4, sz, { rotY: Math.PI / 2, intensity: .8 });
    const sh2 = glowPanel(z, shardTex, 2.6, 6, 42.9, 4.4, sz, { rotY: -Math.PI / 2, intensity: .8 });
    sh1.material.emissive = new THREE.Color(0xbcd4ec);
    sh2.material.emissive = new THREE.Color(0xbcd4ec);
  }
  for (let i = 0; i < 3; i++) {
    const chand = glowSprite(z, glowTexture('rgba(255,230,170,1)'), 0xffe0a0, 2.4, 40, 7.6, -22 + i * 9, .9);
    z.onUpdate((dt, t) => { chand.material.opacity = .75 + .15 * Math.sin(t * 3 + i * 2); });
  }
  glowPanel(z, textPanel({
    lines: ['HALL OF MIRRORS', 'a kaleidoscope of fractured reputations'], w: 1024, h: 200, bg: '#10141f',
    fg: ['#cfe0f4', '#8a9cc0'], font: 'bold 50px Georgia, serif', glow: '#cfe0f4',
  }), 9, 1.8, 40, 6.2, .2, { intensity: 1.2 });
  z.interact(40, 1.6, -13, 4, 'E — the fractured mirrors',
    () => '“You’re obsolete,” Marie spits from every shard, flickering your deleted credit score. “No platform, no power.” Liberty smiles: “You missed the update.”');

  // courtyard hedges
  for (const [hx, hz, w, d] of [[-14, 14, 10, 1.6], [14, 22, 12, 1.6], [-26, 4, 1.6, 14], [30, 6, 1.6, 12]]) {
    box(z, w, 1.6, d, mat(0x2e5a2e, { rough: 1 }), hx, .8, hz, { collide: true });
  }

  // sparkle motes drifting over the lawns
  const motes = fireflies({ box: [70, 6, 70], cy: 3.4, count: 50, color: [.6, .9, 1], size: .12 });
  z.add(motes.points);
  z.onUpdate((dt) => motes.update(dt));

  // ---- reveals ----
  reveal(z, { lines: ['EVERY “LIKE” FEEDS', 'THE SOCIAL CREDIT ENGINE'], w: 22, h: 6, x: 0, y: 8, z: -32.7, color: '#ff8ae8' });
  reveal(z, { lines: ['STAY ANONYMOUS OR THEY DOX YOUR CORTEX'], w: 26, h: 2.6, x: 0, y: 3.4, z: 12, color: '#b48cff' });
  reveal(z, { lines: ['HARVEST FIELD ▾'], w: 12, h: 2.4, x: 0, y: .15, z: 8, rotX: -Math.PI / 2, color: '#9a7cff', maxOpacity: .85 });

  return z;
}
