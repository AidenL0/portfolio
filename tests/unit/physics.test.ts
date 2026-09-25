import { describe, it, expect } from 'vitest';
import {
  MAX_BACKING_PIXELS,
  alphaFor,
  backingScale,
  frameDelta,
  particleCount,
  seed,
  stepBody,
  stepHome,
  type Attractor,
  type Particle,
} from '../../src/scripts/particles/physics';

/** Deterministic PRNG (mulberry32) so tests never flake. */
function rng(s = 1) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A particle resting on its home point. */
function at(x: number, y: number, z = 0.5): Particle {
  return { x, y, hx: x, hy: y, vx: 0, vy: 0, z, r: 10, tint: [127, 224, 212], ph: 0, sp: 0.005, captured: false };
}

const run = (n: number, fn: () => void) => { for (let i = 0; i < n; i++) fn(); };
const distHome = (p: Particle) => Math.hypot(p.x - p.hx, p.y - p.hy);

describe('particleCount', () => {
  it('scales with area and caps at 70', () => {
    expect(particleCount(800, 600, false)).toBe(30);
    expect(particleCount(1600, 800, false)).toBe(70);
    expect(particleCount(4000, 4000, false)).toBe(70);
  });
  it('halves on touch devices', () => {
    expect(particleCount(800, 600, true)).toBe(15);
    expect(particleCount(1600, 800, true)).toBe(35);
  });
  it('is zero for an empty or negative canvas', () => {
    expect(particleCount(0, 600, false)).toBe(0);
    expect(particleCount(800, 0, false)).toBe(0);
    expect(particleCount(-5, 600, false)).toBe(0);
  });
});

describe('seed', () => {
  it('creates particles inside the canvas, at rest on their home point', () => {
    const parts = seed(800, 600, false, rng(7));
    expect(parts).toHaveLength(30);
    for (const p of parts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(800);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(600);
      expect([p.hx, p.hy, p.vx, p.vy]).toEqual([p.x, p.y, 0, 0]);
      expect(p.r).toBeGreaterThanOrEqual(3);
      expect(p.r).toBeLessThanOrEqual(25);
      expect(p.captured).toBe(false);
    }
  });
  it('returns no particles for a zero-size canvas', () => {
    expect(seed(0, 0, false, rng())).toEqual([]);
  });
});

describe('stepBody: spring', () => {
  it('returns a displaced particle to within 1px of home', () => {
    const p = at(100, 100);
    p.x = 160; p.y = 40;
    run(600, () => stepBody(p, 1, null, null));
    expect(distHome(p)).toBeLessThan(1);
  });
  it('does nothing when dt is 0', () => {
    const p = at(100, 100);
    p.x = 150;
    stepBody(p, 0, null, null);
    expect(p.x).toBe(150);
    expect(p.vx).toBe(0);
  });
});

describe('stepBody: cursor repel', () => {
  it('pushes a particle within 140px away from the cursor', () => {
    const p = at(100, 100);
    stepBody(p, 1, { x: 150, y: 100 }, null);
    expect(p.vx).toBeLessThan(0);
    expect(p.x).toBeLessThan(100);
  });
  it('ignores a cursor 140px or more away', () => {
    const p = at(100, 100);
    stepBody(p, 1, { x: 240, y: 100 }, null);
    expect(p.vx).toBe(0);
    expect(p.x).toBe(100);
  });
  it('stays finite when the cursor sits exactly on the particle', () => {
    const p = at(100, 100);
    stepBody(p, 1, { x: 100, y: 100 }, null);
    expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
  });
});

