// Shared core: plugins, smooth scroll, icons, cursor, magnetic, menu, clock, copy-to-clipboard.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import {
  createIcons, ArrowUpRight, ArrowUp, Factory, FlaskConical, Database, Bot, Layers, AudioWaveform, Sparkles, Server,
  ClipboardCheck, Gauge, BookOpen, FileCheck2, ShieldAlert, Zap, Activity, Mic, MessageSquareText, TrendingUp,
  CodeXml, Cloud, Plus, MapPin,
} from 'lucide';
import {
  siPython, siApachespark, siApachekafka, siDatabricks, siDelta, siApacheairflow, siPostgresql, siMongodb, siSnowflake, siPandas, siJupyter, siRedis, siFastapi, siDocker, siGithubactions, siGit, siReact, siVuedotjs, siTailwindcss, siStreamlit, siLangchain, siHuggingface, siAnthropic, siOllama, siGithub,
} from 'simple-icons';

// only the logos the page uses (the full set is ~3,000 icons)
const si = { siPython, siApachespark, siApachekafka, siDatabricks, siDelta, siApacheairflow, siPostgresql, siMongodb, siSnowflake, siPandas, siJupyter, siRedis, siFastapi, siDocker, siGithubactions, siGit, siReact, siVuedotjs, siTailwindcss, siStreamlit, siLangchain, siHuggingface, siAnthropic, siOllama, siGithub };

gsap.registerPlugin(ScrollTrigger, SplitText);
export { gsap, ScrollTrigger, SplitText };

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---- smooth scroll: Lenis on GSAP's ticker (one rAF owner) ----
export const lenis = new Lenis({ lerp: 0.085, smoothWheel: !reducedMotion });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(500, 33);

export function initAnchors(closeMenu) {
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id.length > 1 && document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    closeMenu?.();
    lenis.scrollTo(el, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
  }));
}

// ---- icons ----
export function initIcons() {
  createIcons({
    icons: { ArrowUpRight, ArrowUp, Factory, FlaskConical, Database, Bot, Layers, AudioWaveform, Sparkles, Server,
      ClipboardCheck, Gauge, BookOpen, FileCheck2, ShieldAlert, Zap, Activity, Mic, MessageSquareText, TrendingUp, CodeXml, Cloud, Plus, MapPin },
    attrs: { 'aria-hidden': 'true' },
  });
  const logo = (slug) => {
    const key = 'si' + slug.charAt(0).toUpperCase() + slug.slice(1);
    const icon = si[key];
    return icon ? { svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icon.path}"/></svg>`, title: icon.title } : null;
  };
  // marquee rows of tool logos (content duplicated once so the loop is seamless)
  document.querySelectorAll('[data-logos]').forEach((track) => {
    const chips = track.dataset.logos.split(',').map(logo).filter(Boolean)
      .map((l) => `<span class="logo-chip">${l.svg}${l.title.replace('Apache ', '')}</span>`).join('');
    track.innerHTML = chips + chips;
  });
  document.querySelectorAll('[data-si-inline]').forEach((el) => { const l = logo(el.dataset.siInline); if (l) el.outerHTML = l.svg; else el.remove(); });
}

// ---- cursor: an ember dot; grows on links; becomes a labelled peach disc where data-cursor is set ----
export function initCursor() {
  if (!finePointer) return;
  const el = document.createElement('div');
  el.className = 'cursor is-hidden';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="cursor__dot"></span><span class="cursor__label"></span>';
  document.body.appendChild(el);
  document.documentElement.classList.add('has-cursor');
  const label = el.querySelector('.cursor__label');
  const xTo = gsap.quickTo(el, 'x', { duration: reducedMotion ? 0 : 0.2, ease: 'power3.out' });
  const yTo = gsap.quickTo(el, 'y', { duration: reducedMotion ? 0 : 0.2, ease: 'power3.out' });
  /* auteur-allow: POINTER_NO_RAF -- quickTo tweens are applied by the gsap ticker (rAF), not per event */
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); el.classList.remove('is-hidden'); }, { passive: true });
  document.addEventListener('pointerleave', () => el.classList.add('is-hidden'));
  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button');
    el.classList.toggle('is-label', !!labelled);
    el.classList.toggle('is-link', !labelled && !!link);
    if (labelled) label.textContent = labelled.dataset.cursor;
  });
}

