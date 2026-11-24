// Manifesto, services, work, skills, experience, about, contact.
import { gsap, ScrollTrigger, SplitText, reducedMotion, finePointer, lenis } from './core.js';

// ---------------------------------------------------------------- manifesto: pinned, words light up
export function initManifesto() {
  const text = document.querySelector('.manifesto__text');
  // split plain text into words, keep each pill as one unit
  const units = [];
  [...text.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span'); s.className = 'word'; s.textContent = part; frag.appendChild(s); units.push(s);
      });
      node.replaceWith(frag);
    } else if (node.nodeType === 1) { node.classList.add('word'); units.push(node); }
  });
  if (reducedMotion) { gsap.set(units, { opacity: 1 }); return; }
  const photo = document.querySelector('.manifesto__photo');
  const zoomed = document.documentElement.classList.contains('has-zoom');
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.manifesto', start: 'top top', end: '+=170%', scrub: 0.6, pin: '.manifesto__pin' } });
  // straight out of the zoom the screen is plain pine: the photo opens upward and the text rises in,
  // then the words light up one by one as you read
  if (zoomed) {
    tl.fromTo(photo, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.18 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.5, ease: 'power3.out' }, 0)
      .from('.manifesto__kicker', { y: 24, opacity: 0, duration: 0.2, ease: 'power2.out' }, 0.04)
      .from(text, { y: 70, opacity: 0, duration: 0.3, ease: 'power3.out' }, 0.06);
  }
  tl.to(units, { opacity: 1, ease: 'none', stagger: 0.08, duration: 0.3 }, zoomed ? 0.3 : 0)
    .fromTo(text.querySelectorAll('.pill'), { scale: 0.9 }, { scale: 1, ease: 'back.out(3)', stagger: 0.25, duration: 0.3 }, zoomed ? 0.4 : 0.1);
  // a slow drift on the photo while you read
  tl.to(photo, { yPercent: -4, ease: 'none', duration: tl.duration() }, 0);
}

// ---------------------------------------------------------------- services: pinned horizontal track
export function initServices() {
  const title = new SplitText('.services__title', { type: 'chars', mask: 'chars' });
  if (!reducedMotion) {
    gsap.from(title.chars, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.03, scrollTrigger: { trigger: '.services', start: 'top 70%', once: true } });
  }
  if (window.innerWidth < 860 || reducedMotion) return;
  const track = document.querySelector('.services__track');
  const dist = () => track.scrollWidth - window.innerWidth;
  const move = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: '.services', start: 'top top', end: () => '+=' + dist() * 1.1, scrub: 0.6, pin: '.services__pin', invalidateOnRefresh: true,
      onUpdate: (self) => gsap.set('.services__progress span', { scaleX: self.progress }),
    },
  });
  // each panel's icon draws itself as the panel slides into view; the panel tilts in
  document.querySelectorAll('.panel').forEach((panel) => {
    const paths = panel.querySelectorAll('.panel__icon *');
    paths.forEach((p) => { const len = p.getTotalLength ? p.getTotalLength() : 100; gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
    gsap.timeline({ scrollTrigger: { trigger: panel, containerAnimation: move, start: 'left 85%', once: true } })
      .from(panel, { rotate: 4, yPercent: 8, duration: 1, ease: 'expo.out' })
      .to(paths, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.1 }, 0.1);
  });
}

// ---------------------------------------------------------------- work: stacked cards that wire themselves up
export function initWork() {
  const cards = [...document.querySelectorAll('.card')];
  cards.forEach((card, i) => { card.style.setProperty('--i', i); drawWires(card); });
  ScrollTrigger.addEventListener('refresh', () => cards.forEach(drawWires));
  if (reducedMotion) { cards.forEach((c) => c.querySelector('.flow').classList.add('is-live')); return; }
  const t = new SplitText('.work__title', { type: 'words,chars', mask: 'chars' });
  gsap.from(t.chars, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.025, scrollTrigger: { trigger: '.work', start: 'top 70%', once: true } });

  cards.forEach((card) => {
    const flow = card.querySelector('.flow');
    const title = new SplitText(card.querySelector('.card__title'), { type: 'lines', mask: 'lines' });
    const cols = [...flow.querySelectorAll('.flow__col')];
    // a card arriving: the number lifts in, the title rises, the diagram assembles column by column,
    // then the wires draw and start carrying current
    const tl = gsap.timeline({ paused: true })
      .from(card.querySelector('.card__num'), { yPercent: 40, opacity: 0, duration: 0.9, ease: 'expo.out' }, 0)
      .from(title.lines, { yPercent: 105, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.05)
      .from(card.querySelectorAll('.card__meta, .card__body, .card__tags li'), { y: 18, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.04 }, 0.2);
    cols.forEach((col, c) => tl.from(col.querySelectorAll('.node'), { scale: 0.6, opacity: 0, duration: 0.7, ease: 'back.out(2)', stagger: 0.08 }, 0.25 + c * 0.22));
    tl.add(() => flow.classList.add('is-live'), 0.55);
    ScrollTrigger.create({ trigger: card, start: 'top 75%', once: true, onEnter: () => tl.play() });
  });

  // the wires carry current only while their card is on screen
  cards.forEach((card) => {
    const pulses = () => card.querySelectorAll('.pulse');
    ScrollTrigger.create({
      trigger: card, start: 'top 85%', end: 'bottom top',
      onToggle: (self) => pulses().forEach((p) => p.__tw && (self.isActive ? p.__tw.play() : p.__tw.pause())),
    });
  });

  if (window.innerWidth < 860) return;
  // as the next card slides up, the current one sinks back into the stack: smaller, dimmer
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    const shade = document.createElement('span');
    shade.className = 'depth';
    card.appendChild(shade);
    gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 12%', scrub: true } })
      .to(card, { scale: 0.92, ease: 'none' }, 0)
      .to(shade, { opacity: 0.3, ease: 'none' }, 0);
  });
}

