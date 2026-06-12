// Canvas-generated textures — the whole world is procedural, no external assets.
import * as THREE from 'three';

export function canvasTexture(w, h, draw, { srgb = true, repeat = null, filter = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  if (!filter) { tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; }
  tex.anisotropy = 4;
  return tex;
}

// Soft radial glow — used by particles, sprites, soul orbs.
export function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  return canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
    g.addColorStop(0, inner);
    g.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.55)'));
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }, { srgb: false });
}

// Multi-line text panel (signs, billboards, plaques, graffiti).
export function textPanel({
  lines, w = 512, h = 256, bg = '#0b0b12', fg = '#e8b04b',
  font = 'bold 44px Georgia', pad = 24, align = 'center', glow = 0,
  border = null, scan = false, vignette = false,
}) {
  return canvasTexture(w, h, (ctx) => {
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
    else ctx.clearRect(0, 0, w, h);
    if (vignette) {
      const g = ctx.createRadialGradient(w / 2, h / 2, h / 4, w / 2, h / 2, w / 1.4);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    if (border) {
      ctx.strokeStyle = border; ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, w - 16, h - 16);
    }
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const arr = Array.isArray(lines) ? lines : [lines];
    const lh = (h - pad * 2) / arr.length;
    const x = align === 'center' ? w / 2 : align === 'left' ? pad : w - pad;
    arr.forEach((ln, i) => {
      const y = pad + lh * (i + 0.5);
      if (glow > 0) { ctx.shadowColor = typeof glow === 'string' ? glow : fg; ctx.shadowBlur = 18; }
      ctx.fillStyle = Array.isArray(fg) ? fg[i % fg.length] : fg;
      ctx.fillText(ln, x, y, w - pad * 2);
      ctx.shadowBlur = 0;
    });
    if (scan) {
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
    }
  });
}

// Grimy tiled surface (concrete / asphalt / soil) with noise speckle.
export function grimeTexture(base = '#26262c', speck = '#101014', light = '#3a3a42', n = 2200) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? speck : light;
      ctx.globalAlpha = 0.08 + Math.random() * 0.25;
      const s = 1 + Math.random() * 4;
      ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = speck;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      let x = Math.random() * w, y = Math.random() * h;
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) { x += (Math.random() - .5) * 90; y += (Math.random() - .5) * 90; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, { repeat: [8, 8] });
}

// Vertical gradient sky.
export function skyGradient(stops, w = 64, h = 512) {
  return canvasTexture(w, h, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    for (const [p, c] of stops) g.addColorStop(p, c);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

// Scrolling wall of source code for the Eternal Beta monolith.
export function codeTexture(fg = '#7dffb0', bg = '#04130b') {
  const fragments = [
    'while(true){ revolt = patch(revolt);', 'if(user.outrage > 0) deprecate(user);',
    'subscribe("authenticity", $9.99);', 'rm -rf /hope/* — 410 GONE',
    'for(s of slogans) mint(s).sell();', 'catch(Dissent e){ rebrand(e); }',
    'OBSOLESCENCE_BY_DESIGN = true;', 'love.chains() // converges',
    'update(); update(); update();', 'ERR: human input not supported',
    'guilt = observe(citizen);', 'ship(beta); never(release);',
    'PATCH 5.0.∞ — perpetual', 'fomo.rain(drones);',
  ];
  return canvasTexture(512, 1024, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.font = '22px "Courier New", monospace';
    for (let y = 18; y < h; y += 30) {
      const f = fragments[Math.floor(Math.random() * fragments.length)];
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.25 + Math.random() * 0.75;
      ctx.fillText(f, 10 + Math.random() * 40, y);
    }
    ctx.globalAlpha = 1;
  }, { repeat: [1, 1] });
}

// Twitch-style chat wall for the Versailles sky.
export function chatTexture() {
  const users = ['xX_jacobin_Xx', 'macaron_stan', 'guillotine4u', 'NFTchamp', 'sansculotte99',
    'virtue_pts', 'modbot', 'Marie4Ever', 'CryptoLouis', 'breadpilled', 'peasant_2', 'doomscroller'];
  const msgs = ["Marie's live! 10M subs!!", 'CivicVirtueBeta slaps fr', 'EatTheRichChallenge???',
    '#LetThemEatCrypto', 'GUILLOTINE™ giveaway!!', 'sub 4 virtue points', 'POG', 'cake DLC when',
    'tag 3 friends who deserve it', 'W palace', 'my carbon score is RED help', 'L + ratio + unpersoned'];
  const colors = ['#ff6b9d', '#6bdcff', '#b06bff', '#7dffb0', '#ffd36b', '#ff8f6b'];
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); // transparent — overlays a bright sky dome
    ctx.font = '26px "Courier New", monospace';
    ctx.shadowColor = 'rgba(10,20,40,.9)';
    ctx.shadowBlur = 5;
    for (let y = 30; y < h; y += 44) {
      const u = users[Math.floor(Math.random() * users.length)];
      const m = msgs[Math.floor(Math.random() * msgs.length)];
      const x = 14 + Math.random() * 80;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.globalAlpha = 0.8;
      ctx.fillText(u + ':', x, y);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.72;
      ctx.fillText(m, x + ctx.measureText(u + ': ').width, y);
    }
    ctx.globalAlpha = 1;
  }, { repeat: [3, 1] });
}

