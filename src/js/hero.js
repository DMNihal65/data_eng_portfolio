// Loader, hero, and the hero → manifesto transition.
import { gsap, ScrollTrigger, reducedMotion, finePointer, lenis } from './core.js';

const MIN_LOAD = 2.4;

// variable-axis helper: one string for both axes
const axes = (w, s) => `"wght" ${w.toFixed(0)}, "wdth" ${s.toFixed(1)}`;

// ---------------------------------------------------------------- loader
// a 0-100 counter; N-I-H-A-L rise one by one and thicken from hairline to heavy as the count climbs;
// at 100 the panel lifts away with a curved edge that flattens as it goes
export function runLoader(tasks) {
  const root = document.querySelector('.loader');
  const panel = root.querySelector('.loader__panel');
  const num = root.querySelector('.loader__num');
  const chars = [...root.querySelectorAll('.loader__char')];
  const curve = root.querySelector('.loader__curve');
  let settled = 0;
  const allDone = Promise.allSettled(tasks.map((t) => Promise.resolve(t).finally(() => { settled += 1; })));

  if (reducedMotion) {
    return allDone.then(() => new Promise((resolve) => {
      num.textContent = '100';
      chars.forEach((c) => { c.style.opacity = 1; c.style.transform = 'none'; c.style.fontVariationSettings = axes(780, 75); });
      gsap.to(root, { opacity: 0, duration: 0.4, delay: 0.3, onComplete: () => { root.remove(); resolve(); } });
    }));
  }

  lenis.stop();
  const shown = chars.map(() => false);
  return new Promise((resolve) => {
    const s = { p: 0 };
    const t0 = performance.now();
    let last = -1;
    const tick = (_t, dms) => {
      const time = Math.min(1, (performance.now() - t0) / 1000 / MIN_LOAD);
      const target = Math.min(settled / tasks.length, gsap.parseEase('power2.inOut')(time));
      s.p += (target - s.p) * (1 - Math.exp(-(dms / 1000) * 7));
      if (target === 1 && s.p > 0.997) s.p = 1;
      const n = Math.round(s.p * 100);
      if (n !== last) { last = n; num.textContent = String(n); }
      chars.forEach((c, k) => {
        const at = 0.06 + k * 0.17;
        if (!shown[k] && s.p >= at) { shown[k] = true; gsap.to(c, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }); }
        const w = gsap.utils.clamp(0, 1, (s.p - at) / 0.35);
        c.style.fontVariationSettings = axes(200 + 580 * w, 100 - 25 * w);
      });
      if (s.p === 1) {
        gsap.ticker.remove(tick);
        allDone.then(() => finish(resolve));
      }
    };
    gsap.ticker.add(tick);
  });

  function finish(resolve) {
    gsap.timeline({ onComplete: () => { root.remove(); lenis.start(); resolve(); } })
      .to(chars, { yPercent: -18, duration: 0.6, ease: 'power2.in', stagger: 0.03 }, 0.15)
      .to(curve, { attr: { d: 'M0 0 H1440 V0 Q720 200 0 0 Z' }, duration: 0.5, ease: 'power2.in' }, 0.35)
      .to(panel, { yPercent: -122, duration: 1.15, ease: 'power4.inOut' }, 0.45)
      .to(curve, { attr: { d: 'M0 0 H1440 V0 Q720 0 0 0 Z' }, duration: 0.6, ease: 'power2.out' }, 1.0)
      .add(() => window.dispatchEvent(new Event('loader:reveal')), 0.75);
  }
}

// ---------------------------------------------------------------- hero
export function prepareHero() {
  if (reducedMotion) return;
  gsap.set('.hero__char', { yPercent: 105 });
  gsap.set('.hero__top > *, .hero__line, .hero__sub', { opacity: 0, y: 18 });
  gsap.set('.badge', { scale: 0, rotation: -120 });
}

export function enterHero() {
  const chars = [...document.querySelectorAll('.hero__char')];
  if (!reducedMotion) {
    gsap.timeline()
      .to(chars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07 })
      .to('.hero__top > *', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 0.4)
      .to('.hero__line, .hero__sub', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, 0.55)
      .to('.badge', { scale: 1, rotation: 0, duration: 1.3, ease: 'elastic.out(1, 0.55)' }, 0.8);
    gsap.to('.badge', { rotation: '+=360', duration: 16, ease: 'none', repeat: -1, delay: 2.1 });
  }
  initBreathingType(chars);
  initSwap();

}