// wires from each node in a column to every node in the next column, as soft curves
function drawWires(card) {
  const flow = card.querySelector('.flow');
  const svg = flow.querySelector('.flow__wires');
  const fr = flow.getBoundingClientRect();
  if (!fr.width) return;
  const cols = [...flow.querySelectorAll('.flow__col')].map((c) => [...c.querySelectorAll('.node')]);
  const box = (n) => { const r = n.getBoundingClientRect(); return { l: r.left - fr.left, r: r.right - fr.left, y: r.top - fr.top + r.height / 2 }; };
  let html = '';
  for (let c = 0; c < cols.length - 1; c++) {
    cols[c].forEach((a) => cols[c + 1].forEach((b) => {
      const A = box(a), B = box(b);
      const mx = (A.r + B.l) / 2;
      const d = `M${A.r} ${A.y} C${mx} ${A.y}, ${mx} ${B.y}, ${B.l} ${B.y}`;
      html += `<path class="wire" pathLength="1" d="${d}"/><path class="pulse" d="${d}"/>`;
    }));
  }
  svg.setAttribute('viewBox', `0 0 ${fr.width} ${fr.height}`);
  svg.innerHTML = html;
  if (reducedMotion) { svg.querySelectorAll('.pulse').forEach((p) => p.remove()); return; }
  svg.querySelectorAll('.pulse').forEach((p, i) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = `14 ${len}`;
    p.__tw = gsap.fromTo(p, { strokeDashoffset: 14 }, { strokeDashoffset: -len, duration: 1.6 + (i % 3) * 0.3, ease: 'none', repeat: -1, delay: (i % 4) * 0.35 });
  });
}

// ---------------------------------------------------------------- skills: logo marquees driven by scroll velocity
export function initSkills() {
  if (!reducedMotion) {
    const t = new SplitText('.skills__title', { type: 'chars', mask: 'chars' });
    gsap.from(t.chars, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.03, scrollTrigger: { trigger: '.skills', start: 'top 70%', once: true } });
    // each row: the name rises out of its mask, the tools follow
    document.querySelectorAll('.kit__row').forEach((row) => {
      gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 88%', once: true } })
        .from(row.querySelector('.kit__word'), { yPercent: 110, duration: 1.1, ease: 'expo.out' }, 0)
        .from(row.querySelectorAll('.kit__no, .kit__count'), { opacity: 0, duration: 0.6 }, 0.15)
        .from(row.querySelectorAll('.kit__tools li'), { y: 14, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.025 }, 0.2);
    });
  }
  if (reducedMotion) return;
  const loops = [...document.querySelectorAll('.marquee')].map((m) => {
    const dir = +m.dataset.dir;
    const tw = gsap.fromTo(m.querySelector('.marquee__track'), { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 });
    m.addEventListener('pointerenter', () => gsap.to(tw, { timeScale: 0.2, duration: 0.5 }));
    m.addEventListener('pointerleave', () => gsap.to(tw, { timeScale: 1, duration: 0.5 }));
    return tw;
  });
  let boost = 0;
  // fast scrolling speeds the rows up and leans them against the direction of travel
  const skews = [...document.querySelectorAll('.marquee')].map((m) => gsap.quickTo(m, 'skewX', { duration: 0.5, ease: 'power3.out' }));
  lenis.on('scroll', (e) => {
    boost = Math.min(Math.abs(e.velocity) * 0.25, 6);
    const k = gsap.utils.clamp(-7, 7, e.velocity * -0.35);
    skews.forEach((to) => to(k));
  });
  gsap.ticker.add(() => {
    boost *= 0.92;
    loops.forEach((tw) => { if (tw.timeScale() >= 0.2) tw.timeScale(gsap.utils.interpolate(tw.timeScale(), 1 + boost, 0.15)); });
  });
}

