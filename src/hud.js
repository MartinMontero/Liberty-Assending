// DOM HUD: prompts, toasts, title cards, narration, finale, fade.
const $ = (id) => document.getElementById(id);

export class HUD {
  constructor() {
    this.el = {
      prompt: $('prompt'), toast: $('toast'),
      zname: $('zname'), zch: $('zch'), objective: $('objective'),
      titlecard: $('titlecard'), tch: $('tch'), tname: $('tname'),
      narration: $('narration'), nbody: $('nbody'), nquote: $('nquote'),
      fade: $('fade'), flarefx: $('flarefx'),
      finale: $('finale'), fbig: $('fbig'), fsmall: $('fsmall'),
    };
    this._toastTimer = null;
    this._titleTimer = null;
    this._narrTimer = null;
  }

  prompt(text) {
    const p = this.el.prompt;
    if (text) { p.textContent = text; p.style.opacity = 1; }
    else p.style.opacity = 0;
  }

  toast(text, seconds = 5) {
    const t = this.el.toast;
    clearTimeout(this._toastTimer);
    t.innerHTML = text;
    t.style.opacity = 1;
    this._toastTimer = setTimeout(() => { t.style.opacity = 0; }, seconds * 1000);
  }

  setZone(name, chapter) {
    this.el.zname.textContent = name;
    this.el.zch.textContent = chapter;
  }

  setObjective(text) {
    const v = text ? '✦ ' + text : '';
    if (this._objText === v) return; // called per-frame; skip redundant DOM writes
    this._objText = v;
    this.el.objective.textContent = v;
  }

  titleCard(name, chapter, seconds = 4.2) {
    clearTimeout(this._titleTimer);
    this.el.tch.textContent = chapter;
    this.el.tname.textContent = name;
    this.el.titlecard.style.opacity = 1;
    this._titleTimer = setTimeout(() => { this.el.titlecard.style.opacity = 0; }, seconds * 1000);
  }

  narrate(body, quote, seconds = 26) {
    clearTimeout(this._narrTimer);
    this.el.nbody.textContent = body;
    this.el.nquote.textContent = quote || '';
    this.el.narration.style.opacity = 1;
    if (seconds) this._narrTimer = setTimeout(() => this.dismissNarration(), seconds * 1000);
  }

  dismissNarration() {
    clearTimeout(this._narrTimer);
    this.el.narration.style.opacity = 0;
  }

  flare(amount) {
    this.el.flarefx.style.opacity = Math.min(1, amount) * 0.9;
  }

  fade(toBlack, seconds = 0.7) {
    this.el.fade.style.transition = `opacity ${seconds}s ease`;
    this.el.fade.style.opacity = toBlack ? 1 : 0;
    return new Promise(r => setTimeout(r, seconds * 1000));
  }

  finale(big, small, seconds = 9) {
    this.el.fbig.textContent = big;
    this.el.fsmall.textContent = small;
    this.el.finale.style.opacity = 1;
    setTimeout(() => { this.el.finale.style.opacity = 0; }, seconds * 1000);
  }
}
