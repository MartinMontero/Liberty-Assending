// Zone infrastructure: each story location is a Zone (group + colliders +
// ambience + flare-reveals + per-frame updaters), laid out far apart in one scene.
import * as THREE from 'three';
import { textPanel, aoTexture } from './textures.js';

export class Zone {
  constructor(def) {
    Object.assign(this, def);            // id, name, chapter, fog, sky, spawn, narration, keywords…
    this.group = new THREE.Group();
    this.group.position.copy(def.origin);
    this.group.visible = false;
    this.colliders = [];                 // world-space {minX,maxX,minZ,maxZ,minY,maxY}
    this.reveals = [];                   // meshes shown while the torch flares
    this.updaters = [];                  // fn(dt, t, playerLocal)
    this.interactables = [];             // {pos (world), radius, prompt, onUse, once, used}
  }

  add(obj) { this.group.add(obj); return obj; }

  onUpdate(fn) { this.updaters.push(fn); }

  // local-space box -> world-space collider
  collide(minX, maxX, minZ, maxZ, maxY = 4, minY = 0) {
    const o = this.origin;
    this.colliders.push({
      minX: minX + o.x, maxX: maxX + o.x,
      minZ: minZ + o.z, maxZ: maxZ + o.z,
      minY, maxY,
    });
  }

  collideMesh(mesh, grow = 0) {
    mesh.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(mesh);
    this.colliders.push({
      minX: box.min.x - grow, maxX: box.max.x + grow,
      minZ: box.min.z - grow, maxZ: box.max.z + grow,
      minY: box.min.y, maxY: box.max.y,
    });
  }

  interact(x, y, z, radius, prompt, onUse, { once = false } = {}) {
    this.interactables.push({
      pos: new THREE.Vector3(x + this.origin.x, y + this.origin.y, z + this.origin.z),
      radius, prompt, onUse, once, used: false,
    });
  }

  worldSpawn() {
    return {
      x: this.origin.x + this.spawn.x,
      y: this.origin.y + (this.spawn.y ?? 0),
      z: this.origin.z + this.spawn.z,
      yaw: this.spawn.yaw ?? 0,
    };
  }
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.zones = [];
    this.active = null;
    this.flare = 0;
  }

  register(zone) {
    this.zones.push(zone);
    this.scene.add(zone.group);
    return zone;
  }

  byId(id) { return this.zones.find(z => z.id === id); }

  setActive(id) {
    const zone = this.byId(id);
    if (!zone) return null;
    for (const z of this.zones) z.group.visible = z === zone;
    this.active = zone;
    this.scene.fog = new THREE.FogExp2(zone.fog.color, zone.fog.density);
    this.scene.background = new THREE.Color(zone.fog.color);
    return zone;
  }

  setFlare(a) {
    this.flare = a;
    if (!this.active) return;
    for (const m of this.active.reveals) {
      m.material.opacity = a * (m.userData.maxOpacity ?? 1);
      m.visible = a > 0.02;
    }
  }

  update(dt, t, player) {
    if (!this.active) return;
    const local = _tmp.copy(player.feet).sub(this.active.origin);
    for (const fn of this.active.updaters) fn(dt, t, local, player);
  }
}

const _tmp = new THREE.Vector3();

// ---------- shared builders ----------

export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? .85, metalness: o.metal ?? .1, ...o.extra });

export const emat = (color, intensity = 1.6, o = {}) => new THREE.MeshStandardMaterial({
  color: 0x000000, emissive: color, emissiveIntensity: intensity,
  roughness: 1, metalness: 0, ...o,
});

export function box(zone, w, h, d, material, x, y, z, { collide = false, rotY = 0, shadow = false } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  zone.add(m);
  if (collide) zone.collideMesh(m);
  return m;
}

export function cyl(zone, rTop, rBot, h, material, x, y, z, { seg = 14, collide = false, shadow = false } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), material);
  m.position.set(x, y, z);
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  zone.add(m);
  if (collide) zone.collideMesh(m);
  return m;
}

export function ground(zone, size, texture, { color = 0xffffff, rough = .95, normal = null, normalScale = .6 } = {}) {
  const matOpts = { map: texture, color, roughness: rough, metalness: 0 };
  if (normal) {
    matOpts.normalMap = normal;
    matOpts.normalScale = new THREE.Vector2(normalScale, normalScale);
  }
  const g = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial(matOpts),
  );
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  zone.add(g);
  return g;
}

// Cheap grounded look: a soft dark contact-shadow blob under a prop.
let _aoTex = null;
export function aoBlob(zone, x, z, radius = 2, opacity = .55, y = .02) {
  if (!_aoTex) _aoTex = aoTexture();
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: _aoTex, transparent: true, opacity, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.renderOrder = 1;
  zone.add(m);
  return m;
}

// Sagging cable between two points (factory dressing).
export function cable(zone, ax, ay, az, bx, by, bz, sag = 1.2, r = .035, color = 0x141312) {
  const mid = new THREE.Vector3((ax + bx) / 2, Math.min(ay, by) - sag, (az + bz) / 2);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(ax, ay, az), mid, new THREE.Vector3(bx, by, bz),
  ]);
  const m = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 14, r, 5),
    new THREE.MeshStandardMaterial({ color, roughness: .65, metalness: .5 }),
  );
  zone.add(m);
  return m;
}

export function bounds(zone, half) {
  zone.collide(-half - 2, -half, -half - 2, half + 2, 30);
  zone.collide(half, half + 2, -half - 2, half + 2, 30);
  zone.collide(-half - 2, half + 2, -half - 2, -half, 30);
  zone.collide(-half - 2, half + 2, half, half + 2, 30);
}

export function sky(zone, material, radius = 380) {
  material.side = THREE.BackSide;
  material.fog = false;
  if ('toneMapped' in material) material.toneMapped = false;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 18), material);
  zone.add(dome);
  return dome;
}

// Bright sign / billboard plane (emissive -> blooms).
// cutout: for transparent-background textures (floating text) — alpha clips the plane.
export function glowPanel(zone, texture, w, h, x, y, z, { rotY = 0, intensity = 1.4, double = false, cutout = false } = {}) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      color: 0x000000, map: texture, emissive: 0xffffff, emissiveMap: texture,
      emissiveIntensity: intensity, roughness: 1,
      transparent: cutout, depthWrite: !cutout, alphaTest: cutout ? 0.02 : 0,
      side: double ? THREE.DoubleSide : THREE.FrontSide,
    }),
  );
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  zone.add(m);
  return m;
}

// Hidden truth revealed by flaring the torch at 1215 nm.
export function reveal(zone, { lines, w = 10, h = 4, x, y, z, rotY = 0, rotX = 0, color = '#b48cff', maxOpacity = 1, font = 'bold 60px "Courier New", monospace' }) {
  const tex = textPanel({ lines, w: 1024, h: Math.round(1024 * h / w), bg: null, fg: color, font, glow: color });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      color: 0x000000, map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 2.2,
      transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
    }),
  );
  m.position.set(x, y, z);
  m.rotation.set(rotX, rotY, 0);
  m.visible = false;
  m.userData.maxOpacity = maxOpacity;
  zone.add(m);
  zone.reveals.push(m);
  return m;
}

// Simple glow sprite (soul orbs, lamps).
export function glowSprite(zone, texture, color, scale, x, y, z, opacity = .8) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, color, transparent: true, opacity, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  s.scale.setScalar(scale);
  s.position.set(x, y, z);
  zone.add(s);
  return s;
}