// ---------------------------------------------------------------- experience: the sticky year rolls
export function initExperience() {
  if (!reducedMotion) {
    const t = new SplitText('.experience__title', { type: 'chars', mask: 'chars' });
    gsap.from(t.chars, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.03, scrollTrigger: { trigger: '.experience', start: 'top 70%', once: true } });
  }
  const num = document.querySelector('.career__num');
  let current = num.textContent;
  const setYear = (y) => {
    if (y === current) return;
    const down = +y < +current; current = y;
    if (reducedMotion) { num.textContent = y; return; }
    gsap.timeline()
      .to(num, { yPercent: down ? -100 : 100, duration: 0.28, ease: 'power2.in' })
      .add(() => { num.textContent = y; })
      .fromTo(num, { yPercent: down ? 100 : -100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' });
  };
  document.querySelectorAll('.role').forEach((r) => {
    ScrollTrigger.create({ trigger: r, start: 'top 55%', end: 'bottom 55%', onEnter: () => setYear(r.dataset.year), onEnterBack: () => setYear(r.dataset.year) });
    if (reducedMotion) return;
    gsap.timeline({ scrollTrigger: { trigger: r, start: 'top 78%', once: true } })
      .from(r.querySelectorAll('.role__when, .role__org, .role__title'), { y: 26, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07 })
      .from(r.querySelectorAll('.role__points li'), { x: -16, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07 }, 0.3);
  });
}

// ---------------------------------------------------------------- about: statement, counters, accordion
export function initAbout() {
  document.querySelectorAll('.principle__head').forEach((b) => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.principle__head').forEach((x) => x.setAttribute('aria-expanded', 'false'));
    b.setAttribute('aria-expanded', String(!open));
  }));
  if (reducedMotion) return;
  const t = new SplitText('.about__title', { type: 'lines', mask: 'lines' });
  gsap.from(t.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.about', start: 'top 65%', once: true } });
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v) + suf; }, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.from('.principle', { y: 24, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.principles', start: 'top 80%', once: true } });
}

// ---------------------------------------------------------------- contact: the closing line breathes like the hero
export function initContact() {
  const title = document.querySelector('.contact__title');
  const split = new SplitText(title, { type: 'chars', charsClass: 'char' });
  if (reducedMotion) return;
  gsap.from(split.chars, { yPercent: 100, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: '.contact', start: 'top 60%', once: true } });
  gsap.from('.contact__row > *', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.contact__row', start: 'top 90%', once: true } });
  if (!finePointer) return;
  const chars = split.chars;
  const cur = chars.map(() => ({ w: 800, s: 75 }));
  const ptr = { x: -9999, y: -9999 };
  /* auteur-allow: POINTER_NO_RAF -- stores coords only; the axes are written in the gsap ticker */
  title.addEventListener('pointermove', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; });
  title.addEventListener('pointerleave', () => { ptr.x = -9999; });
  gsap.ticker.add((_t, dms) => {
    const r = title.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const k = 1 - Math.exp(-(dms / 1000) * 7);
    chars.forEach((c, i) => {
      const b = c.getBoundingClientRect();
      const d = Math.abs(ptr.x - (b.left + b.width / 2));
      const t = Math.max(0, 1 - d / (window.innerWidth * 0.18));
      const e = t * t * (3 - 2 * t);
      cur[i].w += ((800 - 540 * e) - cur[i].w) * k; cur[i].s += ((75 + 25 * e) - cur[i].s) * k;
      c.style.fontVariationSettings = `"wght" ${cur[i].w.toFixed(0)}, "wdth" ${cur[i].s.toFixed(1)}`;
    });
  });
}

// ---------------------------------------------------------------- depth: the section underneath dims as the next sheet slides over
export function initDepth() {
  if (reducedMotion) return;
  const sheets = [...document.querySelectorAll('main > section')];
  sheets.forEach((sec, i) => {
    const next = sheets[i + 1];
    if (!next || sec.classList.contains('hero')) return; // the hero hands over with its own zoom
    const shade = document.createElement('span');
    shade.className = 'depth';
    shade.setAttribute('aria-hidden', 'true');
    sec.appendChild(shade);
    // dark sheets can take a deep shade; on the light ones it would turn the mist grey
    const depth = sec.classList.contains('sheet--pine') ? 0.5 : 0.18;
    gsap.fromTo(shade, { opacity: 0 }, { opacity: depth, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } });
  });
}
