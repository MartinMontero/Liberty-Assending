// Small CPU particle system on THREE.Points with per-particle size/alpha/color.
import * as THREE from 'three';
import { glowTexture } from './textures.js';

const VERT = /* glsl */`
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (320.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
uniform sampler2D map;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec4 tex = texture2D(map, gl_PointCoord);
  float a = tex.a * vAlpha;
  if (a < 0.012) discard;
  gl_FragColor = vec4(vColor * tex.rgb, a);
}`;

let defaultMap = null;

export class Particles {
  /**
   * cfg:
   *  count, additive (bool), map (texture),
   *  spawn(p) -> set p.x/y/z, p.vx/vy/vz, p.life (sec), p.size, p.r/g/b, p.alpha
   *  gravity (y accel), drag (0..1 per sec), flutter (random accel),
   *  over(p, k) optional per-frame shaping, k = 1 - life/maxLife (age fraction)
   */
  constructor(cfg) {
    this.cfg = cfg;
    const n = cfg.count;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.size = new Float32Array(n);
    this.alpha = new Float32Array(n);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.maxLife = new Float32Array(n);
    this.p = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 1, size: 1, r: 1, g: 1, b: 1, alpha: 1 };

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));

    if (!defaultMap) defaultMap = glowTexture();
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: cfg.map || defaultMap } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: cfg.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;

    // stagger initial lives so streams look continuous from frame one
    for (let i = 0; i < n; i++) {
      this.respawn(i);
      const used = Math.random() * this.maxLife[i];
      this.life[i] -= used;
      this.step(i, used);
    }
    this.flush();
  }

  respawn(i) {
    const p = this.p;
    p.vx = p.vy = p.vz = 0; p.alpha = 1; p.r = p.g = p.b = 1;
    this.cfg.spawn(p);
    this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
    this.vel[i * 3] = p.vx; this.vel[i * 3 + 1] = p.vy; this.vel[i * 3 + 2] = p.vz;
    this.life[i] = this.maxLife[i] = p.life;
    this.size[i] = p.size;
    this.col[i * 3] = p.r; this.col[i * 3 + 1] = p.g; this.col[i * 3 + 2] = p.b;
    this.alpha[i] = p.alpha;
  }

  step(i, dt) {
    const cfg = this.cfg;
    if (cfg.gravity) this.vel[i * 3 + 1] += cfg.gravity * dt;
    if (cfg.flutter) {
      this.vel[i * 3] += (Math.random() - .5) * cfg.flutter * dt;
      this.vel[i * 3 + 1] += (Math.random() - .5) * cfg.flutter * dt;
      this.vel[i * 3 + 2] += (Math.random() - .5) * cfg.flutter * dt;
    }
    if (cfg.drag) {
      const d = Math.max(0, 1 - cfg.drag * dt);
      this.vel[i * 3] *= d; this.vel[i * 3 + 1] *= d; this.vel[i * 3 + 2] *= d;
    }
    this.pos[i * 3] += this.vel[i * 3] * dt;
    this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
    this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
  }

  update(dt) {
    const n = this.cfg.count;
    const over = this.cfg.over;
    for (let i = 0; i < n; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.respawn(i); continue; }
      this.step(i, dt);
      const k = 1 - this.life[i] / this.maxLife[i];
      // default envelope: quick fade in, ease out
      let a = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
      if (over) {
        const p = this.p;
        p.size = this.size[i]; p.alpha = a;
        p.r = this.col[i * 3]; p.g = this.col[i * 3 + 1]; p.b = this.col[i * 3 + 2];
        over(p, k);
        this.size[i] = p.size; a = p.alpha;
        this.col[i * 3] = p.r; this.col[i * 3 + 1] = p.g; this.col[i * 3 + 2] = p.b;
      }
      this.alpha[i] = a;
    }
    this.flush();
  }

  flush() {
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aColor.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
  }
}

// ---------- prefab emitters ----------

export function fire({ x = 0, y = 0, z = 0, radius = 1.2, count = 90, scale = 1, lift = 2.4 }) {
  return new Particles({
    count,
    drag: 0.4,
    spawn: (p) => {
      const a = Math.random() * Math.PI * 2, r = Math.random() * radius;
      p.x = x + Math.cos(a) * r; p.z = z + Math.sin(a) * r; p.y = y + Math.random() * .3;
      p.vy = lift * (0.6 + Math.random() * 0.8);
      p.vx = (Math.random() - .5) * .7; p.vz = (Math.random() - .5) * .7;
      p.life = 0.7 + Math.random() * 0.9;
      p.size = (0.55 + Math.random() * 0.8) * scale;
      p.r = 1; p.g = 0.55 + Math.random() * 0.3; p.b = 0.12;
    },
    over: (p, k) => {
      p.g = Math.max(0.08, p.g - k * 0.55);
      p.size *= (1 - k * 0.012);
    },
  });
}

export function smoke({ x = 0, y = 0, z = 0, radius = 1.4, count = 50, scale = 1, tint = 0.16, lift = 1.6, life = 4 }) {
  return new Particles({
    count,
    additive: false,
    drag: 0.12,
    flutter: 0.5,
    spawn: (p) => {
      const a = Math.random() * Math.PI * 2, r = Math.random() * radius;
      p.x = x + Math.cos(a) * r; p.z = z + Math.sin(a) * r; p.y = y;
      p.vy = lift * (0.5 + Math.random() * 0.8);
      p.life = life * (0.6 + Math.random() * 0.8);
      p.size = (1.6 + Math.random() * 2.2) * scale;
      p.r = p.g = p.b = tint * (0.7 + Math.random() * 0.6);
    },
    over: (p, k) => { p.size *= 1.004; p.alpha *= 0.5; },
  });
}

export function fireflies({ box = [10, 4, 10], cx = 0, cy = 2, cz = 0, count = 60, color = [1, 0.85, 0.4], size = 0.16 }) {
  return new Particles({
    count,
    flutter: 1.6,
    drag: 0.8,
    spawn: (p) => {
      p.x = cx + (Math.random() - .5) * box[0];
      p.y = cy + (Math.random() - .5) * box[1];
      p.z = cz + (Math.random() - .5) * box[2];
      p.life = 3 + Math.random() * 5;
      p.size = size * (0.7 + Math.random() * 0.8);
      p.r = color[0]; p.g = color[1]; p.b = color[2];
    },
    over: (p, k) => { p.alpha *= 0.55 + 0.45 * Math.sin(k * 19); },
  });
}

export function embers({ x = 0, y = 0, z = 0, radius = 3, count = 40, color = [1, .5, .15] }) {
  return new Particles({
    count,
    gravity: 0.45,
    flutter: 1.2,
    spawn: (p) => {
      const a = Math.random() * Math.PI * 2, r = Math.random() * radius;
      p.x = x + Math.cos(a) * r; p.z = z + Math.sin(a) * r; p.y = y + Math.random() * .4;
      p.vy = 2.2 + Math.random() * 2.4;
      p.life = 1.6 + Math.random() * 2.2;
      p.size = 0.07 + Math.random() * 0.1;
      p.r = color[0]; p.g = color[1]; p.b = color[2];
    },
  });
}