// letters breathe toward the cursor: near it they open up (thinner and wider), far away they stay heavy
function initBreathingType(chars) {
  if (!finePointer || reducedMotion) return;
  const REST = { w: 740, s: 75 }, NEAR = { w: 240, s: 100 };
  const cur = chars.map(() => ({ w: REST.w, s: REST.s }));
  const ptr = { x: -9999, y: -9999 };
  /* auteur-allow: POINTER_NO_RAF -- stores coords only; the axes are written in the gsap ticker */
  window.addEventListener('pointermove', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', () => { ptr.x = -9999; });
  const hero = document.querySelector('.hero');
  gsap.ticker.add((_t, dms) => {
    const r = hero.getBoundingClientRect();
    if (r.bottom < 0) return;
    const k = 1 - Math.exp(-(dms / 1000) * 7);
    const reach = window.innerWidth * 0.22;
    chars.forEach((c, i) => {
      const b = c.getBoundingClientRect();
      const d = Math.hypot(ptr.x - (b.left + b.width / 2), ptr.y - (b.top + b.height / 2));
      const t = Math.max(0, 1 - d / reach);
      const e = t * t * (3 - 2 * t);
      const tw = REST.w + (NEAR.w - REST.w) * e, ts = REST.s + (NEAR.s - REST.s) * e;
      cur[i].w += (tw - cur[i].w) * k; cur[i].s += (ts - cur[i].s) * k;
      c.style.fontVariationSettings = axes(cur[i].w, cur[i].s);
    });
  });
}

// "I turn [messy data] into [decisions]": both pills roll to a new pair and resize smoothly
const PAIRS = [
  ['messy data', 'decisions'], ['sensor noise', 'live dashboards'], ['lab records', 'clean tables'],
  ['new regulations', 'clear actions'], ['questions', 'answers'],
];
function initSwap() {
  const pills = [...document.querySelectorAll('.swap')];
  const words = pills.map((p) => p.querySelector('.swap__word'));
  if (reducedMotion) return;
  let i = 0;
  const next = () => {
    i = (i + 1) % PAIRS.length;
    pills.forEach((pill, k) => {
      const w = words[k];
      const from = pill.getBoundingClientRect().width;
      gsap.timeline({ delay: k * 0.12 })
        .to(w, { yPercent: -120, duration: 0.42, ease: 'power3.in' })
        .add(() => {
          w.textContent = PAIRS[i][k];
          pill.style.width = 'auto';
          const to = pill.getBoundingClientRect().width;
          gsap.fromTo(pill, { width: from }, { width: to, duration: 0.6, ease: 'expo.out', clearProps: 'width' });
        })
        .fromTo(w, { yPercent: 120 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' });
    });
  };
  setInterval(next, 2800);
}

// scroll transition: the hero pins, letters part, and the camera flies through the "I" into pine
export function initZoomThrough() {
  const chars = [...document.querySelectorAll('.hero__char')];
  if (reducedMotion) return;
  const iChar = document.querySelector('.hero__char--i');
  const others = chars.filter((c) => c !== iChar);
  const spread = [-1.0, 0, 0.6, 1.1, 1.6];
  const root = document.documentElement;
  // the manifesto waits under the pinned hero (see .has-zoom in the CSS), so the pine lands straight on it
  root.classList.add('has-zoom');
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero', start: 'top top', end: '+=130%', scrub: 0.7, pin: true, anticipatePin: 1,
      // the nav turns light as soon as the pine covers the screen
      onUpdate: (self) => { root.dataset.nav = self.progress > 0.82 ? 'pine' : 'mist'; },
    },
  });
  tl.to('.hero__top, .hero__bottom', { opacity: 0, y: -30, duration: 0.25, ease: 'power2.in' }, 0)
    .to(others, { x: (k) => window.innerWidth * spread[chars.indexOf(others[k])], opacity: 0, duration: 0.6, ease: 'power2.in' }, 0.05)
    .to(iChar, { scale: 70, transformOrigin: '50% 55%', duration: 1, ease: 'power3.in' }, 0.1)
    .to('.hero__zoom', { opacity: 1, duration: 0.15, ease: 'none' }, 0.9)
    // pine on pine: the hero steps aside at the very end and the manifesto underneath takes over
    .set('.hero', { autoAlpha: 0 }, 1.1);
  ScrollTrigger.addEventListener('refreshInit', () => gsap.set(others, { x: 0 }));
}
