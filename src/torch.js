// Liberty's torch — a salvaged LED strip jury-rigged to pulse at 1215 nm.
// World prop on a pedestal; once taken, a wielded view-model with flame,
// light, and a flare that reveals the Ring's hidden architecture.
import * as THREE from 'three';
import { Particles } from './particles.js';
import { glowTexture } from './textures.js';
import { emat, mat } from './world.js';

function buildTorchMesh() {
  const g = new THREE.Group();

  // handle: wrapped grip
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.034, 0.46, 10),
    mat(0x4a3526, { rough: .9 }),
  );
  handle.position.y = 0.23;
  g.add(handle);
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.0315, 0.006, 6, 14),
      mat(0x2c1f16, { rough: 1 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08 + i * 0.085;
    g.add(ring);
  }

  // collar
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.036, 0.07, 10),
    mat(0x8a8d94, { rough: .35, metal: .9 }),
  );
  collar.position.y = 0.49;
  g.add(collar);

  // LED strip: glowing helix coiled around the head
  const helixPts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const a = t * Math.PI * 7;
    const r = 0.052 + t * 0.022;
    helixPts.push(new THREE.Vector3(Math.cos(a) * r, 0.52 + t * 0.17, Math.sin(a) * r));
  }
  const ledMat = emat(0xffb347, 2.6);
  const led = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts), 64, 0.0085, 6),
    ledMat,
  );
  g.add(led);

  // 1215 nm violet core
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.03, 0.2, 8),
    emat(0x9a6cff, 2.2),
  );
  core.position.y = 0.6;
  g.add(core);

  // inner glow sprites
  const glowTex = glowTexture('rgba(255,190,110,1)');
  const glow1 = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xffc070, transparent: true, opacity: .85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow1.scale.setScalar(0.55);
  glow1.position.y = 0.68;
  g.add(glow1);
  const glow2 = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(170,120,255,1)'), color: 0xa07cff, transparent: true, opacity: .5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow2.scale.setScalar(0.85);
  glow2.position.y = 0.66;
  g.add(glow2);

  return { group: g, ledMat, coreMat: core.material, glow1, glow2 };
}

export class TorchSystem {
  constructor(scene, camera, world, hud, audio) {
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.hud = hud;
    this.audio = audio;

    this.held = false;
    this.flaring = false;
    this.flareAmt = 0;          // 0..1 smoothed
    this.t = 0;

    // ---- world prop (on pedestal in the factory) ----
    this.prop = buildTorchMesh();
    this.prop.group.position.set(0, 1.06, 14);   // pedestal top — factory local == world (origin 0)
    this.prop.group.rotation.z = 0.06;
    scene.add(this.prop.group);
    this.propGlowLight = new THREE.PointLight(0xffb060, 2.2, 9, 2);
    this.propGlowLight.position.set(0, 1.9, 14);
    scene.add(this.propGlowLight);

    // ---- view model (hidden until pickup) ----
    this.view = buildTorchMesh();
    this.view.group.visible = false;
    // close to the lens: scale way down so it reads as a hand-held torch
    this.view.group.scale.setScalar(0.28);
    this.view.glow1.scale.setScalar(0.26);
    this.view.glow1.material.opacity = 0.6;
    this.view.glow2.scale.setScalar(0.4);
    this.view.glow2.material.opacity = 0.26;
    this.basePos = new THREE.Vector3(0.27, -0.31, -0.52);
    this.view.group.position.copy(this.basePos);
    this.view.group.rotation.set(0.12, 0, -0.1);
    camera.add(this.view.group);

    // carried light (world-space so it lights everything around the player)
    this.light = new THREE.PointLight(0xffb060, 0, 20, 1.9);
    scene.add(this.light);
    this.violet = new THREE.PointLight(0x8a5cff, 0, 11, 2.1);
    scene.add(this.violet);

    // flame particles parented to the view torch head
    this.flame = new Particles({
      count: 42,
      drag: .6,
      spawn: (p) => {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 0.04;
        p.x = Math.cos(a) * r; p.z = Math.sin(a) * r; p.y = 0.6 + Math.random() * .04;
        p.vy = .5 + Math.random() * .45;
        p.vx = (Math.random() - .5) * .1; p.vz = (Math.random() - .5) * .1;
        p.life = .3 + Math.random() * .35;
        p.size = .035 + Math.random() * .045;
        p.r = 1; p.g = .62 + Math.random() * .25; p.b = .15;
      },
      over: (p, k) => { p.g = Math.max(.1, p.g - k * .5); p.size *= .995; },
    });
    this.flame.points.visible = false;
    this.view.group.add(this.flame.points);

    this._wv = new THREE.Vector3();
  }