describe('stepBody: gather', () => {
  const A: Attractor = { x: 300, y: 300, rx: 60, ry: 30 };
  const ringDistance = (p: Particle) => Math.hypot((p.x - A.x) / A.rx, (p.y - A.y) / A.ry);

  it('settles particles within reach onto the halo, from inside and outside the ring', () => {
    const starts: Array<[number, number]> = [
      [300 + 60 * 1.8, 300],
      [300, 300 - 30 * 3],
      [300 - 60 * 4, 300 + 30 * 0.5],
      [300 + 60 * 0.4, 300 + 30 * 0.3],
    ];
    for (const [x, y] of starts) {
      const p = at(x, y);
      run(500, () => stepBody(p, 1, null, A));
      expect(p.captured).toBe(true);
      expect(ringDistance(p)).toBeGreaterThan(0.5);
      expect(ringDistance(p)).toBeLessThan(1.5);
    }
  });

  it('leaves particles beyond reach alone', () => {
    const p = at(300 + 60 * 6, 300);
    stepBody(p, 1, null, A);
    expect(p.captured).toBe(false);
    expect(p.vx).toBe(0);
  });

  it('turns off cursor repel while gathering', () => {
    const p = at(300 + 60 * 6, 300);
    stepBody(p, 1, { x: p.x + 10, y: p.y }, A);
    expect(p.vx).toBe(0);
  });

  it('lets particles spring home once the link is released', () => {
    const p = at(100, 100);
    const link: Attractor = { x: 180, y: 100, rx: 40, ry: 20 };
    run(400, () => stepBody(p, 1, null, link));
    expect(distHome(p)).toBeGreaterThan(20);
    run(800, () => stepBody(p, 1, null, null));
    expect(p.captured).toBe(false);
    expect(distHome(p)).toBeLessThan(1);
  });
});

describe('stepHome', () => {
  it('moves the home point upward', () => {
    const p = at(100, 300);
    stepHome(p, 1, 800, 600, rng());
    expect(p.hy).toBeLessThan(300);
  });
  it('wraps to the bottom with a new x once home passes the top', () => {
    const p = at(100, -39.9);
    p.vx = 3; p.vy = -2;
    stepHome(p, 1, 800, 600, () => 0.25);
    expect([p.hx, p.hy, p.x, p.y, p.vx, p.vy]).toEqual([200, 640, 200, 640, 0, 0]);
  });
  it('freezes the home point while the particle is captured', () => {
    const p = at(100, 300);
    p.captured = true;
    stepHome(p, 1, 800, 600, rng());
    expect([p.hx, p.hy]).toEqual([100, 300]);
  });
});

describe('frameDelta', () => {
  it('normalizes to 60fps frames and caps long gaps at 3', () => {
    expect(frameDelta(16.67)).toBeCloseTo(1);
    expect(frameDelta(33.34)).toBeCloseTo(2);
    expect(frameDelta(5000)).toBe(3);
    expect(frameDelta(-5)).toBe(0);
  });
});

describe('backingScale', () => {
  it('uses the device pixel ratio, capped at 2', () => {
    expect(backingScale(800, 600, 1)).toBe(1);
    expect(backingScale(800, 600, 2)).toBe(2);
    expect(backingScale(800, 600, 3)).toBe(2);
    expect(backingScale(800, 600, 0)).toBe(1);
  });
  it('shrinks the scale so a tall canvas stays under the pixel cap', () => {
    const s = backingScale(1440, 6000, 2);
    expect(s).toBeLessThan(2);
    expect(1440 * 6000 * s * s).toBeLessThanOrEqual(MAX_BACKING_PIXELS);
  });
  it('handles a zero-size canvas', () => {
    expect(backingScale(0, 0, 2)).toBe(2);
  });
});

describe('alphaFor', () => {
  it('fades particles out at the very top of the canvas', () => {
    const p = at(100, 0, 0.5);
    expect(alphaFor(p, 1000)).toBe(0);
    p.y = 40;
    expect(alphaFor(p, 1000)).toBeCloseTo((0.12 + 0.5 * 0.42) * 0.5);
  });
  it('is full strength below the fade band', () => {
    expect(alphaFor(at(100, 500, 1), 1000)).toBeCloseTo(0.54);
  });
  it('is 0 for a zero-height canvas or a particle above the top', () => {
    expect(alphaFor(at(100, 50), 0)).toBe(0);
    expect(alphaFor(at(100, -10), 1000)).toBe(0);
  });
});