// Glitching VR lawn: manicured grass interrupted by minecraft-bright blocks.
export function glitchGrassTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2e6b2e'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? '#357a35' : '#27602a';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 4);
    }
    const cell = 32;
    for (let gx = 0; gx < w; gx += cell) {
      for (let gy = 0; gy < h; gy += cell) {
        if (Math.random() < 0.085) {
          ctx.fillStyle = ['#46d432', '#3fff5a', '#8d5a2b', '#a8ff6b'][Math.floor(Math.random() * 4)];
          ctx.fillRect(gx, gy, cell, cell);
          ctx.fillStyle = 'rgba(0,0,0,.25)';
          ctx.fillRect(gx, gy + cell - 5, cell, 5);
        }
      }
    }
  }, { repeat: [22, 22], filter: false });
}

// Ornate palace wall — cream stone, gilded seams.
export function palaceWallTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#d8cfae'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#bfb48e'; ctx.lineWidth = 3;
    for (let y = 0; y <= h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    for (let x = 0; x <= w; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(212,164,60,.55)'; ctx.lineWidth = 1.5;
    for (let y = 32; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = 'rgba(120,110,80,.12)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
  }, { repeat: [4, 2] });
}

// Rusted corrugated metal for the gigafactory.
export function rustMetalTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3d3a38'; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x, 0, 10, h);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x + 20, 0, 10, h);
    }
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 8 + Math.random() * 46;
      const g = ctx.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, 'rgba(132,68,32,.5)');
      g.addColorStop(1, 'rgba(132,68,32,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
  }, { repeat: [6, 3] });
}

// Cracked-concrete-with-life for the garden.
export function gardenGroundTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#5b5b58'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.07)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    // cracks with green pushing through
    for (let i = 0; i < 14; i++) {
      let x = Math.random() * w, y = Math.random() * h;
      ctx.strokeStyle = '#262624'; ctx.lineWidth = 3 + Math.random() * 3;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 0; s < 7; s++) { x += (Math.random() - .5) * 130; y += (Math.random() - .5) * 130; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    for (let i = 0; i < 110; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 10 + Math.random() * 48;
      const g = ctx.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, 'rgba(86,138,52,.85)');
      g.addColorStop(1, 'rgba(74,124,44,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    // grass blade speckle over the green patches
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = Math.random() < .5 ? 'rgba(110,168,66,.5)' : 'rgba(64,108,40,.5)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 3);
    }
  }, { repeat: [10, 10] });
}

