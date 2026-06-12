# LIBERTY ASCENDING — The Torchbearer

*A browser-playable 3D game set inside the world of* **Liberty Ascending: A Revolutionary Fable**.

You are dropped barefoot into the burning TeslaGigafactory_X™ — the opening page of the fable —
where Liberty's torch waits on a pedestal: *"a salvaged LED strip jury-rigged to pulse at 1215 nm,
wavelength of awakening."* Take it up, wield it, and ask it to carry you through every chapter of
the story, from the Meme Wars of Old Versailles to the Unseen Garden of the epilogue.

![The Gigafactory](docs/screenshots/factory.png)

## Play it

**Easiest:** the hosted version on GitHub Pages — no install at all:
**https://martinmontero.github.io/Liberty-Assending/**

**Locally:** any static file server works — there is **no build step**. With
[Node.js](https://nodejs.org) installed (Windows/Mac/Linux):

```bash
git clone https://github.com/MartinMontero/Liberty-Assending && cd Liberty-Assending
node serve.mjs
```

then open `http://localhost:8000` in your browser. (Python users: `python -m http.server 8000`
works too. Everything is relative-path, fully offline, zero CDN calls.)

Click **TAKE UP THE TORCH**, then click the world to grab the pointer.

## How to play

| Input | Action |
| --- | --- |
| `WASD` / arrows | move · `SHIFT` run · `SPACE` jump |
| Mouse | look (pointer lock) |
| `E` | interact — take up the torch, touch what glimmers |
| `LMB` (hold) | **flare the torch** — 1215 nm reveals the Ring's hidden architecture, secret writing burned into every zone |
| `T` (or `M`) | **ask the torch to travel** — type free text like *"take me to Versailles"*, *"where the coffins are"*, *"the garden"* — or click a chapter card |
| `X` | dismiss narration · `N` mute ambience · `H` handbook |

On arrival anywhere, a title card and a narration panel describe **what surrounds you**, in the
fable's own words.

![Ask the torch](docs/screenshots/travel-panel.png)

## The seven chapters, replicated

| Zone | From the fable |
| --- | --- |
| **TeslaGigafactory_X™** (ch. 1–2) | Bent smokestacks weeping smoke, dead-meme billboards (*BUY STARS. COLONIZE MARS. THE MARKET WILL ADJUST.*), twitching robot arms over Cybertruck husks, server racks with Praxis's crowbar, the flickering "workers are obsolete" hologram, sirens, fires — and Robespierre, the Cerebral Reaper, tracking you with fiber-optic tendrils. |
| **Old Versailles** (ch. 3) | VR lawns glitching into block-game tiles under a Twitch-chat sky, the NFT champagne fountain under #LetThemEatCrypto, holographic peacocks fanning hashtag tails, the Macarons of Power™ pyramid with floating Marie-AI-nette, the Guillotine™ engagement stage, and the Hall of Mirrors of fractured reputations. |
| **The NFT Gulag** (ch. 4) | A neon bazaar of commodified revolt — Che's beret as a .gif, deepfaked protest clips, Liberty's speeches chopped and auctioned — the rarest lot (*Liberty's first cry of "No!"*) in its wireframe cage, the high-frequency trading pit, and the Crypto Kingpin under his orbiting crown of blockchain hashes. |
| **DAO of the Dead** (ch. 5) | A necropolis of glass coffins stacked like server racks, souls flickering inside, PTSD-NFT epitaphs, *DEATH IS A LIQUID ASSET* pulsing in blood-red code, griefbots spray-painting *You Are Not a Stock Photo*, and Maria Kwan's coffin — press your palm to it and set her ghost free. |
| **Quantum Carceri** (ch. 6) | A superposition prison under a probability-storm sky: phasing cell blocks, doors both open and closed, the drifting many-bodied Quantum Warden, and the Apology Algorithm floating in three tablets: *Admit Harm. Reject Absolution. Act Anyway.* |
| **The Eternal Beta** (ch. 7) | The self-rewriting code Monolith with its never-finishing progress bar, FOMO drones raining fake victories, billboards sneering *YOUR OUTRAGE IS SO LAST UPDATE*, and the analog resistance: the Library of Dead Tech, the Frankenstein Server on pirate radio, and the Memory Grenade. |
| **The Unseen Garden** (epilogue) | Years later. Saplings split the server-farm concrete, seed libraries replace databases, the plinth stands empty (*she needed no torch*) — and at the story circle you can plant the future yourself. |

![Quantum Carceri](docs/screenshots/carceri.png)
![Flaring the torch in the necropolis](docs/screenshots/necropolis-flare.png)
![The NFT Gulag](docs/screenshots/gulag.png)
![Old Versailles](docs/screenshots/versailles.png)
![The Unseen Garden](docs/screenshots/garden.png)

## The torch is the mechanic

- It **pulses at 1215 nm** — idle, it breathes; held, it lights the world around you.
- **Flaring it** (hold LMB) doesn't just burn brighter: it exposes the Ring's hidden
  architecture — debt-contract glyphs, guilt equations, ledger chains — different writing in
  every chapter, invisible until lit.
- It is also your **navigator**: press `T` and speak a destination in plain words. A keyword
  matcher maps phrases like "the quantum prison", "back to the burning factory", or "where the
  coffins are" onto chapters.
- A light objective chain follows the fable's arc: find the torch → wield it → travel the
  story → walk all seven chapters → plant the future. Finish it and you get the fable's last
  line: *"The revolution is growing at the speed of soil."*

## Tech

- **three.js r184**, vendored into `vendor/` — no CDN, no bundler, no build. Pure ES modules
  with an import map.
- Everything is procedural: all geometry is primitives, every texture is generated on a
  `<canvas>` at boot (billboards, glitch-grass, code-rain, star fields, NFT "art"…), audio is
  synthesized WebAudio ambience per zone. The repo contains **zero binary game assets**.
- Custom pointer-lock FPS controller (WASD/run/jump, AABB collision, walkable tops), CPU
  particle system on `THREE.Points` (fires, smoke, souls, fireflies, champagne), per-zone fog +
  sky domes + animated shader sky (the probability storm), UnrealBloom post-processing.
- Seven zones live in one scene, 2 km apart; only the active one is visible/updated.

```
index.html          UI shell, HUD, import map
src/main.js         boot, render loop, objectives, input
src/player.js       FPS controller + collision
src/torch.js        the torch: prop, view-model, flare, lights
src/travel.js       free-text "ask to go" parser + teleports
src/world.js        zone framework + shared builders
src/zones/*.js      the seven chapters
src/textures.js     canvas texture factory
src/particles.js    CPU particle system
src/audio.js        procedural WebAudio ambience/sfx
test/e2e.mjs        full Playwright playthrough (the game tests itself)
```

## Testing

A real end-to-end playthrough runs in headless Chromium — it walks to the torch, picks it up,
flares it, asks for every chapter by free-text phrase, hops the garden benches, plants the
future, and asserts the finale, screenshotting along the way:

```bash
npm install
npx playwright install chromium   # once
npm test
```

Expected output ends with `ALL CHECKS PASSED ✦`.

---

*"You can't kill an idea with fire. Only with a better idea." — Liberty*
