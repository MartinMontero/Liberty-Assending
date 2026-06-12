// "Speak, and the torch will carry you" — free-text destination parsing + teleport.
const $ = (id) => document.getElementById(id);

export class TravelSystem {
  constructor(world, player, hud, audio, onArrive) {
    this.world = world;
    this.player = player;
    this.hud = hud;
    this.audio = audio;
    this.onArrive = onArrive;
    this.open = false;
    this.busy = false;
    this.visited = new Set();

    this.el = { travel: $('travel'), input: $('askinput'), go: $('askgo'), reply: $('askreply'), grid: $('destgrid') };

    // destination cards
    for (const z of world.zones) {
      const card = document.createElement('div');
      card.className = 'dest';
      card.dataset.zone = z.id;
      card.innerHTML = `<div class="dch">${z.chapter}</div><div class="dname">${z.name}</div><div class="ddesc">${z.short}</div>`;
      card.addEventListener('click', () => this.travelTo(z.id));
      this.el.grid.appendChild(card);
    }

    this.el.go.addEventListener('click', () => this.ask(this.el.input.value));
    this.el.input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') this.ask(this.el.input.value);
      if (e.key === 'Escape') this.close();
    });
  }

  openPanel() {
    if (this.busy) return;
    this.open = true;
    this.player.frozen = true;
    this.player.keys.clear();
    this.player.releaseLock();
    this.el.travel.classList.add('open');
    this.el.reply.textContent = '';
    this.el.input.value = '';
    // mark visited
    for (const card of this.el.grid.children) {
      card.classList.toggle('visited', this.visited.has(card.dataset.zone));
    }
    setTimeout(() => this.el.input.focus(), 60);
    this.audio.sfx('ui');
  }

  close() {
    this.open = false;
    this.el.travel.classList.remove('open');
    this.player.frozen = false;
    this.player.requestLock();
  }

  toggle() { this.open ? this.close() : this.openPanel(); }

  // Free-text matching: each zone scores by keyword hits; best wins.
  parse(text) {
    const q = (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    if (!q.trim()) return null;
    let best = null, bestScore = 0;
    for (const z of this.world.zones) {
      let score = 0;
      for (const kw of z.keywords) {
        if (q.includes(kw)) score += kw.length;     // longer keyword = stronger signal
      }
      if (q.includes(z.id)) score += 10;
      if (score > bestScore) { bestScore = score; best = z; }
    }
    return best;
  }

  ask(text) {
    const z = this.parse(text);
    if (!z) {
      this.audio.sfx('deny');
      const names = this.world.zones.map(zz => zz.name).join(' · ');
      this.el.reply.textContent = `The torch flickers, unsure. It knows the way to: ${names}`;
      return;
    }
    this.travelTo(z.id);
  }

  async travelTo(id, { instant = false } = {}) {
    const zone = this.world.byId(id);
    if (!zone || this.busy) return;
    this.busy = true;
    if (this.open) {
      this.el.reply.textContent = `The torch leans toward ${zone.name}…`;
    }
    this.audio.sfx('travel');
    if (!instant) await this.hud.fade(true, .65);
    if (this.open) this.close();

    // move the player & ambience
    this.world.setActive(id);
    const s = zone.worldSpawn();
    this.player.teleport(s.x, s.y, s.z, s.yaw);
    this.player.setColliders(zone.colliders);
    this.hud.setZone(zone.name, zone.chapter);
    this.visited.add(id);
    this.onArrive?.(zone, this.visited);

    if (!instant) {
      await new Promise(r => setTimeout(r, 120));
      await this.hud.fade(false, .9);
      this.hud.titleCard(zone.name, zone.chapter);
      this.hud.narrate(zone.narration, zone.quote);
    }
    this.busy = false;
  }
}