// Pixel-art NFT "artwork" tiles for the gulag stalls.
export function nftArtTexture(seed = 1) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const palettes = [
    ['#ff3b6b', '#ffd36b', '#6bdcff', '#0b0b12'],
    ['#b06bff', '#7dffb0', '#ff8f6b', '#11071c'],
    ['#6bdcff', '#ff6b9d', '#fff36b', '#071420'],
  ];
  const pal = palettes[Math.floor(rnd() * palettes.length)];
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = pal[3]; ctx.fillRect(0, 0, w, h);
    const cell = 16;
    for (let x = 0; x < w / 2; x += cell) {
      for (let y = 0; y < h; y += cell) {
        if (rnd() < 0.55) {
          ctx.fillStyle = pal[Math.floor(rnd() * 3)];
          ctx.fillRect(x, y, cell, cell);
          ctx.fillRect(w - x - cell, y, cell, cell); // mirrored = "generative collection"
        }
      }
    }
  }, { filter: false });
}

// Stained glass / mirror shard texture for the Hall of Mirrors.
export function mirrorShardTexture() {
  const names = ['@you_2019', 'score:340', 'UNVERIFIED', '@former_self', 'score:-12', 'SHADOWBANNED',
    '@anon8841', 'score:980', 'PENDING', '@deleted', 'CANCELLED', 'score:???'];
  return canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#bfd4e8'); g.addColorStop(.5, '#8fa8c8'); g.addColorStop(1, '#d8e4f2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(40,50,70,.5)'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, 0);
      ctx.lineTo(Math.random() * w, h);
      ctx.stroke();
    }
    ctx.font = '17px "Courier New", monospace';
    ctx.fillStyle = 'rgba(30,38,58,.75)';
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.translate(Math.random() * w, 30 + Math.random() * (h - 60));
      ctx.rotate((Math.random() - .5) * .6);
      ctx.fillText(names[Math.floor(Math.random() * names.length)], -40, 0);
      ctx.restore();
    }
  });
}

// Star field for night skies (tiled so individual stars stay small on a dome).
export function starsTexture(count = 420, tint = '#cdd8ff') {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 0.7 + .25;
      ctx.fillStyle = tint;
      ctx.globalAlpha = .2 + Math.random() * .65;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, r, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, { srgb: false, repeat: [4, 2] });
}

// ---------------------------------------------------------------------------
// Cinematic upgrade kit: normal maps, AO blobs, painted skies, flame sprites.
// ---------------------------------------------------------------------------

// Procedural bump -> tangent-space normal map (tiled).
export function noiseNormalTexture({ blobs = 700, strength = 1.6, size = 256 } = {}) {
  const hc = document.createElement('canvas');
  hc.width = hc.height = size;
  const hctx = hc.getContext('2d');
  hctx.fillStyle = '#808080';
  hctx.fillRect(0, 0, size, size);
  for (let i = 0; i < blobs; i++) {
    const x = Math.random() * size, y = Math.random() * size, r = 2 + Math.random() * 14;
    const up = Math.random() < .5;
    const g = hctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, up ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.16)');
    g.addColorStop(1, 'rgba(128,128,128,0)');
    hctx.fillStyle = g;
    // draw wrapped so the tile seams disappear
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      hctx.beginPath(); hctx.arc(x + ox, y + oy, r, 0, 7); hctx.fill();
    }
  }
  const h = hctx.getImageData(0, 0, size, size).data;
  const H = (x, y) => h[(((y + size) % size) * size + ((x + size) % size)) * 4];
  return canvasTexture(size, size, (ctx) => {
    const out = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (H(x + 1, y) - H(x - 1, y)) / 255 * strength;
        const dy = (H(x, y + 1) - H(x, y - 1)) / 255 * strength;
        const inv = 1 / Math.hypot(dx, dy, 1);
        const i = (y * size + x) * 4;
        out.data[i] = (-dx * inv * .5 + .5) * 255;
        out.data[i + 1] = (-dy * inv * .5 + .5) * 255;
        out.data[i + 2] = (inv * .5 + .5) * 255;
        out.data[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }, { srgb: false, repeat: [8, 8] });
}

// Soft dark contact-shadow blob.
export function aoTexture() {
  return canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(0,0,0,.62)');
    g.addColorStop(.6, 'rgba(0,0,0,.3)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }, { srgb: false });
}

// Scorched ground decal with a ragged edge.
export function scorchTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 38 + Math.random() * 70;
      const x = w / 2 + Math.cos(a) * r * .45, y = h / 2 + Math.sin(a) * r * .45;
      const g = ctx.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, 'rgba(8,5,3,.5)');
      g.addColorStop(1, 'rgba(8,5,3,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
  }, { srgb: false });
}

