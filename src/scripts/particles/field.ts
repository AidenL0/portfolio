import {
  alphaFor,
  backingScale,
  frameDelta,
  seed,
  stepBody,
  stepHome,
  type Attractor,
  type Particle,
  type Point,
} from './physics';

const TOUCH_PULSE_MS = 600;

/**
 * Runs the background particle field on `canvas`.
 * The pointer over `host` repels particles; hovering or focusing a `[data-gather]` link inside `host` gathers them.
 * Exposes `data-frames` and `data-gathering` on the canvas for tests.
 */
export function startField(canvas: HTMLCanvasElement, host: HTMLElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touch = window.matchMedia('(hover: none)').matches;

  let w = 0;
  let h = 0;
  let parts: Particle[] = [];
  let pointer: Point | null = null;
  let attractor: Attractor | null = null;
  let attractEl: HTMLElement | null = null;
  let onScreen = true;
  let frames = 0;
  let raf = 0;
  let last = 0;

  function draw() {
    ctx!.clearRect(0, 0, w, h);
    for (const p of parts) {
      const a = alphaFor(p, h);
      if (a <= 0) continue;
      const soft = 1 - p.z; // far orbs get soft edges
      const [r, g, b] = p.tint;
      const grad = ctx!.createRadialGradient(p.x, p.y, p.r * (1 - soft * 0.9) * 0.6, p.x, p.y, p.r);
      grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},${a * (1 - soft) * 0.9})`);
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx!.fillStyle = grad;
      ctx!.fill();
    }
    canvas.dataset.frames = String(++frames);
  }

  function setAttractor(el: HTMLElement | null) {
    attractEl = el;
    if (!el) {
      attractor = null;
      canvas.dataset.gathering = 'false';
      return;
    }
    const c = canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    attractor = {
      x: r.left + r.width / 2 - c.left,
      y: r.top + r.height / 2 - c.top,
      rx: r.width / 2 + 14,
      ry: r.height / 2 + 12,
    };
    canvas.dataset.gathering = 'true';
  }

  const running = () => !reduce.matches && onScreen && document.visibilityState === 'visible';

  function tick(now: number) {
    raf = 0;
    const dt = frameDelta(now - last);
    last = now;
    for (const p of parts) {
      stepHome(p, dt, w, h, Math.random);
      stepBody(p, dt, pointer, attractor);
    }
    draw();
    if (running()) raf = requestAnimationFrame(tick);
  }

  function resume() {
    if (raf || !running()) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    const s = backingScale(w, h, window.devicePixelRatio);
    canvas.width = Math.round(w * s);
    canvas.height = Math.round(h * s);
    ctx!.setTransform(s, 0, 0, s, 0, 0);
    parts = seed(w, h, touch);
    if (attractEl) setAttractor(attractEl); // the link moved with the layout
    draw();
    resume();
  }

  canvas.dataset.gathering = 'false';
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    resume();
  }).observe(canvas);
  document.addEventListener('visibilitychange', resume);
  reduce.addEventListener('change', resume);

  host.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const c = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - c.left, y: e.clientY - c.top };
  });
  host.addEventListener('pointerleave', () => {
    pointer = null;
  });

  host.querySelectorAll<HTMLElement>('[data-gather]').forEach((el) => {
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') setAttractor(el);
    });
    el.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'touch' && attractEl === el) setAttractor(null);
    });
    el.addEventListener('focus', () => setAttractor(el));
    el.addEventListener('blur', () => {
      if (attractEl === el) setAttractor(null);
    });
    // Touch: a brief gather pulse. Navigation is never delayed or prevented.
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      setAttractor(el);
      window.setTimeout(() => {
        if (attractEl === el) setAttractor(null);
      }, TOUCH_PULSE_MS);
    });
  });
}
