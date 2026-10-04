// Motion helpers for the landing page. One scroll-driven rAF loop serves every
// parallax layer and pinned scene; reveals use IntersectionObserver. All of it
// respects prefers-reduced-motion.

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const ease = (k) => 1 - Math.pow(1 - k, 3);
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;

// Elements with [data-reveal] fade/slide in once when they enter the viewport.
export function reveal(root = document) {
  const els = [...root.querySelectorAll('[data-reveal]:not(.is-in)')];
  if (reduced || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}

// Runs fn once, the first time el is mostly in view.
export function onceVisible(el, fn, threshold = 0.35) {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, { threshold });
  io.observe(el);
}

const scrubbers = new Set();
let queued = false;
function frame() {
  queued = false;
  const vh = innerHeight;
  for (const s of scrubbers) {
    const r = s.el.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) continue;
    s.fn(s.pinned ? clamp(-r.top / Math.max(1, r.height - vh)) : clamp((vh - r.top) / (r.height + vh)), r);
  }
}
function request() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
addEventListener('scroll', request, { passive: true });
addEventListener('resize', request);

// fn(progress 0..1) as el scrolls through the viewport. pinned: progress of a
// tall section whose sticky child stays on screen (0 at top, 1 at release).
export function scrub(el, fn, { pinned = false } = {}) {
  scrubbers.add({ el, fn, pinned });
  request();
}
export const refreshScrub = request;

// Parallax: translate the layer as its section scrolls by (fraction of height).
export function parallax(layer, section, amount = 0.12) {
  if (reduced) return;
  scrub(section, (k) => { layer.style.transform = `translate3d(0, ${((k - 0.5) * amount * 100).toFixed(2)}%, 0)`; });
}

// Promise-based tween on rAF; resolves when done. Cancels the previous tween with the same key.
const running = new Map();
export function tween({ from, to, dur = 900, easing = easeInOut, key, onUpdate }) {
  if (key && running.has(key)) running.get(key).cancelled = true;
  const job = { cancelled: false };
  if (key) running.set(key, job);
  if (reduced) dur = Math.min(dur, 1);
  return new Promise((resolve) => {
    const t0 = performance.now();
    (function step(now) {
      if (job.cancelled) return resolve(false);
      const k = Math.min(1, (now - t0) / dur);
      onUpdate(from.map((f, i) => lerp(f, to[i], easing(k))), k);
      if (k < 1) requestAnimationFrame(step); else { if (key) running.delete(key); resolve(true); }
    })(performance.now());
  });
}

// Counts an element's text up to `to` when called.
export function countUp(el, to, { dur = 1400, suffix = '' } = {}) {
  if (reduced) { el.textContent = `${to}${suffix}`; return; }
  const t0 = performance.now();
  (function step(now) {
    const k = Math.min(1, (now - t0) / dur);
    el.textContent = `${Math.round(to * ease(k)).toLocaleString('en-US')}${suffix}`;
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}