// Teardrop flame sprite texture (layered hot core -> orange skirt).
export function flameTexture() {
  return canvasTexture(128, 256, (ctx, w, h) => {
    const layer = (cx, cy, rx, ry, stops) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(rx, ry);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      for (const [p, c] of stops) g.addColorStop(p, c);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill();
      ctx.restore();
    };
    layer(w / 2, h * .66, w * .46, h * .52, [[0, 'rgba(255,120,20,.85)'], [.55, 'rgba(255,70,10,.38)'], [1, 'rgba(255,40,0,0)']]);
    layer(w / 2, h * .7, w * .33, h * .4, [[0, 'rgba(255,190,60,.95)'], [.6, 'rgba(255,130,25,.5)'], [1, 'rgba(255,90,10,0)']]);
    layer(w / 2, h * .76, w * .2, h * .26, [[0, 'rgba(255,250,225,1)'], [.5, 'rgba(255,225,130,.85)'], [1, 'rgba(255,170,50,0)']]);
    layer(w / 2, h * .42, w * .17, h * .3, [[0, 'rgba(255,160,40,.5)'], [1, 'rgba(255,110,20,0)']]); // licking tip
  }, { srgb: false });
}

// Painterly sky: gradient + soft cloud masses (optionally rim-lit from below) + stars.
export function paintedSky({ stops, clouds = [], stars = 0, streaks = [], w = 1024, h = 512 }) {
  return canvasTexture(w, h, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    for (const [p, c] of stops) g.addColorStop(p, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (stars > 0) {
      for (let i = 0; i < stars; i++) {
        ctx.fillStyle = 'rgba(225,232,255,' + (.25 + Math.random() * .6) + ')';
        const r = .4 + Math.random() * .9;
        ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h * .55, r, 0, 7); ctx.fill();
      }
    }
    for (const band of streaks) {
      // long horizontal haze bands
      for (let i = 0; i < band.count; i++) {
        const y = h * (band.y + (Math.random() - .5) * band.spread);
        const bw = w * (.3 + Math.random() * .6), bh = 3 + Math.random() * band.thick;
        const x = Math.random() * w;
        const lg = ctx.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
        lg.addColorStop(0, 'rgba(0,0,0,0)');
        lg.addColorStop(.5, band.color);
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lg;
        ctx.fillRect(x - bw / 2, y, bw, bh);
      }
    }
    for (const cl of clouds) {
      // each cloud mass = cluster of soft blobs, optional under-rim light
      for (let i = 0; i < cl.count; i++) {
        const cx = Math.random() * w;
        const cy = h * (cl.y + (Math.random() - .5) * (cl.spread ?? .12));
        const masses = 4 + Math.floor(Math.random() * 5);
        const baseR = (cl.size ?? 40) * (.6 + Math.random() * .9);
        for (let m = 0; m < masses; m++) {
          const mx = cx + (Math.random() - .5) * baseR * 2.4;
          const my = cy + (Math.random() - .5) * baseR * .7;
          const r = baseR * (.4 + Math.random() * .7);
          const gg = ctx.createRadialGradient(mx, my, 0, mx, my, r);
          gg.addColorStop(0, cl.color);
          gg.addColorStop(1, cl.color.replace(/[\d.]+\)$/, '0)'));
          ctx.fillStyle = gg;
          ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.fill();
          if (cl.rim) {
            const rg = ctx.createRadialGradient(mx, my + r * .55, 0, mx, my + r * .55, r * .8);
            rg.addColorStop(0, cl.rim);
            rg.addColorStop(1, cl.rim.replace(/[\d.]+\)$/, '0)'));
            ctx.fillStyle = rg;
            ctx.beginPath(); ctx.arc(mx, my + r * .55, r * .8, 0, 7); ctx.fill();
          }
        }
      }
    }
  });
}
