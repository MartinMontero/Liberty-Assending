// Epilogue · The Unseen Garden — saplings split concrete; the revolution grows at the speed of soil.
import * as THREE from 'three';
import { Zone, mat, emat, box, cyl, ground, bounds, sky, glowPanel, reveal, glowSprite, aoBlob } from '../world.js';
import { textPanel, gardenGroundTexture, paintedSky, noiseNormalTexture, glowTexture } from '../textures.js';
import { fireflies } from '../particles.js';

function tree(z, x, zz, scale = 1, lean = 0) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(.22 * scale, .4 * scale, 4.4 * scale, 8),
    mat(0x5a4632, { rough: .95 }),
  );
  trunk.position.set(x, 2.2 * scale, zz);
  trunk.rotation.z = lean;
  trunk.castShadow = true;
  z.add(trunk);
  const greens = [0x4a7c2c, 0x5a9a3a, 0x3f6b26];
  for (let i = 0; i < 3; i++) {
    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry((1.6 - i * .28) * scale, 0),
      mat(greens[i % 3], { rough: 1 }),
    );
    blob.position.set(
      x + Math.sin(lean) * 4 * scale + (Math.random() - .5) * 1.2 * scale,
      (4 + i * 1.15) * scale,
      zz + (Math.random() - .5) * 1.2 * scale,
    );
    blob.scale.y = .8;
    blob.castShadow = true;
    z.add(blob);
  }
  z.collide(x - .45 * scale, x + .45 * scale, zz - .45 * scale, zz + .45 * scale, 4 * scale);
}

function sapling(z, x, zz, s = 1) {
  cyl(z, .03 * s, .06 * s, 1 * s, mat(0x4a7c2c, { rough: 1 }), x, .5 * s, zz);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(.22 * s, 6, 5), mat(0x5a9a3a, { rough: 1 }));
  leaf.scale.set(1, .65, 1);
  leaf.position.set(x, 1.05 * s, zz);
  z.add(leaf);
  return leaf;
}

