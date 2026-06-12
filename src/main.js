// Liberty Ascending — The Torchbearer. Boot, render loop, and game flow.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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
  const player = new Player(camera, renderer.domElement, TEST);
  const torch = new TorchSystem(scene, camera, world, hud, audio);

  // ---------- objectives ----------
  const visitedAll = () => travel.visited.size >= world.zones.length;
  let stage = 0; // 0 find torch, 1 flare it, 2 travel, 3 see all chapters, 4 plant, 5 done
  let planted = false;
  function objective() {
    switch (stage) {
      case 0: return 'Find Liberty’s torch in the burning factory';
      case 1: return 'Hold LMB — flare the torch and reveal the Ring’s hidden architecture';
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
    advance();
  });

  // ---------- start in the factory ----------
  const startZone = world.setActive('factory');
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
      const d = Math.hypot(player.feet.x - it.pos.x, player.feet.z - it.pos.z);
      if (d < it.radius && d < bestD) { best = it; bestD = d; }
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
    const it = currentInteract;
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
        hud.toast('An acorn goes into the broken ground. Somewhere beyond the haze, an algorithm fails to notice.', 6);
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
      case 'KeyT': case 'KeyM': travel.openPanel(); break;
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
    if (e.button === 0) {
      if (!player.locked && !TEST) { player.requestLock(); return; }
      torch.setFlaring(true);
    }
  });
  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) torch.setFlaring(false);
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
    world.update(dt, t, player.feet);
    torch.update(dt, t, player);
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
