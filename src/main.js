import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/instrument-sans/standard.css';
import './styles/main.css';

import { ScrollTrigger, initAnchors, initIcons, initCursor, initMagnetic, initMenu, initClock, initCopy, initNavTheme } from './js/core.js';
import { runLoader, prepareHero, enterHero, initZoomThrough } from './js/hero.js';
import { initManifesto, initServices, initWork, initSkills, initExperience, initAbout, initContact, initDepth } from './js/sections.js';

window.scrollTo(0, 0);
initIcons();
initCursor();
initMagnetic();
initClock();
initCopy();
initAnchors(initMenu());
prepareHero();

const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })));
const tasks = [document.fonts.ready, loaded];

// sections are built once fonts are in, so every split and measurement uses the real glyphs
document.fonts.ready.then(() => {
  initZoomThrough(); // pins must be created in page order
  initManifesto();
  initServices();
  initWork();
  initSkills();
  initExperience();
  initAbout();
  initContact();
  initDepth();
  initNavTheme();
  ScrollTrigger.refresh();
});

window.addEventListener('loader:reveal', () => enterHero(), { once: true });
runLoader(tasks).then(() => ScrollTrigger.refresh());
