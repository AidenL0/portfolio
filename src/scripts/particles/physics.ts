// Pure particle math for the background field. No DOM access, so it can be unit tested.
// Units: pixels and 60fps frames (dt = 1 is one frame at 60fps).

export type Tint = readonly [number, number, number];
export interface Point { x: number; y: number }
/** An elliptical target: particles gather into a halo on this ellipse. */
export interface Attractor { x: number; y: number; rx: number; ry: number }
export interface Particle {
  x: number; y: number;   // position
  hx: number; hy: number; // home point the particle springs toward
  vx: number; vy: number; // velocity
  z: number;              // depth, 0 (far) to 1 (near)
  r: number;              // radius
  tint: Tint;
  ph: number;             // sway phase
  sp: number;             // sway speed
  captured: boolean;      // held by an attractor this frame
}
export type Rand = () => number;

export const TINTS: readonly Tint[] = [
  [127, 224, 212],
  [92, 200, 214],
  [168, 240, 220],
  [70, 160, 180],
];
export const SPRING = 0.012;
export const DAMPING = 0.9;
export const REPEL_RADIUS = 140;
export const GATHER_REACH = 5;
export const MAX_PARTICLES = 70;
export const AREA_PER_PARTICLE = 16000;
export const MAX_BACKING_PIXELS = 8_000_000;

export function particleCount(w: number, h: number, touch: boolean): number {
  if (w <= 0 || h <= 0) return 0;
  const n = Math.min(MAX_PARTICLES, Math.floor((w * h) / AREA_PER_PARTICLE));
  return touch ? Math.floor(n / 2) : n;
}

export function makeParticle(w: number, h: number, rand: Rand): Particle {
  const z = rand();
  const x = rand() * w;
  const y = rand() * h;
  return {
    x, y, hx: x, hy: y, vx: 0, vy: 0, z,
    r: 3 + z * z * 22,
    tint: TINTS[Math.floor(rand() * TINTS.length)],
    ph: rand() * Math.PI * 2,
    sp: 0.004 + rand() * 0.006,
    captured: false,
  };
}

export function seed(w: number, h: number, touch: boolean, rand: Rand = Math.random): Particle[] {
  return Array.from({ length: particleCount(w, h, touch) }, () => makeParticle(w, h, rand));
}

/** Moves the home point: a slow rise with sideways sway, wrapping from the top to the bottom. */
export function stepHome(p: Particle, dt: number, w: number, h: number, rand: Rand): void {
  p.ph += p.sp * dt;
  if (p.captured) return;
  p.hy -= (0.12 + p.z * 0.35) * dt;
  p.hx += Math.sin(p.ph) * 0.12 * dt;
  if (p.hy < -40) {
    p.hy = p.y = h + 40;
    p.hx = p.x = rand() * w;
    p.vx = p.vy = 0;
  }
}

/** Applies gather or cursor-repel forces, the home spring, and damping, then moves the particle. */
export function stepBody(p: Particle, dt: number, pointer: Point | null, attractor: Attractor | null): void {
  let k = SPRING;
  p.captured = false;

  if (attractor) {
    const ax = (p.x - attractor.x) / attractor.rx;
    const ay = (p.y - attractor.y) / attractor.ry;
    const d = Math.hypot(ax, ay);
    if (d > 0 && d < GATHER_REACH) {
      p.captured = true;
      k = 0;
      const pull = (d - 1) * -0.35 * (1 - d / GATHER_REACH); // outside the ring: inward; inside: outward
      p.vx += ((ax / d) * pull + (-ay / d) * 0.05) * dt;     // plus a slow swirl along the ring
      p.vy += ((ay / d) * pull + (ax / d) * 0.05) * dt;
    }
  } else if (pointer) {
    const dx = p.x - pointer.x;
    const dy = p.y - pointer.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0 && dist < REPEL_RADIUS) {
      const f = (1 - dist / REPEL_RADIUS) * 1.4 * (0.5 + p.z);
      p.vx += (dx / dist) * f * dt;
      p.vy += (dy / dist) * f * dt;
    }
  }

  p.vx += (p.hx - p.x) * k * dt;
  p.vy += (p.hy - p.y) * k * dt;
  const damp = Math.pow(DAMPING, dt);
  p.vx *= damp;
  p.vy *= damp;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
}

/** Milliseconds since the last frame, as 60fps frames, capped so a stalled tab doesn't teleport particles. */
export function frameDelta(ms: number): number {
  return Math.min(3, Math.max(0, ms / 16.67));
}

/** Canvas backing-store scale: the DPR capped at 2, reduced further so w*h*scale² stays under MAX_BACKING_PIXELS. */
export function backingScale(w: number, h: number, dpr: number): number {
  const s = Math.min(dpr || 1, 2);
  const area = w * h;
  if (area <= 0) return s;
  return Math.min(s, Math.sqrt(MAX_BACKING_PIXELS / area));
}

/** Opacity by depth, fading out in the top 8% of the canvas. */
export function alphaFor(p: Particle, h: number): number {
  if (h <= 0) return 0;
  const fade = Math.min(1, Math.max(0, p.y / (h * 0.08)));
  return (0.12 + p.z * 0.42) * fade;
}
