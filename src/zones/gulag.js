// Chapter 4 · The NFT Gulag — a neon bazaar where rebellion is resold.
import * as THREE from 'three';
import { Zone, mat, emat, box, cyl, ground, bounds, sky, glowPanel, reveal, aoBlob } from '../world.js';
import { textPanel, grimeTexture, paintedSky, noiseNormalTexture, nftArtTexture } from '../textures.js';
import { fireflies } from '../particles.js';

export function buildGulag(world) {
  const z = new Zone({
    id: 'gulag',
    name: 'The NFT Gulag',
    chapter: 'Chapter 4 · The NFT Gulag',
    origin: new THREE.Vector3(4000, 0, 0),
    fog: { color: 0x0e0618, density: 0.013 },
    spawn: { x: 0, z: 32, yaw: 0 },
    keywords: ['gulag', 'nft', 'bazaar', 'market', 'crypto', 'kingpin', 'token', 'blockchain',
      'eth', 'stall', 'chapter 4', 'trade', 'mint'],
    short: 'Stall after stall hawking revolution-lite, under the Kingpin’s crown.',
    narration: 'The air buzzes with the static of a thousand transactions. Stall after stall hawks revolution-lite — berets as .gifs, uprisings chopped into viral clips, dissent reduced to a liquidity pool. Above it all looms the Crypto Kingpin, a shape-shifting algorithm wearing a crown of blockchain hashes.',
    quote: '“Why die for freedom when you can trade it? Slogans depreciate — my NFTs appreciate!” — the Crypto Kingpin',
  });
  world.register(z);

  sky(z, new THREE.MeshBasicMaterial({
    map: paintedSky({
      stops: [[0, '#02010a'], [0.55, '#140a2e'], [0.8, '#3a1456'], [1, '#0a0518']],
      stars: 240,
      clouds: [
        { y: .34, count: 7, size: 56, color: 'rgba(140,50,200,.16)', spread: .2 },
        { y: .55, count: 6, size: 40, color: 'rgba(70,40,180,.18)', rim: 'rgba(255,80,200,.1)', spread: .14 },
      ],
    }),
  }));
  const hemi = new THREE.HemisphereLight(0x8a6ac0, 0x1a1028, 1.0);
  z.add(hemi);
  ground(z, 240, grimeTexture('#241a36', '#0e0a18', '#3e3054', 2600), { normal: noiseNormalTexture({ strength: 1.6 }), normalScale: .6 });
  bounds(z, 54);

  // neon guide-strips along the bazaar alley
  for (const sideX of [-6.4, 6.4]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(.22, .06, 56),
      emat(sideX < 0 ? 0xff3b9b : 0x3bd5ff, 1.3),
    );
    strip.position.set(sideX, .03, 0);
    z.add(strip);
  }

  const dark = mat(0x1a1622, { rough: .7, metal: .3 });

  // ---- market stalls in two facing rows ----
  const wares = [
    { sign: 'CHE’S BERET .GIF — 10 ETH', color: '#ff3b6b' },
    { sign: 'STONEWALL BRICK — “OWN HISTORY!”', color: '#ffd36b' },
    { sign: 'REVOLUTION™ STARTER PACK — 4 ETH', color: '#6bdcff' },
    { sign: 'GUILLOTINE MASK SKIN — 3 ETH', color: '#b06bff' },
    { sign: 'PROTEST CLIP (DEEPFAKED) — 0.5 ETH', color: '#ff8f6b' },
    { sign: 'LIBERTY’S SPEECH, CHOPPED — 2 ETH/CLIP', color: '#7dffb0' },
  ];
  wares.forEach((w, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const sx = side * 10;
    const sz = 18 - Math.floor(i / 2) * 16;
    const stall = new THREE.Group();
    stall.position.set(sx, 0, sz);
    stall.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    // counter + posts + canopy
    const counter = new THREE.Mesh(new THREE.BoxGeometry(6, 1.1, 2), dark);
    counter.position.y = .55;
    stall.add(counter);
    for (const px of [-2.8, 2.8]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 3.4, 8), mat(0x3a3346, { metal: .6, rough: .5 }));
      post.position.set(px, 1.7, -.8);
      stall.add(post);
    }
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.6, .14, 3), emat(new THREE.Color(w.color).getHex(), .55));
    canopy.position.set(0, 3.5, -.2);
    canopy.rotation.x = .12;
    stall.add(canopy);
    // the "artwork"
    const art = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshStandardMaterial({
      map: nftArtTexture(i * 7 + 3), emissive: 0xffffff, emissiveMap: nftArtTexture(i * 7 + 3), emissiveIntensity: .65,
    }));
    art.position.set(0, 2.2, -.7);
    stall.add(art);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.1, .1), mat(0xc8a83c, { metal: .9, rough: .25 }));
    frame.position.set(0, 2.2, -.78);
    stall.add(frame);
    z.add(stall);
    z.collideMesh(counter);
    // price sign
    glowPanel(z, textPanel({
      lines: [w.sign], w: 1024, h: 110, bg: '#0a0814', fg: w.color,
      font: 'bold 52px "Courier New", monospace', glow: w.color, border: '#221c30',
    }), 6.4, .7, sx + side * -0.0, 4.4, sz, { rotY: side > 0 ? -Math.PI / 2 : Math.PI / 2, intensity: 1.7, double: true });
    // stall lamp
    const lamp = new THREE.PointLight(new THREE.Color(w.color).getHex(), 2.6, 15, 1.9);
    lamp.position.set(sx + side * -1.5, 3.2, sz);
    z.add(lamp);
  });
  z.interact(-10, 1.2, 18, 4.5, 'E — inspect the wares',
    () => '“They’ve commodified the concept of resistance,” Logos mutters. “The Ring’s final joke — turn dissent into a liquidity pool.”');

  // ---- NFT peddlers in glitch-core guillotine masks — scorch them with truth ----
  const gq = { scorched: 0, crownFallen: 0, relicFreed: false, floodHeat: 0 };
  const peddlers = [];
  for (const [wx, wz] of [[-10, 16], [10, 0], [-10, -16]]) {
    const w = new THREE.Group();
    const robeP = new THREE.Mesh(new THREE.ConeGeometry(.6, 2.1, 9), new THREE.MeshStandardMaterial({
      color: 0x0c0a14, roughness: .6, transparent: true, opacity: .85, emissive: 0x2a1240, emissiveIntensity: .5,
    }));
    robeP.position.y = 1.05;
    w.add(robeP);
    const mask = new THREE.Mesh(new THREE.PlaneGeometry(.5, .62), new THREE.MeshStandardMaterial({
      color: 0x000, emissive: 0xff3b6b, emissiveIntensity: 1.2, side: THREE.DoubleSide,
    }));
    mask.position.set(0, 1.95, .26);
    w.add(mask);
    w.position.set(wx + 2.2, 0, wz);
    z.add(w);
    peddlers.push({ w, robeP, mask, heat: 0, dead: false, x: wx + 2.2, z: wz });
  }
  z.onUpdate((dt, t, player, p) => {
    for (const pd of peddlers) {
      if (pd.dead) {
        pd.w.scale.x = pd.w.scale.z = Math.max(.01, pd.w.scale.x - dt * 1.2);
        pd.w.scale.y = pd.w.scale.y + dt * 2.4;
        pd.robeP.material.opacity = Math.max(0, pd.robeP.material.opacity - dt * 1.4);
        pd.mask.material.emissiveIntensity = Math.max(0, pd.mask.material.emissiveIntensity - dt * 2);
        continue;
      }
      pd.w.rotation.y = Math.atan2(player.x - pd.x, player.z - pd.z); // they watch you hawk their wares
      const d = Math.hypot(player.x - pd.x, player.z - pd.z);
      if (world.flare > .55 && d < 8) {
        pd.heat += dt;
        pd.mask.material.emissiveIntensity = 1.2 + pd.heat * 3;
        if (pd.heat > .7) {
          pd.dead = true;
          gq.scorched++;
          world.sfx('free');
          z.fxFlash = true;
          if (gq.scorched === 1) world.notify('The 1215 nm beam — wavelength of unmarketable truth — scorches the peddler where he stands. He unminted.', 5);
          if (gq.scorched === 3) world.notify('The bazaar’s sellers are smoke. Their listings 404 into the dark.', 5);
        }
      } else pd.heat = Math.max(0, pd.heat - dt);
    }
    // flooding the Kingpin's market: hold the flare before him
    if (!gq.crownFallen && world.flare > .55 && Math.hypot(player.x, player.z + 38) < 16) {
      gq.floodHeat += dt;
      if (gq.floodHeat > 1.4) {
        gq.crownFallen = 1;
        world.sfx('sever');
        z.fxFlash = true;
        world.notify('“You can’t hash solidarity.” You flood the chain with INFINITE COPIES of his crown — scarcity dies, and with it, the price.', 6);
      }
    }
    if (gq.crownFallen === 1) {
      let allDown = true;
      for (const hp of hashes) {
        hp.position.y -= dt * 2.6;
        if (hp.position.y > -8) allDown = false; else hp.visible = false;
      }
      wire.material.opacity = Math.max(.12, wire.material.opacity - dt * .3);
      kingLight.intensity = Math.max(.7, kingLight.intensity - dt * 1.2);
      if (allDown) gq.crownFallen = 2;
    }
  });

  // ---- the rarest lot: Liberty's first cry of 'No!' ----
  const podium = cyl(z, 1.2, 1.5, 1.4, mat(0x241c38, { metal: .5, rough: .4 }), 0, .7, -12, { collide: true, seg: 18 });
  const cage = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), new THREE.MeshBasicMaterial({
    color: 0x9a6cff, wireframe: true, transparent: true, opacity: .7,
  }));
  cage.position.set(0, 2.8, -12);
  z.add(cage);
  const relic = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 0), emat(0xffe8b0, 1.7));
  relic.position.set(0, 2.8, -12);
  z.add(relic);
  glowPanel(z, textPanel({
    lines: ['RAREST LOT', 'LIBERTY’S FIRST CRY OF “NO!”', 'bidding: ∞ ETH'], w: 768, h: 256, bg: '#120a20',
    fg: ['#ffd36b', '#fff', '#7dffb0'], font: 'bold 46px "Courier New", monospace', glow: '#ffd36b', border: '#ffd36b',
  }), 5.4, 1.8, 0, 5.4, -12, { intensity: 1.6, double: true });
  z.onUpdate((dt, t) => {
    relic.rotation.y = t * 1.4;
    relic.rotation.x = Math.sin(t * .8) * .4;
    cage.rotation.y = -t * .5;
    relic.material.emissiveIntensity = 1.5 + Math.sin(t * 5) * .5;
  });
  z.interact(0, 1.5, -12, 4.5,
    () => gq.relicFreed ? 'E — the empty podium' : 'E — free her first “No!” (hold F while you press it)',
    () => {
      if (gq.relicFreed) return 'Public-domain fireflies still hum where the lot stood. Copy them. Paste them. Resurrect them.';
      if (world.flare < .45) return 'Hedge-fund avatars raise diamond hands; the bidding soars on her stolen rage. Hold F — burn it free with the verses too radical for the history books — then press E.';
      gq.relicFreed = true;
      relic.visible = false;
      cage.material.opacity = .15;
      world.sfx('free');
      z.fxFlash = true;
      world.grant('marseillaise', 'THE MARSEILLAISE, FIRST DRAFT');
      return '“You want my pain? My rage? Here’s your exclusive drop.” The NFT disintegrates into a swarm of public-domain fireflies — and every wallet in the room auto-donates to Landback.';
    });
  z.quest = () => {
    if (gq.scorched < 3) return `Scorch the NFT peddlers with unmarketable truth — hold F at them (${gq.scorched}/3)`;
    if (!gq.relicFreed) return 'Free Liberty’s first “No!” at the rarest lot — hold F + E';
    if (gq.crownFallen < 2) return 'Stand before the Kingpin and hold F — flood his market with infinite crowns';
    return '⚑ Liberated — the dead are still being mined (press T)';
  };
  z.onUpdate(() => {
    if (gq.scorched === 3 && gq.relicFreed && gq.crownFallen === 2) {
      world.liberate('gulag', 'THE NFT GULAG');
    }
  });

  // ---- public-domain fireflies (freed truths) ----
  const freed = fireflies({ box: [16, 5, 12], cx: 0, cy: 3.4, cz: -12, count: 50, color: [1, .9, .5], size: .14 });
  z.add(freed.points);
  z.onUpdate((dt) => freed.update(dt));

  // ---- the Crypto Kingpin ----
  const king = new THREE.Group();
  king.position.set(0, 9, -38);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 0), new THREE.MeshStandardMaterial({
    color: 0x2a1640, roughness: .25, metalness: .8, emissive: 0x7a3aff, emissiveIntensity: .5, flatShading: true,
  }));
  king.add(core);
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(4.15, 0), new THREE.MeshBasicMaterial({
    color: 0xb06bff, wireframe: true, transparent: true, opacity: .6,
  }));
  king.add(wire);
  // crown of blockchain hashes
  const hashTex = textPanel({ lines: ['#'], w: 64, h: 64, bg: null, fg: '#ffd36b', font: 'bold 52px monospace', glow: '#ffd36b' });
  const crown = new THREE.Group();
  const hashes = [];
  for (let i = 0; i < 10; i++) {
    const hp = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({
      map: hashTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    const a = i / 10 * Math.PI * 2;
    hp.position.set(Math.cos(a) * 5.4, 0, Math.sin(a) * 5.4);
    crown.add(hp);
    hashes.push(hp);
  }
  crown.position.y = 5.4;
  king.add(crown);
  z.add(king);
  z.collide(-4.5, 4.5, -42.5, -33.5, 14);
  const kingLight = new THREE.PointLight(0x9a5aff, 4.5, 52, 1.7);
  kingLight.position.set(0, 10, -34);
  z.add(kingLight);
  z.onUpdate((dt, t, player, p) => {
    king.rotation.y = t * .3;
    wire.rotation.y = -t * .22;
    wire.rotation.x = Math.sin(t * .4) * .3;
    const breathe = 1 + Math.sin(t * 1.1) * .06;
    core.scale.setScalar(breathe);
    crown.rotation.y = t * .8;
    for (const hp of hashes) hp.lookAt(p.feet.x, 14.4, p.feet.z);
    core.material.emissiveIntensity = .75 + .35 * Math.sin(t * 2.2);
  });
  glowPanel(z, textPanel({
    lines: ['“WHY DIE FOR FREEDOM', 'WHEN YOU CAN TRADE IT?”'], w: 1024, h: 230, bg: null,
    fg: '#d8b4ff', font: 'italic bold 64px Georgia, serif', glow: '#9a5aff',
  }), 16, 3.6, 0, 17.5, -38, { intensity: 1.5, cutout: true });
  z.interact(0, 1.5, -33, 7, 'E — challenge the Kingpin',
    () => '“You can’t hash solidarity,” Logos spits, flooding the market with infinite copies of the Kingpin’s crown — rendering it worthless.');

  // ---- high-frequency trading pit ----
  const pit = new THREE.Group();
  pit.position.set(22, 0, 4);
  cyl(z, 7, 7, .5, mat(0x120e1c, { rough: .6 }), 22, .25, 4, { seg: 26 });
  const tickerTex = textPanel({
    lines: ['HOPE ▼ −98%   RAGE ▲ +432%   SOUL ▼ −66%   TRUTH ◌ delisted   GRIEF ▲ +1215%'],
    w: 2048, h: 96, bg: '#050310', fg: '#7dffb0', font: 'bold 54px "Courier New", monospace', glow: '#7dffb0',
  });
  tickerTex.wrapS = THREE.RepeatWrapping;
  const ticker = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 1.1, 32, 1, true), new THREE.MeshBasicMaterial({
    map: tickerTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  ticker.position.set(22, 3.4, 4);
  z.add(ticker);
  z.onUpdate((dt) => { tickerTex.offset.x += dt * .05; });
  // hedge-fund avatars with diamond hands
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2 + .6;
    const hx = 22 + Math.cos(a) * 4.4, hz = 4 + Math.sin(a) * 4.4;
    const fig = new THREE.Group();
    const bodyA = new THREE.Mesh(new THREE.CylinderGeometry(.34, .5, 1.7, 8), mat(0x0e0c16, { rough: .4, metal: .6 }));
    bodyA.position.y = 1.35;
    fig.add(bodyA);
    const headA = new THREE.Mesh(new THREE.SphereGeometry(.26, 10, 8), mat(0x0e0c16, { rough: .3, metal: .7 }));
    headA.position.y = 2.5;
    fig.add(headA);
    const hand = new THREE.Mesh(new THREE.OctahedronGeometry(.22, 0), emat(0x7adcff, 2.2));
    hand.position.set(.42, 2.05, .25);
    fig.add(hand);
    fig.position.set(hx, .5, hz);
    fig.lookAt(22, 1, 4);
    z.add(fig);
    z.onUpdate((dt, t) => { hand.position.y = 2.05 + Math.sin(t * 3 + i * 2) * .18; });
  }
  z.interact(22, 1.2, 4, 6.5, 'E — the trading pit',
    () => 'Hedge-fund avatars raise diamond-handed gloves as bids soar. Keystrokes clash like swords over the dark pool.');

  // ---- meme sweatshop ----
  box(z, 10, 4, 6, mat(0x171225, { rough: .8 }), -24, 2, -8, { collide: true });
  glowPanel(z, textPanel({
    lines: ['MEME SWEATSHOP', 'minting “Revolution™” 24/7'], w: 768, h: 220, bg: '#0c0a16',
    fg: ['#ff6b9d', '#8a84b0'], font: 'bold 50px "Courier New", monospace', glow: '#ff6b9d', border: '#2c2440',
  }), 8.6, 2.4, -24, 4.9, -4.9, { intensity: 1.5 });
  const windowGlow = glowPanel(z, textPanel({
    lines: ['▓▒░ #ThoughtsAndPrayers ░▒▓'], w: 768, h: 96, bg: '#16101f', fg: '#6bdcff',
    font: '40px monospace', glow: '#6bdcff',
  }), 8, .9, -24, 2.2, -4.95, { intensity: 1.1 });
  z.onUpdate((dt, t) => { windowGlow.material.emissiveIntensity = .8 + .5 * Math.abs(Math.sin(t * 1.8)); });
  z.interact(-24, 1.5, -5, 5, 'E — the sweatshop window',
    () => 'Praxis swaps the apathy hashtags for subversive code: “This JPEG Funds Death Squads.” The mint queue shudders.');

  // floating ether shards
  for (let i = 0; i < 8; i++) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(.3 + Math.random() * .3, 0), emat(0x8a6cff, 1.4));
    const sx = (Math.random() - .5) * 80, sz2 = (Math.random() - .5) * 80;
    shard.position.set(sx, 4 + Math.random() * 6, sz2);
    z.add(shard);
    z.onUpdate((dt, t) => {
      shard.rotation.y = t * (.5 + i * .1);
      shard.position.y += Math.sin(t * .9 + i) * .003;
    });
  }

  // contact shadows
  for (let i = 0; i < 6; i++) {
    aoBlob(z, (i % 2 === 0 ? -1 : 1) * 10, 18 - Math.floor(i / 2) * 16, 4.4, .45);
  }
  aoBlob(z, 0, -12, 2.8, .5);    // relic podium
  aoBlob(z, 0, -38, 6.5, .5);    // kingpin
  aoBlob(z, -24, -8, 6.4, .42);  // sweatshop
  aoBlob(z, 22, 4, 8.4, .4);     // trading pit

  // ---- reveals ----
  reveal(z, { lines: ['DISSENT → LIQUIDITY POOL'], w: 22, h: 3, x: 0, y: 6.5, z: 24, color: '#ff9ad5' });
  reveal(z, { lines: ['YOUR RAGE: TOKENIZED', 'YOUR GRIEF: COLLATERAL'], w: 16, h: 4.4, x: -12, y: 4, z: -24, rotY: Math.PI / 3, color: '#b48cff' });
  reveal(z, { lines: ['⇣ EXIT LIQUIDITY (YOU) ⇣'], w: 14, h: 2.6, x: 0, y: .15, z: 6, rotX: -Math.PI / 2, color: '#9a7cff', maxOpacity: .85 });

  return z;
}
