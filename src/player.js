// First-person controller: pointer-lock look, WASD, run, jump, gravity,
// AABB collision (walls push out, tops are walkable).
import * as THREE from 'three';

const EYE = 1.65;
const RADIUS = 0.38;
const WALK = 5.2;
const RUN = 9.5;
const JUMP = 7.2;
const GRAVITY = 21;

export class Player {
  constructor(camera, dom, testMode = false) {
    this.camera = camera;
    this.dom = dom;
    this.testMode = testMode;

    this.feet = new THREE.Vector3(0, 0, 6);
    this.vel = new THREE.Vector3();
    this.yaw = Math.PI;          // facing -z by default; zones set spawn yaw
    this.pitch = 0;
    this.grounded = true;
    this.keys = new Set();
    this.locked = false;
    this.frozen = false;        // true while modal UIs are open
    this.bobT = 0;
    this.colliders = [];

    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'Space' && !this.frozen) this.jumpQueued = true; // survives sub-frame taps
    });
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    document.addEventListener('mousemove', (e) => {
      if (!this.locked || this.frozen) return;
      this.yaw -= e.movementX * 0.0023;
      this.pitch -= e.movementY * 0.0023;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
    });
  }

  requestLock() {
    if (this.testMode) { this.locked = true; return; }
    if (document.pointerLockElement !== this.dom) {
      this.dom.requestPointerLock?.();
    }
  }

  releaseLock() {
    if (this.testMode) { this.locked = false; return; }
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  teleport(x, y, z, yaw = 0) {
    this.feet.set(x, y, z);
    this.vel.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = 0;
    this.syncCamera(0);
  }

  setColliders(list) { this.colliders = list || []; }

  update(dt) {
    if (this.frozen) { this.syncCamera(dt); return; }

    // input direction in yaw space
    let ix = 0, iz = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iz -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iz += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;
    const run = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = run ? RUN : WALK;

    const len = Math.hypot(ix, iz) || 1;
    ix /= len; iz /= len;
    // forward = (−sin yaw, −cos yaw), right = (cos yaw, −sin yaw)
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const wx = (ix * cos + iz * sin) * speed;
    const wz = (iz * cos - ix * sin) * speed;

    // smooth accelerate
    const accel = this.grounded ? 14 : 4;
    this.vel.x += (wx - this.vel.x) * Math.min(1, accel * dt);
    this.vel.z += (wz - this.vel.z) * Math.min(1, accel * dt);

    if ((this.keys.has('Space') || this.jumpQueued) && this.grounded) {
      this.vel.y = JUMP;
      this.grounded = false;
    }
    this.jumpQueued = false;
    this.vel.y -= GRAVITY * dt;

    const prevY = this.feet.y;
    this.feet.x += this.vel.x * dt;
    this.feet.z += this.vel.z * dt;
    this.feet.y += this.vel.y * dt;

    // ground plane
    let floor = 0;
    // collider tops & wall pushout
    for (const c of this.colliders) {
      const inX = this.feet.x > c.minX - RADIUS && this.feet.x < c.maxX + RADIUS;
      const inZ = this.feet.z > c.minZ - RADIUS && this.feet.z < c.maxZ + RADIUS;
      if (!inX || !inZ) continue;
      const top = c.maxY ?? 0;
      const bottom = c.minY ?? 0;
      // standing on top: previous feet at/above top, now sinking through
      if (top > floor && prevY >= top - 0.08 && this.feet.y <= top + 0.001 &&
          this.feet.x > c.minX && this.feet.x < c.maxX && this.feet.z > c.minZ && this.feet.z < c.maxZ) {
        floor = top;
        continue;
      }
      // wall pushout if body intersects the box vertically
      if (this.feet.y < top - 0.25 && this.feet.y + EYE > bottom) {
        const pushL = this.feet.x - (c.minX - RADIUS);
        const pushR = (c.maxX + RADIUS) - this.feet.x;
        const pushB = this.feet.z - (c.minZ - RADIUS);
        const pushF = (c.maxZ + RADIUS) - this.feet.z;
        const m = Math.min(pushL, pushR, pushB, pushF);
        if (m === pushL) this.feet.x = c.minX - RADIUS;
        else if (m === pushR) this.feet.x = c.maxX + RADIUS;
        else if (m === pushB) this.feet.z = c.minZ - RADIUS;
        else this.feet.z = c.maxZ + RADIUS;
      }
    }

    if (this.feet.y <= floor) {
      this.feet.y = floor;
      this.vel.y = 0;
      this.grounded = true;
    } else if (this.feet.y > floor + 0.02) {
      this.grounded = false;
    }

    // head bob
    const planar = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && planar > 0.5) this.bobT += dt * planar * 1.35;

    this.syncCamera(dt);
  }

  syncCamera() {
    const bobY = Math.sin(this.bobT * 2) * 0.038;
    const bobX = Math.cos(this.bobT) * 0.02;
    this.camera.position.set(
      this.feet.x + bobX * Math.cos(this.yaw),
      this.feet.y + EYE + bobY,
      this.feet.z - bobX * Math.sin(this.yaw),
    );
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotateY(this.yaw);
    this.camera.rotateX(this.pitch);
  }

  get speedPlanar() { return Math.hypot(this.vel.x, this.vel.z); }
}
