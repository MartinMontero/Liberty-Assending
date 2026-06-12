// Liberty Ascending — The Torchbearer. Boot, render loop, and game flow.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Film-look color grade: per-zone tint/saturation/contrast + vignette + grain.
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uTint: { value: null },     // THREE.Vector3
    uSat: { value: 1.05 },
    uCon: { value: 1.06 },
    uBright: { value: 1.0 },
    uVig: { value: .28 },
    uGrain: { value: .04 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uSat, uCon, uBright, uVig, uGrain;
    uniform vec3 uTint;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c *= uTint * uBright;
      float l = dot(c, vec3(.299, .587, .114));
      c = mix(vec3(l), c, uSat);                       // saturation
      c = (c - .5) * uCon + .5;                        // contrast
      vec2 q = vUv - .5;
      c *= 1.0 - uVig * smoothstep(.12, .85, dot(q, q) * 2.6);  // vignette
      c += (hash(vUv * 977.0 + fract(uTime) * 61.0) - .5) * uGrain; // grain
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

// Per-zone cinematography: tint / sat / contrast / vignette / grain / exposure.
const GRADES = {
  factory:    { tint: [1.06, .96, .86], sat: 1.06, con: 1.1,  vig: .34, grain: .045, exp: 1.18 },
  versailles: { tint: [.99, 1.0, 1.05], sat: 1.16, con: 1.05, vig: .18, grain: .022, exp: 1.06 },
  gulag:      { tint: [1.02, .93, 1.1], sat: 1.22, con: 1.12, vig: .34, grain: .04,  exp: 1.16 },
  necropolis: { tint: [.9, .98, 1.14],  sat: .96,  con: 1.12, vig: .38, grain: .05,  exp: 1.12 },
  carceri:    { tint: [1.03, .94, 1.12], sat: 1.18, con: 1.14, vig: .32, grain: .042, exp: 1.1 },
  beta:       { tint: [.92, 1.06, 1.0], sat: 1.1,  con: 1.12, vig: .32, grain: .05,  exp: 1.1 },
  garden:     { tint: [1.07, 1.0, .9],  sat: 1.14, con: 1.04, vig: .16, grain: .018, exp: 1.06 },
};

import { World } from './world.js';
import { Player } from './player.js';
import { TorchSystem } from './torch.js';
import { TravelSystem } from './travel.js';
import { HUD } from './hud.js';
import { AudioEngine, AMBIENCE } from './audio.js';

import { buildFactory } from './zones/factory.js';
import { buildVersailles } from './zones/versailles.js';
import { buildGulag } from './zones/gulag.js';
import { buildNecropolis } from './zones/necropolis.js';
import { buildCarceri } from './zones/carceri.js';
import { buildBeta } from './zones/beta.js';
import { buildGarden } from './zones/garden.js';

const TEST = new URLSearchParams(location.search).has('test');
const $ = (id) => document.getElementById(id);

try {
  boot();
} catch (err) {
  fatal(err);
}

function fatal(err) {
  console.error(err);
  const el = $('err');
  el.style.display = 'flex';
  el.textContent = 'The world failed to ignite: ' + (err?.message || err);
}

function boot() {
  // ---------- renderer ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('app').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.08, 900);
  scene.add(camera);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.55, 0.82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  grade.uniforms.uTint.value = new THREE.Vector3(1, 1, 1);
  composer.addPass(grade);

  function applyGrade(zoneId) {
    const g = GRADES[zoneId];
    if (!g) return;
    grade.uniforms.uTint.value.set(...g.tint);
    grade.uniforms.uSat.value = g.sat;
    grade.uniforms.uCon.value = g.con;
    grade.uniforms.uVig.value = g.vig;
    grade.uniforms.uGrain.value = g.grain;
    renderer.toneMappingExposure = g.exp;
  }

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  // ---------- world & systems ----------
  const world = new World(scene);
  buildFactory(world);
  buildVersailles(world);
  buildGulag(world);
  buildNecropolis(world);
  buildCarceri(world);
  buildBeta(world);
  buildGarden(world);

  const hud = new HUD();
  const audio = new AudioEngine();

  // ---- the Fellowship's ledger: items, liberated chapters, zone services ----
  world.inventory = new Set();
  world.grant = (id, label) => {
    if (world.inventory.has(id)) return;
    world.inventory.add(id);
    hud.setInventory([...world.inventory].map(k => INV_LABELS[k] || k));
    hud.toast(`✦ ACQUIRED — ${label}`, 5);
    audio.sfx('lore');
  };
  world.has = (id) => world.inventory.has(id);
  world.liberated = new Set();
  world.liberate = (id, label) => {
    if (world.liberated.has(id)) return;
    world.liberated.add(id);
    hud.toast(`⚑ ${label} — CHAPTER LIBERATED &nbsp;(${world.liberated.size}/6)`, 7);
    audio.sfx('plant');
  };
  world.notify = (msg, sec = 5) => hud.toast(msg, sec);
  world.sfx = (k) => audio.sfx(k);
  const INV_LABELS = {
    shard: 'NEURAL LACE SHARD',
    countermeme: '“I’M A THREAT? GOOD.”',
    marseillaise: 'MARSEILLAISE, FIRST DRAFT',
    lullaby: 'MARIA’S LULLABY',
    floppy: 'FLOPPY OF LABOR HISTORY',
    cassette: 'CASSETTE — HER VOICE',
    dial: 'ROTARY DIAL',
  };
  const player = new Player(camera, renderer.domElement, TEST);
  const torch = new TorchSystem(scene, camera, world, hud, audio);
  world.torchRef = torch;

  // ---------- objectives ----------
  const visitedAll = () => travel.visited.size >= world.zones.length;
  let stage = 0; // 0 find torch, 1 flare it, 2 travel, 3 see all chapters, 4 plant, 5 done
  let planted = false;
  function objective() {
    switch (stage) {
      case 0: return 'Find Liberty’s torch in the burning factory';
      case 1: return 'Hold F — flare the torch and reveal the Ring’s hidden architecture';
      case 2: return 'Press T — ask the torch to carry you into the story';
      case 3: return `Walk every chapter of the fable (${travel.visited.size}/${world.zones.length})`;
      case 4: return 'Find the story circle in the Garden — plant the future (E)';
      default: return 'Wander. Remember. Plant again. (T travels anywhere)';
    }
  }
  function advance() {
    if (stage === 0 && torch.held) stage = 1;
    else if (stage === 1 && torch.flareAmt > .45) stage = 2;
    else if (stage === 2 && travel.visited.size >= 2) stage = 3;
    if (stage === 3 && visitedAll()) stage = 4;
    if (stage === 4 && planted) {
      stage = 5;
      hud.finale('“The revolution is growing at the speed of soil.”', '— the end, or the long beginning —', 10);
      audio.sfx('finale');
    }
    hud.setObjective(objective());
  }

  const travel = new TravelSystem(world, player, hud, audio, (zone) => {
    audio.setZoneAmbience(AMBIENCE[zone.id]);
    applyGrade(zone.id);
    advance();
  });

  // ---------- start in the factory ----------
  const startZone = world.setActive('factory');
  applyGrade('factory');
  const s = startZone.worldSpawn();
  player.teleport(s.x, s.y, s.z, s.yaw);
  player.setColliders(startZone.colliders);
  hud.setZone(startZone.name, startZone.chapter);
  hud.setObjective(objective());

  // ---------- interaction (E) ----------
  const ray = new THREE.Raycaster();
  let currentInteract = null;

  function nearestInteractable() {
    const z = world.active;
    if (!z) return null;
    let best = null, bestD = 1e9;
    // torch prop first
    if (!torch.held && world.active.id === 'factory') {
      const d = torch.propDistance(player.feet);
      if (d < 3.2) return { prompt: 'E — take up the torch', torchProp: true };
    }
    for (const it of z.interactables) {
      if (it.once && it.used) continue;
      if (it.when && !it.when()) continue;
      const d = Math.hypot(player.feet.x - it.pos.x, player.feet.z - it.pos.z);
      if (d < it.radius && d < bestD) { best = it; bestD = d; }
    }
    if (best && typeof best.prompt === 'function') {
      return { ...best, prompt: best.prompt(), onUse: best.onUse, _src: best };
    }
    return best;
  }

  function useInteractable() {
    if (!currentInteract) return;
    if (currentInteract.torchProp) {
      torch.pickUp();
      advance();
      return;
    }
    const it = currentInteract._src || currentInteract;
    if (it.once) it.used = true;
    const text = it.onUse();
    if (it === plantSpot) return; // plant handles its own feedback
    if (text) {
      hud.narrate(text, '', 14);
      audio.sfx('lore');
    }
  }

  // garden planting hook
  let plantSpot = null;
  {
    const garden = world.byId('garden');
    plantSpot = {
      pos: new THREE.Vector3(garden.origin.x + 0, 0, garden.origin.z + 6),
      radius: 3.4, prompt: 'E — plant the future', once: false,
      onUse: () => {
        garden.plantSapling();
        planted = true;
        audio.sfx('plant');
        if (world.liberated.size >= 6) {
          garden.trueEnding?.();
          hud.finale('“The revolution is growing at the speed of soil.”', 'ALL CHAPTERS LIBERATED — THE LONG BEGINNING', 12);
          audio.sfx('finale');
        } else {
          hud.toast(`An acorn goes into the broken ground. ${6 - world.liberated.size} chapter${world.liberated.size === 5 ? '' : 's'} of the Ring still stand — press T, the torch knows the way.`, 7);
        }
        advance();
        return null;
      },
    };
    garden.interactables.push(plantSpot);
  }

  // ---------- input ----------
  document.addEventListener('keydown', (e) => {
    if (travel.open || helpOpen) {
      if (e.code === 'Escape' || e.code === 'KeyT') { travel.open ? travel.close() : toggleHelp(false); }
      if (helpOpen && e.code === 'KeyH') toggleHelp(false);
      return;
    }
    switch (e.code) {
      case 'KeyE': useInteractable(); break;
      case 'KeyT': travel.openPanel(); break;
      case 'KeyF': torch.setFlaring(true); break;
      case 'KeyX': hud.dismissNarration(); break;
      case 'KeyH': toggleHelp(true); break;
      case 'KeyN': {
        const muted = audio.toggleMute();
        hud.toast(muted ? 'ambience muted' : 'ambience on', 1.6);
        break;
      }
    }
  });
  document.addEventListener('mousedown', (e) => {
    if (!started || travel.open || helpOpen) return;
    if (e.button === 0 && !player.locked && !TEST) player.requestLock();
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyF') torch.setFlaring(false);
  });

  let helpOpen = false;
  function toggleHelp(open) {
    helpOpen = open;
    $('help').classList.toggle('open', open);
    player.frozen = open || travel.open;
    if (open) player.releaseLock(); else if (!travel.open) player.requestLock();
  }
  $('help').addEventListener('click', () => toggleHelp(false));

  // ---------- intro ----------
  let started = false;
  $('iload').textContent = 'THE WORLD IS LIT.';
  function start() {
    if (started) return;
    started = true;
    audio.init();
    audio.setZoneAmbience(AMBIENCE.factory);
    $('intro').style.opacity = 0;
    setTimeout(() => { $('intro').style.display = 'none'; }, 1000);
    hud.fade(false, 1.4);
    hud.titleCard(startZone.name, startZone.chapter, 5);
    hud.narrate(startZone.narration, startZone.quote, 30);
    player.requestLock();
  }
  $('begin').addEventListener('click', start);
  if (TEST) setTimeout(start, 50);

  // ---------- loop ----------
  const clock = new THREE.Clock();
  let firstFrame = true;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    player.update(dt);
    world.update(dt, t, player);
    torch.update(dt, t, player);
    grade.uniforms.uTime.value = t;
    const az = world.active;
    hud.setMeter(az?.meter);
    hud.setQuest(az?.quest ? az.quest() : '');
    if (az?.fxFlash) { az.fxFlash = false; hud.pulse(); }
    advance();

    // interaction prompt
    const ni = started && !travel.open && !helpOpen ? nearestInteractable() : null;
    currentInteract = ni;
    hud.prompt(ni ? ni.prompt : '');

    composer.render();

    if (firstFrame) {
      firstFrame = false;
      window.__gameReady = true;
    }
  });

  // ---------- automation API (testing / accessibility) ----------
  window.game = {
    get state() {
      return {
        zone: world.active?.id,
        torchHeld: torch.held,
        flare: torch.flareAmt,
        visited: [...travel.visited],
        stage,
        planted,
        traveling: travel.busy,
        pos: { x: player.feet.x, y: player.feet.y, z: player.feet.z },
        prompt: currentInteract?.prompt || '',
        inventory: [...world.inventory],
        liberatedChapters: [...world.liberated],
        quest: world.active?.quest ? world.active.quest() : '',
      };
    },
    look: (yaw, pitch = 0) => { player.yaw = yaw; player.pitch = pitch; },
    travelTo: (id) => travel.travelTo(id),
    ask: (text) => { travel.openPanel(); travel.ask(text); },
    openTravel: () => travel.openPanel(),
    use: () => useInteractable(),
    flare: (on) => torch.setFlaring(on),
    start,
  };
}