// ---- magnetic: leans toward the pointer, springs back ----
export function initMagnetic() {
  if (!finePointer || reducedMotion) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const k = parseFloat(el.dataset.magnetic) || 0.3;
    const inner = el.querySelector('[data-magnetic-inner]');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    /* auteur-allow: POINTER_NO_RAF -- quickTo tweens are applied by the gsap ticker (rAF), not per event */
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * k); yTo(dy * k);
      if (inner) gsap.to(inner, { x: dx * k * 0.4, y: dy * k * 0.4, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
      if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

// ---- menu: a pine circle opens from the button; links rise in ----
export function initMenu() {
  const btn = document.querySelector('.nav__menu');
  const menu = document.getElementById('menu');
  const label = btn.querySelector('.nav__menu-label');
  const links = menu.querySelectorAll('.menu__links a');
  let open = false;
  const tl = gsap.timeline({ paused: true })
    .set(menu, { visibility: 'visible' })
    .fromTo(menu, { clipPath: 'circle(0% at calc(100% - 4rem) 2.5rem)' }, { clipPath: 'circle(150% at calc(100% - 4rem) 2.5rem)', duration: reducedMotion ? 0.01 : 0.9, ease: 'power3.inOut' })
    .from(links, { yPercent: 110, duration: reducedMotion ? 0.01 : 0.8, ease: 'expo.out', stagger: 0.05 }, '-=0.45')
    .from('.menu__foot', { opacity: 0, duration: 0.4 }, '-=0.4');
  const set = (v) => {
    open = v;
    document.documentElement.classList.toggle('is-menu-open', v);
    btn.setAttribute('aria-expanded', String(v));
    menu.setAttribute('aria-hidden', String(!v));
    label.textContent = v ? 'Close' : 'Menu';
    if (v) { lenis.stop(); tl.timeScale(1).play(); } else { lenis.start(); tl.timeScale(1.6).reverse(); }
  };
  btn.addEventListener('click', () => set(!open));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) set(false); });
  return () => { if (open) set(false); };
}

// ---- nav theme: follows the sheet that is under the nav ----
export function initNavTheme() {
  const root = document.documentElement;
  document.querySelectorAll('.sheet--pine, .sheet--peach, .hero').forEach((sec) => {
    const theme = sec.classList.contains('sheet--pine') ? 'pine' : sec.classList.contains('sheet--peach') ? 'peach' : 'mist';
    ScrollTrigger.create({
      trigger: sec, start: 'top 44px', end: 'bottom 44px',
      onToggle: (self) => { if (self.isActive) root.dataset.nav = theme; else if (root.dataset.nav === theme) root.dataset.nav = 'mist'; },
    });
  });
}

// ---- clock + copy ----
export function initClock() {
  const long = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: false });
  const tick = () => {
    const t = long.format(new Date());
    document.querySelectorAll('[data-clock]').forEach((e) => { e.textContent = `${t} IST`; });
    document.querySelectorAll('[data-clock-short]').forEach((e) => { e.textContent = t; });
  };
  tick(); setInterval(tick, 15000);
}
let toastEl, toastTimer;
export function toast(msg) {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
  toastEl.textContent = msg; toastEl.classList.add('is-on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
}
export function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((a) => a.addEventListener('click', async (e) => {
    if (!navigator.clipboard) return;
    e.preventDefault();
    try { await navigator.clipboard.writeText(a.dataset.copy); toast('Email copied. Talk soon.'); } catch { location.href = a.href; }
  }));
}