  // distance from player to the torch prop (for the pickup prompt)
  propDistance(playerFeet) {
    if (this.held) return Infinity;
    return Math.hypot(playerFeet.x - 0, playerFeet.z - 14);
  }

  pickUp() {
    if (this.held) return;
    this.held = true;
    this.scene.remove(this.prop.group);
    this.scene.remove(this.propGlowLight);
    this.view.group.visible = true;
    this.flame.points.visible = true;
    this.light.intensity = 2.4;
    this.violet.intensity = 1.1;
    this.audio.sfx('pickup');
    this.hud.toast('“She carried no weapon but a torch — wavelength of awakening.”<br><span style="font-size:13px;letter-spacing:.18em;color:#e8b04b">THE TORCH IS YOURS · HOLD LMB TO FLARE IT</span>', 7);
  }

  setFlaring(on) {
    if (!this.held) return;
    if (on && !this.flaring) this.audio.sfx('flare');
    this.flaring = on;
  }

  update(dt, t, player) {
    this.t = t;

    // prop idle: pulse + bob
    if (!this.held) {
      const pulse = 0.75 + 0.25 * Math.sin(t * 4.4) + 0.08 * Math.sin(t * 23);
      this.prop.ledMat.emissiveIntensity = 1.6 + pulse * 1.6;
      this.propGlowLight.intensity = 1.6 + pulse * 1.3;
      this.prop.group.rotation.y = t * 0.5;
      return;
    }

    // flare envelope
    const target = this.flaring ? 1 : 0;
    this.flareAmt += (target - this.flareAmt) * Math.min(1, dt * 5.5);
    const f = this.flareAmt;
    this.world.setFlare(f);
    this.hud.flare(f);

    // pulsing LED at "1215 nm"
    const pulse = 0.75 + 0.25 * Math.sin(t * 4.4) + 0.08 * Math.sin(t * 23);
    this.view.ledMat.emissiveIntensity = 1.4 + pulse * 1.1 + f * 2.6;
    this.view.coreMat.emissiveIntensity = 1.3 + f * 3;
    this.view.glow1.material.opacity = .55 + .15 * pulse + f * .25;
    this.view.glow1.scale.setScalar(.24 + .04 * pulse + f * .2);
    this.view.glow2.scale.setScalar(.38 + f * .4);

    // sway with movement
    const sway = Math.min(1, player.speedPlanar / 9);
    this.view.group.position.set(
      this.basePos.x + Math.cos(player.bobT) * 0.014 * sway,
      this.basePos.y + Math.sin(player.bobT * 2) * 0.018 * sway + f * 0.05,
      this.basePos.z - f * 0.07,
    );
    this.view.group.rotation.z = -0.1 + Math.sin(player.bobT) * 0.02 * sway - f * .14;
    this.view.group.rotation.x = 0.12 + f * 0.1;

    // lights follow torch head in world space
    this.view.glow1.getWorldPosition(this._wv);
    this.light.position.copy(this._wv);
    this.violet.position.copy(this._wv);
    this.light.intensity = 2.4 + pulse * .9 + f * 7.5;
    this.light.distance = 20 + f * 16;
    this.violet.intensity = 1.0 + f * 4.2;
    this.flame.update(dt);
  }
}