export function buildGarden(world) {
  const z = new Zone({
    id: 'garden',
    name: 'The Unseen Garden',
    chapter: 'Epilogue · The Unseen Garden',
    origin: new THREE.Vector3(12000, 0, 0),
    fog: { color: 0xf0e2c2, density: 0.0045 },
    spawn: { x: 0, z: 34, yaw: 0 },
    keywords: ['garden', 'unseen', 'epilogue', 'end', 'tree', 'trees', 'soil', 'grow', 'forest',
      'sapling', 'acorn', 'seed', 'peace', 'dawn', 'home'],
    short: 'Years later: saplings split the concrete where the server farm stood.',
    narration: 'Years later, saplings split concrete where the server farm stood. The Unrenderables teach under open skies, data stored in oral sagas and seed libraries. The Corp-Statists still reign somewhere beyond the haze — but their Eternal Beta chases ghosts in the analog static. Here, the revolution grows at the speed of soil.',
    quote: 'Liberty, now a myth whispered in WiFi dead zones, needs no torch.',
  });
  world.register(z);

  // ---- dawn: warm cumulus catching first light ----
  sky(z, new THREE.MeshBasicMaterial({
    map: paintedSky({
      stops: [[0, '#6aa4d4'], [0.4, '#e8c890'], [0.66, '#f4a868'], [0.84, '#e88858'], [1, '#caa070']],
      clouds: [
        { y: .26, count: 9, size: 44, color: 'rgba(255,235,215,.5)', rim: 'rgba(255,180,120,.3)', spread: .14 },
        { y: .46, count: 10, size: 30, color: 'rgba(255,220,190,.42)', rim: 'rgba(255,160,100,.32)', spread: .1 },
        { y: .62, count: 6, size: 20, color: 'rgba(255,205,170,.4)', rim: 'rgba(255,150,90,.3)', spread: .06 },
      ],
    }),
  }));
  const sunGlow = glowSprite(z, glowTexture('rgba(255,230,180,1)'), 0xffe2b0, 90, 140, 60, -260, .95);
  sunGlow.material.fog = false;
  const hemi = new THREE.HemisphereLight(0xfff2dc, 0x6a7c4a, 1.1);
  z.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe0b0, 1.6);
  sun.position.set(60, 70, -60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
  sun.shadow.camera.far = 260;
  sun.shadow.bias = -0.0004;
  z.add(sun);
  z.add(sun.target);

  ground(z, 240, gardenGroundTexture(), { normal: noiseNormalTexture({ strength: 1.8 }), normalScale: .7 });
  bounds(z, 56);

  // ---- the grove ----
  const treeSpots = [
    [-16, -10, 1.3, .04], [12, -18, 1.6, -.06], [-28, -26, 1.1, .1], [26, -30, 1.4, 0],
    [-8, -34, 1.8, -.04], [20, 2, 1, .08], [-34, 6, 1.2, -.1], [34, -12, 1.1, .05],
    [6, -44, 1.3, 0], [-20, 14, .9, .06], [30, 16, 1, -.05], [-38, -12, 1, 0],
  ];
  for (const [tx, tz, s, lean] of treeSpots) {
    tree(z, tx, tz, s, lean);
    aoBlob(z, tx, tz, 2.6 * s, .35);
  }
  aoBlob(z, -18, 8, 2.2, .4);          // plinth
  aoBlob(z, 22, 18, 4, .35);           // seed library
  aoBlob(z, 0, 6, 5.6, .3);            // story circle
  aoBlob(z, -34, -40, 8, .35);         // fallen smokestack
  for (let i = 0; i < 4; i++) aoBlob(z, -10 + i * 7, -22, 1.9, .4); // old racks
  for (let i = 0; i < 12; i++) {
    sapling(z, (Math.random() - .5) * 70, (Math.random() - .5) * 70, .7 + Math.random() * .9);
  }

  // wildflowers: little emissive dots on stems
  const flowerColors = [0xff6b9d, 0xffd36b, 0xb06bff, 0xff8f6b, 0x6bdcff];
  for (let i = 0; i < 60; i++) {
    const fx = (Math.random() - .5) * 90, fz = (Math.random() - .5) * 90;
    cyl(z, .015, .02, .5, mat(0x4a7c2c, { rough: 1 }), fx, .25, fz, { seg: 5 });
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(.09, 6, 5),
      emat(flowerColors[i % 5], .5),
    );
    bloom.position.set(fx, .55, fz);
    z.add(bloom);
  }

  // ---- overgrown server racks (the old farm) ----
  for (let i = 0; i < 4; i++) {
    const rx = -10 + i * 7, rz = -22;
    const rack = box(z, 2, 2.6, 1.1, mat(0x3a4440, { metal: .4, rough: .8 }), rx, 1.1, rz, { collide: true });
    rack.rotation.z = (Math.random() - .5) * .3;
    rack.castShadow = true;
    // vines
    const vine = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx - .8, 0, rz + .6),
        new THREE.Vector3(rx - .9, 1.2, rz + .2),
        new THREE.Vector3(rx - .2, 2.2, rz - .2),
        new THREE.Vector3(rx + .7, 2.6, rz + .3),
      ]), 12, .06, 5),
      mat(0x4a7c2c, { rough: 1 }),
    );
    z.add(vine);
    const moss = new THREE.Mesh(new THREE.SphereGeometry(.5, 7, 5), mat(0x5a9a3a, { rough: 1 }));
    moss.scale.set(1.4, .4, .9);
    moss.position.set(rx + .3, 2.5, rz);
    z.add(moss);
  }
  // a sapling literally splitting concrete: tilted slabs around a young tree
  tree(z, 4, -22, .8, 0);
  const slab1 = box(z, 1.8, .25, 1.4, mat(0x6a6a66, { rough: .9 }), 3.2, .25, -21.4);
  slab1.rotation.set(.1, .3, .35);
  const slab2 = box(z, 1.6, .25, 1.2, mat(0x6a6a66, { rough: .9 }), 4.9, .2, -22.6);
  slab2.rotation.set(-.12, -.2, -.3);
  z.interact(4, .8, -22, 4, 'E — the split concrete', () => {
    return 'A sapling has cracked the server-farm floor clean in half. Nobody archived it. Nobody monetized it. It simply grew.';
  });

  // ---- seed library ----
  const slx = 22, slz = 18;
  box(z, 7, .3, 3, mat(0x6a5238, { rough: .9 }), slx, 2.5, slz);
  box(z, 7, .3, 3, mat(0x6a5238, { rough: .9 }), slx, 1.4, slz);
  box(z, .3, 2.8, 3, mat(0x5a4632, { rough: .9 }), slx - 3.4, 1.4, slz, { collide: true });
  box(z, .3, 2.8, 3, mat(0x5a4632, { rough: .9 }), slx + 3.4, 1.4, slz, { collide: true });
  for (let i = 0; i < 8; i++) {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .5, 10), new THREE.MeshStandardMaterial({
      color: 0xd8e8e0, roughness: .1, metalness: 0, transparent: true, opacity: .4,
    }));
    jar.position.set(slx - 2.8 + (i % 4) * 1.9, 1.85 + Math.floor(i / 4) * 1.1, slz + (Math.random() - .5));
    z.add(jar);
    const seeds = new THREE.Mesh(new THREE.SphereGeometry(.15, 6, 5), mat([0x8a6a3a, 0x6a4a2a, 0x9a8a4a][i % 3], { rough: 1 }));
    seeds.scale.y = .6;
    seeds.position.set(jar.position.x, jar.position.y - .1, jar.position.z);
    z.add(seeds);
  }
  glowPanel(z, textPanel({
    lines: ['SEED LIBRARY', 'take · plant · remember'], w: 768, h: 220, bg: '#2c2014',
    fg: ['#ffe2b0', '#c8e8a0'], font: 'bold 56px Georgia, serif', glow: '#ffe2b0', border: '#4a3826',
  }), 6.5, 1.9, slx, 4.4, slz, { intensity: 1.1, double: true });
  z.interact(slx, 1.5, slz, 5, 'E — the seed library', () => {
    return 'Jars of heirloom seed, labeled by hand. Data stored in oral sagas and root systems — a format no Eternal Beta can deprecate.';
  });

  // ---- the empty plinth ----
  const plinth = cyl(z, 1.1, 1.4, 1.6, mat(0x8a8a82, { rough: .8 }), -18, .8, 8, { collide: true, seg: 16 });
  plinth.castShadow = true;
  const mossP = new THREE.Mesh(new THREE.SphereGeometry(.7, 7, 5), mat(0x5a9a3a, { rough: 1 }));
  mossP.scale.set(1.4, .25, 1.4);
  mossP.position.set(-18, 1.62, 8);
  z.add(mossP);
  glowPanel(z, textPanel({
    lines: ['HERE STOOD NO STATUE.', 'SHE NEEDED NO TORCH.'], w: 1024, h: 200, bg: '#3a3a34',
    fg: '#f4ecd8', font: 'italic bold 52px Georgia, serif', glow: 0, border: '#5a5a50',
  }), 3.4, .7, -18, .8, 9.42, { intensity: .7 });
  z.interact(-18, 1, 8, 4, 'E — the empty plinth', () => {
    return 'Liberty, now a myth whispered in WiFi dead zones, needs no torch. The light moved into the people. (It is in your hand.)';
  });

  // ---- story circle + planting ritual ----
  const circleX = 0, circleZ = 6;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const log = box(z, 2.2, .55, .7,
      mat(0x6a5238, { rough: .95 }),
      circleX + Math.cos(a) * 4.4, .27, circleZ + Math.sin(a) * 4.4,
      { rotY: -a + Math.PI / 2, collide: true });
    log.castShadow = true;
  }
  const basket = cyl(z, .65, .5, .55, mat(0x8a6a3a, { rough: 1 }), circleX, .27, circleZ, { seg: 12 });
  const acorns = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 6), mat(0x6a4a2a, { rough: 1 }));
  acorns.scale.y = .5;
  acorns.position.set(circleX, .55, circleZ);
  z.add(acorns);
  glowPanel(z, textPanel({
    lines: ['plant the future'], w: 512, h: 90, bg: null, fg: '#7a9a4a',
    font: 'italic 44px Georgia, serif', glow: '#c8e8a0',
  }), 3.4, .6, circleX, 1.7, circleZ - 1.1, { intensity: 1, double: true, cutout: true });

  // growing saplings, planted by the player
  const planted = [];
  z.onUpdate((dt) => {
    for (const p of planted) {
      if (p.k < 1) {
        p.k = Math.min(1, p.k + dt * .5);
        const s = p.k * p.target;
        p.group.scale.setScalar(Math.max(.001, s));
      }
    }
  });
  z.plantSapling = () => {
    const a = Math.random() * Math.PI * 2, r = 2.2 + Math.random() * 9;
    const px = circleX + Math.cos(a) * r, pz = circleZ + Math.sin(a) * r;
    const g = new THREE.Group();
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.05, .09, 1.6, 7), mat(0x4a7c2c, { rough: 1 }));
    st.position.y = .8;
    g.add(st);
    const lv = new THREE.Mesh(new THREE.SphereGeometry(.42, 7, 5), mat(0x5a9a3a, { rough: 1 }));
    lv.scale.set(1, .7, 1);
    lv.position.y = 1.7;
    lv.castShadow = true;
    g.add(lv);
    g.position.set(px, 0, pz);
    g.scale.setScalar(.001);
    z.add(g);
    planted.push({ group: g, k: 0, target: .9 + Math.random() * .9 });
  };

  // the true ending: when every chapter is liberated and the future is planted
  z.trueEnding = () => {
    const bloom = fireflies({ box: [30, 10, 30], cx: 0, cy: 5, cz: 6, count: 160, color: [1, .85, .45], size: .17 });
    z.add(bloom.points);
    z.onUpdate((dt) => bloom.update(dt));
    for (let i = 0; i < 5; i++) z.plantSapling();
  };
  z.quest = () => {
    const left = 6 - world.liberated.size;
    if (left > 0) return `${left} chapter${left === 1 ? '' : 's'} of the Ring still stand — the torch knows the way (T)`;
    return 'Every chapter walks free. Plant the future at the story circle (E)';
  };

  // golden pollen + fireflies
  const pollen = fireflies({ box: [90, 8, 90], cy: 3.5, count: 80, color: [1, .88, .55], size: .12 });
  z.add(pollen.points);
  z.onUpdate((dt) => pollen.update(dt));

  // distant fallen smokestack, overgrown
  const fallen = cyl(z, 1.6, 2, 22, mat(0x5a5a56, { rough: .9 }), -34, 1.4, -40, { seg: 10 });
  fallen.rotation.z = Math.PI / 2.2;
  fallen.castShadow = true;
  z.collide(-45, -23, -43, -37, 3);
  for (let i = 0; i < 4; i++) {
    const moss2 = new THREE.Mesh(new THREE.SphereGeometry(.8, 6, 5), mat(0x5a9a3a, { rough: 1 }));
    moss2.scale.set(1.3, .4, 1);
    moss2.position.set(-40 + i * 4, 2.6 - i * .3, -40 + (Math.random() - .5) * 2);
    z.add(moss2);
  }

  // epigraph floating soft in the air
  glowPanel(z, textPanel({
    lines: ['the revolution is growing', 'at the speed of soil'], w: 1280, h: 280, bg: null,
    fg: '#fff4dc', font: 'italic bold 72px Georgia, serif', glow: '#ffd9a0',
  }), 22, 4.8, 0, 12, -34, { intensity: 1.1, double: true, cutout: true });

  // ---- reveals (the torch shows only love here) ----
  reveal(z, { lines: ['FOR MARIA'], w: 10, h: 2.4, x: 0, y: 4.5, z: 6, color: '#ffd9a0', maxOpacity: .95 });
  reveal(z, { lines: ['GROW'], w: 7, h: 2.4, x: 0, y: .15, z: 12, rotX: -Math.PI / 2, color: '#a0e87a', maxOpacity: .9 });

  return z;
}
