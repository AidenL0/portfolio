# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy Aiden Longoria's single-page portfolio: an underwater-themed link hub and project showcase with an interactive particle field, in Astro on Cloudflare Pages.

**Architecture:** A fully static Astro 7 site with no UI framework. Content lives in one typed data file (`src/data/site.ts`). Four `.astro` components render it, and two small vanilla TypeScript scripts add motion: a canvas particle field whose physics are pure, unit-tested functions, and an event-log ticker. Vitest covers logic; Playwright covers the rendered page, motion toggles, and accessibility (axe).

**Tech Stack:** Node 22.14, Astro 7.3.5, Fontsource 5.3.0 (Instrument Serif, IBM Plex Sans, JetBrains Mono), Vitest 5.0.1, Playwright 1.63.0, @axe-core/playwright 4.13.0, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-25-portfolio-design.md` (visual reference: `docs/superpowers/specs/2026-09-25-portfolio-mockup.html`). Read both before starting any task.

## Global Constraints

- Node `>=22.12.0` (local is 22.14.0). All npm dependencies are pinned with `--save-exact`.
- No UI framework runtime (no React, Vue, or Svelte). Client JS stays **under 15 KB gzipped** in total.
- Single dark theme. Tokens exactly: `--deep #02121a`, `--mid #073443`, `--glow #0f5d6e`, `--abyss #010a0f`, `--ink #dff4f2`, `--soft #8fbfc0`, `--accent #7fe0d4`.
- Fonts: Instrument Serif (display), IBM Plex Sans 400/500/600 (body), JetBrains Mono 400 (utility), self-hosted through Fontsource. No requests to Google Fonts.
- Copy is verbatim from spec §2: eyebrow `Software Engineer · Texas A&M–Kingsville ’27`; headline `From storefront sites` + italic `to systems of record.`; the lede sentence as written.
- Socials are exactly GitHub → LinkedIn → Handshake with the spec URLs. Accessible names follow the form `"GitHub, AidenL0"`.
- External links use `target="_blank" rel="noopener noreferrer"`. In-page links (nav, hub tiles) don't.
- A project without `url` renders the text `Live link coming soon` and no link.
- **Never** write the real restaurant names, their old `*.pages.dev` hostnames, their town, or their street anywhere in the repo, including code, tests, docs, and commit messages. The leak-guard test reads those terms from the gitignored `tests/forbidden-terms.local.txt`.
- Everything respects `prefers-reduced-motion: reduce`: the particles draw one static frame, the CSS loops stop, the event log doesn't append, and hover effects become instant.
- Breakpoint: `max-width: 820px` switches everything to one column. The side gutter is `clamp(20px, 5vw, 64px)`, and the page never scrolls horizontally at 320px or wider.
- Production URL: `https://aiden-longoria.pages.dev` (the `site` in `astro.config.mjs`; Task 8 updates it if Cloudflare assigns a different name).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A tall page at high DPR.** The canvas spans the whole page (about 3000px tall). At DPR 2 its backing store can exceed mobile Safari's canvas pixel limit, and the canvas then silently renders nothing. Expected: the backing store is capped at 8,000,000 pixels (`backingScale`, Task 2).
2. **A zero-size canvas** (mid-layout, hidden, or print). Expected: no particles, no NaN, and no division by zero in `alphaFor` (Task 2).
3. **A long tab switch or a stalled frame.** Expected: `dt` is capped at 3, so particles never teleport when the tab comes back (`frameDelta`, Task 2).
4. **JavaScript disabled or a script error.** Expected: the headline, all three socials, the tiles, and all project cases are still rendered and usable (Task 4, e2e with JS off).
5. **Very narrow phones (320px).** Expected: long strings (`northwind-helpdesk.up.railway.app`, the Handshake handle) wrap, and the page doesn't scroll sideways (Task 4, e2e at 320 and 375).

---

## File Structure

| Path | Responsibility | Task |
|---|---|---|
| `package.json`, `.nvmrc`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts` | Tooling | 1 |
| `src/data/site.ts` | All content and its types | 1 |
| `tests/unit/site.test.ts` | Content rules and leak guard | 1 |
| `src/scripts/particles/physics.ts` | Pure particle math | 2 |
| `tests/unit/physics.test.ts` | Physics tests | 2 |
| `playwright.config.ts` | E2E runner (builds and previews the site) | 3 |
| `src/styles/tokens.css` | Tokens, reset, shared utility classes | 3 |
| `src/layouts/Base.astro` | `<head>`, fonts, meta and OG tags | 3 |
| `src/components/Hero.astro` | Eyebrow, `h1`, lede | 3 |
| `src/components/LinkHub.astro` | "Find me" socials and "Live projects" tiles | 3 |
| `src/pages/index.astro` | Page frame: background, nav, sections, script boot | 3 (then 4, 5) |
| `tests/e2e/hub.spec.ts` | Hero, nav, and socials e2e | 3 |
| `src/components/ProjectCase.astro` | One project case study | 4 (then 6) |
| `tests/e2e/projects.spec.ts` | Cases, pending links, no-JS, narrow widths | 4 |
| `src/scripts/particles/field.ts` | Canvas, frame loop, observers, gather wiring | 5 |
| `src/scripts/hover.ts` | Spotlight `--x`/`--y` tracking | 5 |
| `tests/e2e/motion.spec.ts` | Particle loop, reduced motion, gather, spotlight | 5 |
| `src/scripts/eventlog.ts` | Pure log-line generator | 6 |
| `src/components/EventLog.astro` | Log strip and ticker | 6 |
| `tests/unit/eventlog.test.ts`, `tests/e2e/eventlog.spec.ts` | Event log tests | 6 |
| `public/favicon.svg`, `public/og.png`, `scripts/make-og.mjs` | Icons and share image | 7 |
| `scripts/check-budget.mjs` | JS size budget | 7 |
| `tests/e2e/quality.spec.ts` | Meta tags, axe, assets | 7 |
| `README.md` | Content editing and deploy notes | 8 |

---

### Task 1: Scaffold and content data

**Files:**
- Create: `package.json`, `.nvmrc`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/pages/index.astro` (temporary), `src/data/site.ts`
- Test: `tests/unit/site.test.ts`

**Interfaces:**
- Produces: `src/data/site.ts` exports
  ```ts
  type Social = { label: string; handle: string; url: string };
  type Project = { id: string; name: string; tileName?: string; tileBlurb: string;
    category: 'Systems' | 'Small business'; description: string; stack: string[];
    url?: string; screenshot?: ImageMetadata; eventLog?: boolean };
  const identity: { name; eyebrow; headline: { lead; accent }; lede; pageTitle }  // all string
  const socials: Social[];
  const projects: Project[];
  ```
- npm scripts used by later tasks: `dev`, `build`, `preview`, `test`, `test:e2e`, `budget`, `og`.

- [ ] **Step 1: Create the tooling files**

`package.json`:
```json
{
  "name": "portfolio",
  "type": "module",
  "private": true,
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "budget": "node scripts/check-budget.mjs",
    "og": "node scripts/make-og.mjs"
  }
}
```

`.nvmrc`:
```
22.14.0
```

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aiden-longoria.pages.dev',
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
```

`src/pages/index.astro` (temporary; Task 3 replaces it):
```astro
---
---
<html lang="en"><head><meta charset="utf-8" /><title>Aiden Longoria</title></head><body><h1>Aiden Longoria</h1></body></html>
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install --save-exact astro@7.3.5 @fontsource/instrument-serif@5.3.0 @fontsource/ibm-plex-sans@5.3.0 @fontsource/jetbrains-mono@5.3.0
npm install --save-exact --save-dev vitest@5.0.1 @playwright/test@1.63.0 @axe-core/playwright@4.13.0
```
Expected: both finish without `ERR!`, and `package-lock.json` is created.

- [ ] **Step 3: Verify the build works**

Run: `npm run build`
Expected: output ends with `Complete!`, and `dist/index.html` exists and contains `Aiden Longoria`.

- [ ] **Step 4: Write the failing content tests**

`tests/unit/site.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { identity, projects, socials } from '../../src/data/site';

describe('identity', () => {
  it('uses the approved copy', () => {
    expect(identity.name).toBe('Aiden Longoria');
    expect(identity.eyebrow).toBe('Software Engineer · Texas A&M–Kingsville ’27');
    expect(identity.headline).toEqual({ lead: 'From storefront sites', accent: 'to systems of record.' });
    expect(identity.lede).toBe(
      'I build the full stack: fast websites for small businesses and the software that runs behind them. Open to full-time roles starting summer 2027.',
    );
    expect(identity.pageTitle).toBe('Aiden Longoria · Software Engineer');
  });
});

describe('socials', () => {
  it('lists exactly GitHub, LinkedIn, Handshake with the spec URLs', () => {
    expect(socials.map((s) => [s.label, s.handle, s.url])).toEqual([
      ['GitHub', 'AidenL0', 'https://github.com/AidenL0'],
      ['LinkedIn', 'aiden-longoria', 'https://linkedin.com/in/aiden-longoria-4329a4366'],
      ['Handshake', 'profile', 'https://app.joinhandshake.com/profiles/tummy_ache_surviver'],
    ]);
  });
});

describe('projects', () => {
  it('lists the three projects in order', () => {
    expect(projects.map((p) => p.id)).toEqual(['ticketing', 'la-esquina', 'fourth-quarter']);
  });

  it('has unique ids that are valid anchors', () => {
    const ids = projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it('uses https for every url that is set', () => {
    for (const p of projects) {
      if (p.url !== undefined) expect(new URL(p.url).protocol).toBe('https:');
    }
  });

  it('keeps the restaurant projects pending until their new URLs exist', () => {
    expect(projects.find((p) => p.id === 'la-esquina')?.url).toBeUndefined();
    expect(projects.find((p) => p.id === 'fourth-quarter')?.url).toBeUndefined();
  });

  it('gives only the ticketing project an event log', () => {
    expect(projects.filter((p) => p.eventLog).map((p) => p.id)).toEqual(['ticketing']);
  });
});

// Leak guard: real restaurant names, their town, and their street live only in a
// gitignored file so they never enter this public repo.
const TERMS_FILE = join(process.cwd(), 'tests/forbidden-terms.local.txt');
const terms = existsSync(TERMS_FILE)
  ? readFileSync(TERMS_FILE, 'utf8').split(/\r?\n/).map((t) => t.trim().toLowerCase()).filter(Boolean)
  : [];
const TEXT_EXT = new Set(['.ts', '.js', '.mjs', '.astro', '.css', '.json', '.md', '.svg', '.html', '.txt']);

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

describe('leak guard', () => {
  if (terms.length === 0) {
    console.warn('leak guard skipped: tests/forbidden-terms.local.txt not found or empty');
  }

  it.skipIf(terms.length === 0)('finds no forbidden term in src/ or public/', () => {
    const hits: string[] = [];
    for (const file of [...walk('src'), ...walk('public')]) {
      if (!TEXT_EXT.has(extname(file))) continue;
      const text = readFileSync(file, 'utf8').toLowerCase();
      terms.forEach((term, i) => {
        if (text.includes(term)) hits.push(`${file} contains forbidden term #${i + 1}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
```
(Hits report the term's line number in the local file rather than the term itself, so test output never prints a real name.)

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL, because `../../src/data/site` can't be resolved.

- [ ] **Step 6: Write `src/data/site.ts`**

```ts
import type { ImageMetadata } from 'astro';

export type Social = { label: string; handle: string; url: string };

export type Project = {
  /** Anchor id for the case study, e.g. "ticketing". */
  id: string;
  /** Case-study title. */
  name: string;
  /** Shorter name for the hub tile; defaults to `name`. */
  tileName?: string;
  /** One line under the tile name. */
  tileBlurb: string;
  category: 'Systems' | 'Small business';
  description: string;
  stack: string[];
  /** Live URL. Leave unset until the site is live; the page then shows "Live link coming soon". */
  url?: string;
  /** Import from src/assets/projects/. Leave unset to show the styled placeholder. */
  screenshot?: ImageMetadata;
  /** Show the faint event-log strip behind this case study. */
  eventLog?: boolean;
};

export const identity = {
  name: 'Aiden Longoria',
  eyebrow: 'Software Engineer · Texas A&M–Kingsville ’27',
  headline: { lead: 'From storefront sites', accent: 'to systems of record.' },
  lede: 'I build the full stack: fast websites for small businesses and the software that runs behind them. Open to full-time roles starting summer 2027.',
  pageTitle: 'Aiden Longoria · Software Engineer',
};

export const socials: Social[] = [
  { label: 'GitHub', handle: 'AidenL0', url: 'https://github.com/AidenL0' },
  { label: 'LinkedIn', handle: 'aiden-longoria', url: 'https://linkedin.com/in/aiden-longoria-4329a4366' },
  { label: 'Handshake', handle: 'profile', url: 'https://app.joinhandshake.com/profiles/tummy_ache_surviver' },
];

export const projects: Project[] = [
  {
    id: 'ticketing',
    name: 'Event-sourced ticketing platform',
    tileName: 'Northwind Helpdesk',
    tileBlurb: 'Event-sourced ticketing',
    category: 'Systems',
    description:
      "A help desk that stores every state change as an append-only event, so any ticket's full history can be reconstructed. Built with government records compliance in mind.",
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Windows Server'],
    url: 'https://northwind-helpdesk.up.railway.app',
    eventLog: true,
  },
  {
    id: 'la-esquina',
    name: 'La Esquina Taqueria',
    tileBlurb: 'Restaurant site · Stripe',
    category: 'Small business',
    description:
      'A fast, edge-deployed site for a family Mexican restaurant, with Stripe checkout and signature-verified payment webhooks.',
    stack: ['Astro', 'Cloudflare Pages', 'Stripe'],
  },
  {
    id: 'fourth-quarter',
    name: 'Fourth Quarter Cafe',
    tileBlurb: 'Sports cafe site',
    category: 'Small business',
    description:
      'Menu, hours, gallery, and directions for a sports cafe serving smoothies, açaí bowls, and made-to-order food.',
    stack: ['Astro', 'Cloudflare Pages'],
  },
];
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 7 tests passed and 1 skipped (the leak guard, since the local terms file doesn't exist yet), plus the warning `leak guard skipped`.

- [ ] **Step 8: Verify the leak guard actually works, then clean up**

Create a throwaway terms file containing a word that *is* in the data, run the tests, and confirm the guard fails. Then delete the file.
```bash
printf "northwind\n" > tests/forbidden-terms.local.txt
npm test
```
Expected: FAIL in `leak guard` with `src\data\site.ts contains forbidden term #1` (the path uses `/` on macOS or Linux).
```bash
rm tests/forbidden-terms.local.txt
git status --short tests/
```
Expected: `git status` shows nothing for `tests/forbidden-terms.local.txt` (it's gitignored and deleted).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .nvmrc astro.config.mjs tsconfig.json vitest.config.ts src tests/unit/site.test.ts
git commit -m "feat: scaffold Astro project and typed site content

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Particle physics

**Files:**
- Create: `src/scripts/particles/physics.ts`
- Test: `tests/unit/physics.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (all exported from `src/scripts/particles/physics.ts`):
  ```ts
  type Tint = readonly [number, number, number];
  interface Point { x: number; y: number }
  interface Attractor { x: number; y: number; rx: number; ry: number }
  interface Particle { x; y; hx; hy; vx; vy; z; r: number; tint: Tint; ph: number; sp: number; captured: boolean }
  type Rand = () => number;
  const TINTS: readonly Tint[]; const MAX_BACKING_PIXELS = 8_000_000;
  function particleCount(w: number, h: number, touch: boolean): number;
  function makeParticle(w: number, h: number, rand: Rand): Particle;
  function seed(w: number, h: number, touch: boolean, rand?: Rand): Particle[];
  function stepHome(p: Particle, dt: number, w: number, h: number, rand: Rand): void; // mutates p
  function stepBody(p: Particle, dt: number, pointer: Point | null, attractor: Attractor | null): void; // mutates p
  function frameDelta(ms: number): number;
  function backingScale(w: number, h: number, dpr: number): number;
  function alphaFor(p: Particle, h: number): number;
  ```

- [ ] **Step 1: Write the failing tests**

`tests/unit/physics.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/physics.test.ts`
Expected: FAIL, because `physics` can't be resolved.

- [ ] **Step 3: Write `src/scripts/particles/physics.ts`**

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, with every physics and site test passing (the leak guard is still skipped).

- [ ] **Step 5: Commit**

```bash
git add src/scripts/particles/physics.ts tests/unit/physics.test.ts
git commit -m "feat: add pure particle physics with spring, repel, and gather

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Page shell (layout, tokens, hero, link hub)

**Files:**
- Create: `playwright.config.ts`, `src/styles/tokens.css`, `src/layouts/Base.astro`, `src/components/Hero.astro`, `src/components/LinkHub.astro`
- Replace: `src/pages/index.astro`
- Test: `tests/e2e/hub.spec.ts`

**Interfaces:**
- Consumes: `identity`, `socials`, `projects` from `src/data/site.ts`.
- Produces:
  - `Base.astro` props `{ title: string; description: string }`.
  - DOM hooks used by Task 5: the page wrapper `[data-site]`; social links carry `[data-gather]`; hub tiles carry `[data-spotlight]` and class `tile`.
  - Section anchors: `#about` (hero), `#contact` ("Find me" panel), `#projects` (projects section with `h2#projects-heading`).
  - Global CSS custom property `--spot` (registered with `@property` in `tokens.css`).

- [ ] **Step 1: Set up Playwright**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

Run: `npx playwright install chromium`
Expected: Chromium downloads, or reports it's already installed.

- [ ] **Step 2: Write the failing e2e tests**

`tests/e2e/hub.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('shows the title and headline', async ({ page }) => {
  await expect(page).toHaveTitle('Aiden Longoria · Software Engineer');
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveText('From storefront sites to systems of record.');
  await expect(h1.locator('em')).toHaveText('to systems of record.');
  await expect(page.getByText('Software Engineer · Texas A&M–Kingsville ’27')).toBeVisible();
});

test('lists the three socials in order with exact URLs, opening in a new tab', async ({ page }) => {
  const expected = [
    ['GitHub, AidenL0', 'https://github.com/AidenL0'],
    ['LinkedIn, aiden-longoria', 'https://linkedin.com/in/aiden-longoria-4329a4366'],
    ['Handshake, profile', 'https://app.joinhandshake.com/profiles/tummy_ache_surviver'],
  ];
  const links = page.locator('#contact a');
  await expect(links).toHaveCount(3);
  for (const [i, [name, href]] of expected.entries()) {
    const link = links.nth(i);
    await expect(link).toHaveAccessibleName(name);
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('data-gather', '');
  }
});

test('shows a hub tile per project, linking to its case anchor', async ({ page }) => {
  const tiles = page.locator('[data-spotlight]');
  await expect(tiles).toHaveCount(3);
  await expect(tiles.nth(0)).toHaveAttribute('href', '#ticketing');
  await expect(tiles.nth(0)).toContainText('Northwind Helpdesk');
  await expect(tiles.nth(1)).toHaveAttribute('href', '#la-esquina');
  await expect(tiles.nth(2)).toHaveAttribute('href', '#fourth-quarter');
  await expect(tiles.nth(0)).not.toHaveAttribute('target', '_blank');
});

test('nav links point at real sections', async ({ page }) => {
  for (const id of ['projects', 'about', 'contact']) {
    await expect(page.locator(`nav a[href="#${id}"]`)).toHaveCount(1);
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/hub.spec.ts`
Expected: FAIL. The title is `Aiden Longoria`, and there's no `#contact` or `[data-spotlight]` yet.

- [ ] **Step 4: Write `src/styles/tokens.css`**

```css
@property --spot {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

:root {
  color-scheme: dark;
  --deep: #02121a;
  --mid: #073443;
  --glow: #0f5d6e;
  --abyss: #010a0f;
  --ink: #dff4f2;
  --soft: #8fbfc0;
  --accent: #7fe0d4;
  --glass-fill: rgba(170, 240, 235, 0.06);
  --glass-line: rgba(170, 240, 235, 0.16);
  --hair: rgba(170, 240, 235, 0.12);
  --serif: "Instrument Serif", Georgia, serif;
  --sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Consolas, monospace;
  --gutter: clamp(20px, 5vw, 64px);
  --ease-out: cubic-bezier(0.2, 0.7, 0.2, 1);
}

*, *::before, *::after { box-sizing: border-box; }
html { background: var(--abyss); scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--abyss);
  color: var(--ink);
  font: 400 16px/1.6 var(--sans);
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
img { max-width: 100%; height: auto; display: block; }
ul[role="list"] { list-style: none; margin: 0; padding: 0; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }

.eyebrow {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
```

- [ ] **Step 5: Write `src/layouts/Base.astro`**

```astro
---
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '../styles/tokens.css';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
const ogImage = new URL('/og.png', Astro.site);
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="theme-color" content="#02121a" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 6: Write `src/components/Hero.astro`**

```astro
---
import { identity } from '../data/site';
---
<section class="hero" id="about" aria-labelledby="hero-title">
  <p class="eyebrow">{identity.eyebrow}</p>
  <h1 class="title" id="hero-title">{identity.headline.lead} <em>{identity.headline.accent}</em></h1>
  <p class="lede">{identity.lede}</p>
</section>

<style>
  .hero { display: grid; gap: 18px; max-width: 800px; scroll-margin-top: 24px; }
  .title {
    margin: 0;
    font: 400 clamp(44px, 7vw, 88px)/1 var(--serif);
    letter-spacing: -0.01em;
    text-wrap: balance;
  }
  .title em { color: var(--accent); }
  .lede { margin: 0; max-width: 54ch; color: var(--soft); font-size: 17px; }
</style>
```

- [ ] **Step 7: Write `src/components/LinkHub.astro`**

```astro
---
import { projects, socials } from '../data/site';
---
<div class="hub">
  <section class="glass" id="contact" aria-labelledby="find-me">
    <h2 class="glass-label" id="find-me">Find me</h2>
    <ul class="socials" role="list">
      {socials.map((s) => (
        <li>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${s.label}, ${s.handle}`}
            data-gather
          >
            <span class="s-name">{s.label}</span>
            <span class="s-handle">{s.handle}</span>
            <span class="s-arrow" aria-hidden="true">↗</span>
          </a>
        </li>
      ))}
    </ul>
  </section>

  <section class="glass" aria-labelledby="live-projects">
    <h2 class="glass-label" id="live-projects">Live projects</h2>
    <ul class="tiles" role="list">
      {projects.map((p) => (
        <li>
          <a class="tile" href={`#${p.id}`} data-spotlight>
            <b class="t-name">{p.tileName ?? p.name}</b>
            <span class="t-blurb">{p.tileBlurb}</span>
            <span class="t-arrow" aria-hidden="true">↘</span>
          </a>
        </li>
      ))}
    </ul>
  </section>
</div>

<style>
  .hub { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 16px; }
  .glass {
    display: grid;
    gap: 12px;
    align-content: start;
    padding: 18px 20px;
    border-radius: 18px;
    background: var(--glass-fill);
    border: 1px solid var(--glass-line);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    scroll-margin-top: 24px;
  }
  .glass-label {
    margin: 0;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--soft);
  }

  /* Socials: particles gather around the hovered link (see field.ts); the row adds a light underline and arrow. */
  .socials a {
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 8px 10px;
    margin-inline: -10px;
    border-radius: 8px;
    text-decoration: none;
  }
  .socials li + li a::before {
    content: "";
    position: absolute;
    top: 0; left: 10px; right: 10px;
    height: 1px;
    background: var(--hair);
  }
  .socials a::after {
    content: "";
    position: absolute;
    left: 10px; right: 10px; bottom: 0;
    height: 1px;
    background: var(--accent);
    opacity: 0.4;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.55s var(--ease-out);
  }
  .s-handle { margin-left: auto; color: var(--soft); font-size: 13px; overflow-wrap: anywhere; }
  .s-arrow {
    width: 1em;
    color: var(--accent);
    opacity: 0;
    transform: translate(-6px, 4px);
    transition: opacity 0.3s, transform 0.45s var(--ease-out);
  }
  .socials a:is(:hover, :focus-visible)::after { transform: scaleX(1); }
  .socials a:is(:hover, :focus-visible) .s-arrow { opacity: 1; transform: none; }

  /* Project tiles: spotlight follows the cursor via --x/--y (see hover.ts). */
  .tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .tile {
    position: relative;
    display: grid;
    gap: 4px;
    height: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--hair);
    text-decoration: none;
    background:
      radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), rgba(127, 224, 212, var(--spot)), transparent 70%),
      rgba(2, 18, 26, 0.45);
    transition: border-color 0.4s, --spot 0.3s;
  }
  .t-name { font: 400 21px/1.1 var(--serif); padding-right: 1.2em; }
  .t-blurb { font-size: 12px; color: var(--soft); }
  .t-arrow {
    position: absolute;
    top: 10px; right: 12px;
    color: var(--accent);
    opacity: 0;
    transform: translate(-4px, 4px);
    transition: opacity 0.3s, transform 0.45s var(--ease-out);
  }
  .tile:is(:hover, :focus-visible) { --spot: 0.16; border-color: rgba(127, 224, 212, 0.5); }
  .tile:is(:hover, :focus-visible) .t-arrow { opacity: 1; transform: none; }

  @media (max-width: 820px) {
    .hub, .tiles { grid-template-columns: minmax(0, 1fr); }
  }
  @media (prefers-reduced-motion: reduce) {
    .socials a::after, .s-arrow, .t-arrow, .tile { transition: none; }
  }
</style>
```

- [ ] **Step 8: Replace `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import LinkHub from '../components/LinkHub.astro';
import { identity } from '../data/site';
---
<Base title={identity.pageTitle} description={identity.lede}>
  <div class="site" data-site>
    <div class="caustics" aria-hidden="true"></div>
    <div class="rays" aria-hidden="true"></div>
    <header class="top">
      <nav class="nav" aria-label="Primary">
        <span class="mark">{identity.name}</span>
        <div class="nav-links">
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>
    </header>
    <main class="main">
      <div class="intro">
        <Hero />
        <LinkHub />
      </div>
      <section class="work" id="projects" aria-labelledby="projects-heading">
        <h2 class="work-head" id="projects-heading">Projects</h2>
      </section>
    </main>
  </div>
</Base>

<style>
  .site {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    background: radial-gradient(120% 55% at 30% -8%, var(--glow) 0%, var(--mid) 30%, var(--deep) 62%, var(--abyss) 100%);
  }
  .caustics {
    position: absolute;
    inset: -10% -10% auto -10%;
    height: 900px;
    z-index: 0;
    pointer-events: none;
    opacity: 0.22;
    mix-blend-mode: screen;
    background:
      radial-gradient(40% 30% at 20% 30%, rgba(160, 255, 240, 0.35), transparent 70%),
      radial-gradient(30% 25% at 70% 20%, rgba(160, 255, 240, 0.28), transparent 70%),
      radial-gradient(35% 30% at 50% 60%, rgba(120, 220, 230, 0.22), transparent 70%);
    filter: blur(18px);
    animation: drift 22s ease-in-out infinite alternate;
  }
  .rays {
    position: absolute;
    inset: 0 0 auto 0;
    height: 700px;
    z-index: 0;
    pointer-events: none;
    opacity: 0.1;
    background: repeating-linear-gradient(100deg, transparent 0 60px, rgba(190, 255, 250, 0.5) 60px 64px, transparent 64px 150px);
    -webkit-mask-image: linear-gradient(to bottom, #000, transparent 90%);
    mask-image: linear-gradient(to bottom, #000, transparent 90%);
    animation: sway 16s ease-in-out infinite alternate;
  }
  @keyframes drift {
    from { transform: translate3d(-3%, 0, 0) scale(1); }
    to { transform: translate3d(4%, 3%, 0) scale(1.08); }
  }
  @keyframes sway {
    from { transform: skewX(-4deg) translateX(-2%); }
    to { transform: skewX(4deg) translateX(2%); }
  }

  .top, .main { position: relative; z-index: 1; }
  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1280px;
    margin-inline: auto;
    padding: 28px var(--gutter) 0;
    font-size: 13px;
    letter-spacing: 0.06em;
  }
  .mark { font: italic 400 22px var(--serif); letter-spacing: 0; }
  .nav-links { display: flex; gap: 22px; }
  .nav-links a { text-decoration: none; color: var(--ink); }
  .nav-links a:hover { color: var(--accent); }

  .intro {
    display: grid;
    gap: 56px;
    max-width: 1280px;
    margin-inline: auto;
    padding: 80px var(--gutter) 64px;
  }
  .work {
    display: grid;
    gap: 20px;
    max-width: 1280px;
    margin-inline: auto;
    padding: 0 var(--gutter) 96px;
    scroll-margin-top: 24px;
  }
  .work-head {
    margin: 0;
    padding-top: 36px;
    border-top: 1px solid var(--hair);
    font: 400 clamp(32px, 4vw, 48px)/1 var(--serif);
  }

  @media (max-width: 820px) {
    .nav-links { display: none; }
    .intro { padding-top: 48px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .caustics, .rays { animation: none; }
  }
</style>
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/hub.spec.ts`
Expected: PASS, 4 passed.

- [ ] **Step 10: Check it visually once**

Run `npm run dev`, open http://localhost:4321, and compare the hero and hub against `docs/superpowers/specs/2026-09-25-portfolio-mockup.html` (particles and projects arrive in later tasks). Hover a social link (underline and ↗ appear) and a tile (border lights up and ↘ appears). Stop the dev server.

- [ ] **Step 11: Commit**

```bash
git add playwright.config.ts src tests/e2e/hub.spec.ts
git commit -m "feat: add page shell with hero, link hub, and underwater background

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Project case studies

**Files:**
- Create: `src/components/ProjectCase.astro`
- Modify: `src/pages/index.astro` (frontmatter imports, and the `#projects` section)
- Test: `tests/e2e/projects.spec.ts`

**Interfaces:**
- Consumes: `Project`, `projects` from `src/data/site.ts`; section `#projects` from Task 3.
- Produces: `ProjectCase.astro` props `{ project: Project; flip?: boolean }`. It renders `<article class="case" id={project.id}>` with `h3`, and a `.copy` wrapper at `z-index: 1` (Task 6 inserts `<EventLog />` as the article's first child).

- [ ] **Step 1: Write the failing e2e tests**

`tests/e2e/projects.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test.describe('project cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders one case per project, in order, with h3 titles', async ({ page }) => {
    const cases = page.locator('#projects article');
    await expect(cases).toHaveCount(3);
    await expect(cases.nth(0)).toHaveId('ticketing');
    await expect(cases.nth(1)).toHaveId('la-esquina');
    await expect(cases.nth(2)).toHaveId('fourth-quarter');
    await expect(page.getByRole('heading', { level: 3, name: 'Event-sourced ticketing platform' })).toBeVisible();
  });

  test('links the live project in a new tab, showing its host', async ({ page }) => {
    const link = page.locator('#ticketing a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', 'https://northwind-helpdesk.up.railway.app');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toContainText('northwind-helpdesk.up.railway.app');
  });

  test('shows "Live link coming soon" and no link for pending projects', async ({ page }) => {
    for (const id of ['la-esquina', 'fourth-quarter']) {
      const card = page.locator(`#${id}`);
      await expect(card).toContainText('Live link coming soon');
      await expect(card.locator('a')).toHaveCount(0);
    }
  });

  test('lists the stack as chips', async ({ page }) => {
    await expect(page.locator('#la-esquina li')).toHaveText(['Astro', 'Cloudflare Pages', 'Stripe']);
  });

  test('every hub tile jumps to an existing case', async ({ page }) => {
    for (const href of await page.locator('[data-spotlight]').evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
      await expect(page.locator(href!)).toHaveCount(1);
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all content is still present and visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#contact a')).toHaveCount(3);
    await expect(page.locator('[data-spotlight]')).toHaveCount(3);
    await expect(page.locator('#projects article')).toHaveCount(3);
    for (const a of await page.locator('#projects article').all()) await expect(a).toBeVisible();
  });
});

for (const width of [375, 320]) {
  test.describe(`at ${width}px wide`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('the page never scrolls sideways', async ({ page }) => {
      await page.goto('/');
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(width);
    });
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/projects.spec.ts`
Expected: FAIL, because `#projects article` has count 0.

- [ ] **Step 3: Write `src/components/ProjectCase.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { Project } from '../data/site';

interface Props {
  project: Project;
  flip?: boolean;
}

const { project, flip = false } = Astro.props;
const host = project.url ? new URL(project.url).host : null;
---
<article class:list={['case', { flip }]} id={project.id} aria-labelledby={`${project.id}-title`}>
  {project.screenshot ? (
    <Image
      class="shot"
      src={project.screenshot}
      alt={`Screenshot of ${project.name}`}
      widths={[480, 800, 1200]}
      sizes="(max-width: 820px) 100vw, 560px"
    />
  ) : (
    <div class="shot placeholder" aria-hidden="true"></div>
  )}
  <div class="copy">
    <p class="eyebrow">{project.category}</p>
    <h3 id={`${project.id}-title`}>{project.name}</h3>
    <p class="desc">{project.description}</p>
    <ul class="chips" role="list" aria-label="Built with">
      {project.stack.map((s) => <li>{s}</li>)}
    </ul>
    {project.url ? (
      <a class="go" href={project.url} target="_blank" rel="noopener noreferrer">
        {host} <span aria-hidden="true">→</span>
      </a>
    ) : (
      <p class="go pending">Live link coming soon</p>
    )}
  </div>
</article>

<style>
  .case {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 32px;
    align-items: center;
    padding: 28px;
    border-radius: 20px;
    background: rgba(2, 18, 26, 0.5);
    border: 1px solid var(--hair);
    scroll-margin-top: 24px;
  }
  .case :global(.shot) {
    position: relative;
    z-index: 1;
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: 12px;
    border: 1px solid rgba(170, 240, 235, 0.18);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
  }
  .case.flip :global(.shot) { order: 2; }
  .placeholder {
    background:
      linear-gradient(180deg, rgba(127, 224, 212, 0.14), rgba(2, 18, 26, 0.2) 40%),
      repeating-linear-gradient(180deg, rgba(223, 244, 242, 0.08) 0 10px, transparent 10px 26px) 8% 30% / 56% 60% no-repeat,
      linear-gradient(rgba(127, 224, 212, 0.25), rgba(127, 224, 212, 0.25)) 72% 30% / 20% 40% no-repeat,
      rgba(2, 18, 26, 0.6);
  }
  .copy { position: relative; z-index: 1; display: grid; gap: 10px; }
  .copy h3 { margin: 0; font: 400 34px/1.05 var(--serif); text-wrap: balance; }
  .desc { margin: 0; max-width: 52ch; color: var(--soft); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chips li {
    font-size: 12px;
    padding: 3px 9px;
    border-radius: 99px;
    border: 1px solid rgba(143, 191, 192, 0.5);
    color: var(--soft);
  }
  .go {
    justify-self: start;
    margin: 0;
    font-size: 14px;
    color: var(--accent);
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  a.go:hover { text-decoration: underline; }
  .pending { color: var(--soft); }

  @media (max-width: 820px) {
    .case { grid-template-columns: minmax(0, 1fr); padding: 20px; }
    .case.flip :global(.shot) { order: 0; }
  }
</style>
```

- [ ] **Step 4: Render the cases in `src/pages/index.astro`**

In the frontmatter, replace:
```astro
import LinkHub from '../components/LinkHub.astro';
import { identity } from '../data/site';
```
with:
```astro
import LinkHub from '../components/LinkHub.astro';
import ProjectCase from '../components/ProjectCase.astro';
import { identity, projects } from '../data/site';
```

In the markup, replace:
```astro
        <h2 class="work-head" id="projects-heading">Projects</h2>
      </section>
```
with:
```astro
        <h2 class="work-head" id="projects-heading">Projects</h2>
        {projects.map((project, i) => <ProjectCase project={project} flip={i % 2 === 1} />)}
      </section>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:e2e`
Expected: PASS, with every `hub.spec.ts` and `projects.spec.ts` test passing.

- [ ] **Step 6: Commit**

```bash
git add src tests/e2e/projects.spec.ts
git commit -m "feat: add project case studies with pending-link state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Particle field and hover wiring

**Files:**
- Create: `src/scripts/particles/field.ts`, `src/scripts/hover.ts`
- Modify: `src/pages/index.astro` (add the canvas, its CSS, and the boot script)
- Test: `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: everything in `physics.ts` (Task 2). DOM hooks `[data-site]`, `[data-gather]`, `[data-spotlight]` (Task 3).
- Produces:
  - `startField(canvas: HTMLCanvasElement, host: HTMLElement): void`
  - `trackSpotlight(root?: ParentNode): void`
  - Test hooks on the canvas: `data-frames` (the number of frames drawn so far) and `data-gathering` (`"true"` or `"false"`).

- [ ] **Step 1: Write the failing e2e tests**

`tests/e2e/motion.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

const frames = async (page: import('@playwright/test').Page) =>
  Number(await page.locator('[data-field]').getAttribute('data-frames'));

test('the particle field animates', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-field]')).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(() => frames(page)).toBeGreaterThan(20);
});

test('hovering a social link gathers particles; leaving releases them', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('[data-field]');
  await expect(canvas).toHaveAttribute('data-gathering', 'false');
  await page.getByRole('link', { name: 'GitHub, AidenL0' }).hover();
  await expect(canvas).toHaveAttribute('data-gathering', 'true');
  await page.mouse.move(5, 5);
  await expect(canvas).toHaveAttribute('data-gathering', 'false');
});

test('keyboard focus on a social link gathers particles too', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('[data-field]');
  await page.getByRole('link', { name: 'LinkedIn, aiden-longoria' }).focus();
  await expect(canvas).toHaveAttribute('data-gathering', 'true');
  await page.getByRole('link', { name: 'LinkedIn, aiden-longoria' }).blur();
  await expect(canvas).toHaveAttribute('data-gathering', 'false');
});

test('the spotlight follows the cursor across a project tile', async ({ page }) => {
  await page.goto('/');
  const tile = page.locator('[data-spotlight]').first();
  const box = (await tile.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
  await expect.poll(() => tile.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--x'))).toMatch(/^2\d(\.\d+)?%$/);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('draws a still frame and never loops', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => frames(page)).toBeGreaterThan(0);
    await page.waitForTimeout(1000);
    const settled = await frames(page);
    await page.waitForTimeout(1500);
    expect(await frames(page)).toBe(settled);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/motion.spec.ts`
Expected: FAIL, because there's no `[data-field]` element.

- [ ] **Step 3: Write `src/scripts/particles/field.ts`**

```ts
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
```

- [ ] **Step 4: Write `src/scripts/hover.ts`**

```ts
/** Keeps `--x`/`--y` on each `[data-spotlight]` element at the cursor position, as percentages, for the CSS glow. */
export function trackSpotlight(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--y', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
}
```

- [ ] **Step 5: Add the canvas and boot script to `src/pages/index.astro`**

In the markup, replace:
```astro
    <div class="rays" aria-hidden="true"></div>
    <header class="top">
```
with:
```astro
    <div class="rays" aria-hidden="true"></div>
    <canvas class="field" aria-hidden="true" data-field></canvas>
    <header class="top">
```

Directly after the closing `</Base>` tag (before `<style>`), add:
```astro
<script>
  import { startField } from '../scripts/particles/field';
  import { trackSpotlight } from '../scripts/hover';

  const canvas = document.querySelector<HTMLCanvasElement>('[data-field]');
  const host = document.querySelector<HTMLElement>('[data-site]');
  if (canvas && host) startField(canvas, host);
  trackSpotlight(document);
</script>
```

In the `<style>` block, directly after the `@keyframes sway { ... }` rule, add:
```css
  .field {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
  }
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test:e2e`
Expected: PASS, with every hub, projects, and motion test passing.

- [ ] **Step 7: Check it by hand against the mockup**

Run `npm run dev` and open http://localhost:4321.
- The orbs rise slowly, and your cursor pushes them away.
- Hovering GitHub pulls nearby orbs into a slowly circling halo behind the glass. Moving off releases them back to their places.
- Tab to a social link: the same halo forms.
- In Chrome DevTools, use Rendering → "Emulate CSS prefers-reduced-motion: reduce" and reload: the orbs are still, and the shimmer and rays stop.
- DevTools device toolbar with a phone preset (touch): tapping a social link shows a short gather pulse and still follows the link.

Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add src tests/e2e/motion.spec.ts
git commit -m "feat: add interactive particle field and tile spotlight

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Event log behind the ticketing case

**Files:**
- Create: `src/scripts/eventlog.ts`, `src/components/EventLog.astro`
- Modify: `src/components/ProjectCase.astro` (import and render `EventLog` when `project.eventLog`)
- Test: `tests/unit/eventlog.test.ts`, `tests/e2e/eventlog.spec.ts`

**Interfaces:**
- Consumes: `Project.eventLog` (Task 1); the `.case` article, which is `position: relative; overflow: hidden` with `.copy` and `.shot` at `z-index: 1` (Task 4).
- Produces:
  ```ts
  interface LogState { seq: number; ticket: number; t: number }  // t = seconds since midnight
  function initialLogState(): LogState;       // { seq: 18420, ticket: 4127, t: 33240 }
  function nextLine(s: LogState, rand?: () => number): string;  // mutates s
  ```
  DOM: `[data-eventlog]` wraps `[data-eventlog-lines]`, whose child `div`s are the lines.

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/eventlog.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { initialLogState, nextLine } from '../../src/scripts/eventlog';

const LINE = /^seq (\d{6}) {2}(\d{2}):(\d{2}):(\d{2}) {2}(ticket\.created|ticket\.assigned|ticket\.commented|ticket\.status|snapshot\.rebuilt)\s+#(\d+)/;

function rng(s = 3) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('nextLine', () => {
  const state = initialLogState();
  const rand = rng();
  const lines = Array.from({ length: 60 }, () => nextLine(state, rand));
  const parsed = lines.map((l) => l.match(LINE));

  it('formats every line as seq, clock, event type, ticket', () => {
    parsed.forEach((m, i) => expect(m, lines[i]).not.toBeNull());
  });

  it('increments the sequence number by exactly 1, starting at 018421', () => {
    expect(parsed.map((m) => Number(m![1]))).toEqual(Array.from({ length: 60 }, (_, i) => 18421 + i));
  });

  it('keeps the clock moving forward', () => {
    const secs = parsed.map((m) => Number(m![2]) * 3600 + Number(m![3]) * 60 + Number(m![4]));
    for (let i = 1; i < secs.length; i++) expect(secs[i]).toBeGreaterThan(secs[i - 1]);
  });

  it('gives each ticket.created a new, higher ticket number', () => {
    const created = parsed.filter((m) => m![5] === 'ticket.created').map((m) => Number(m![6]));
    expect(created.length).toBeGreaterThan(0);
    for (let i = 1; i < created.length; i++) expect(created[i]).toBe(created[i - 1] + 1);
    expect(created[0]).toBeGreaterThan(4127);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/eventlog.test.ts`
Expected: FAIL, because `eventlog` can't be resolved.

- [ ] **Step 3: Write `src/scripts/eventlog.ts`**

```ts
// Fake, append-only help-desk event stream for the decorative log behind the ticketing case.

export interface LogState {
  seq: number;
  ticket: number;
  /** Seconds since midnight. */
  t: number;
}

const USERS = ['m.garza', 'j.reyes', 'k.tran', 's.ortiz'] as const;
const KINDS = ['ticket.created', 'ticket.assigned', 'ticket.commented', 'ticket.status', 'snapshot.rebuilt'] as const;

export function initialLogState(): LogState {
  return { seq: 18420, ticket: 4127, t: 9 * 3600 + 14 * 60 };
}

const pad = (n: number, len: number) => String(n).padStart(len, '0');

export function nextLine(s: LogState, rand: () => number = Math.random): string {
  const int = (n: number) => Math.floor(rand() * n);
  const user = () => USERS[int(USERS.length)];

  s.seq += 1;
  s.t += 7 + int(40);
  const clock = `${pad(Math.floor(s.t / 3600) % 24, 2)}:${pad(Math.floor(s.t / 60) % 60, 2)}:${pad(s.t % 60, 2)}`;

  const kind = KINDS[int(KINDS.length)];
  let detail: string;
  switch (kind) {
    case 'ticket.created':
      s.ticket += 1;
      detail = `#${s.ticket}  by ${user()}`;
      break;
    case 'ticket.assigned':
      detail = `#${s.ticket - int(4)}  -> it-desk-${1 + int(3)}`;
      break;
    case 'ticket.commented':
      detail = `#${s.ticket - int(6)}  by ${user()}`;
      break;
    case 'ticket.status':
      detail = `#${s.ticket - int(9)}  open -> resolved`;
      break;
    case 'snapshot.rebuilt':
      detail = `#${s.ticket - 20}  from ${40 + int(60)} events`;
      break;
  }
  return `seq ${pad(s.seq, 6)}  ${clock}  ${kind.padEnd(18)} ${detail}`;
}
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `npm test`
Expected: PASS, with every unit test passing.

- [ ] **Step 5: Write the failing e2e tests**

`tests/e2e/eventlog.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('only the ticketing case has an event log, hidden from assistive tech', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-eventlog]')).toHaveCount(1);
  await expect(page.locator('#ticketing [data-eventlog]')).toHaveAttribute('aria-hidden', 'true');
});

test('appends lines while the case is on screen', async ({ page }) => {
  await page.goto('/');
  const lines = page.locator('#ticketing [data-eventlog-lines] > div');
  await expect(lines).toHaveCount(18);
  await page.locator('#ticketing').scrollIntoViewIfNeeded();
  await expect.poll(() => lines.count(), { timeout: 8000 }).toBeGreaterThan(18);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows the initial lines and never appends', async ({ page }) => {
    await page.goto('/');
    const lines = page.locator('#ticketing [data-eventlog-lines] > div');
    await page.locator('#ticketing').scrollIntoViewIfNeeded();
    await expect(lines).toHaveCount(18);
    await page.waitForTimeout(5000);
    await expect(lines).toHaveCount(18);
  });
});
```

- [ ] **Step 6: Run the e2e tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/eventlog.spec.ts`
Expected: FAIL, because `[data-eventlog]` has count 0.

- [ ] **Step 7: Write `src/components/EventLog.astro`**

```astro
---
---
<div class="caselog" aria-hidden="true" data-eventlog>
  <div class="caselog-inner" data-eventlog-lines></div>
</div>

<script>
  import { initialLogState, nextLine } from '../scripts/eventlog';

  const INITIAL_LINES = 18;
  const MAX_LINES = 30;
  const INTERVAL_MS = 2400;
  const LINE_HEIGHT = 21;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll<HTMLElement>('[data-eventlog]').forEach((box) => {
    const list = box.querySelector<HTMLElement>('[data-eventlog-lines]')!;
    const state = initialLogState();
    for (let i = 0; i < INITIAL_LINES; i++) {
      const line = document.createElement('div');
      line.textContent = nextLine(state);
      list.append(line);
    }

    let visible = false;
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }).observe(box);

    window.setInterval(() => {
      if (reduce.matches || !visible || document.visibilityState !== 'visible') return;
      const line = document.createElement('div');
      line.textContent = nextLine(state);
      line.className = 'new';
      list.append(line);
      // Slide the list up by one line.
      list.style.transition = 'none';
      list.style.transform = `translateY(${LINE_HEIGHT}px)`;
      void list.offsetHeight;
      list.style.transition = 'transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1)';
      list.style.transform = 'translateY(0)';
      window.setTimeout(() => line.classList.remove('new'), 1400);
      while (list.children.length > MAX_LINES) list.firstElementChild!.remove();
    }, INTERVAL_MS);
  });
</script>

<style>
  .caselog {
    position: absolute;
    inset: 0 0 0 40%;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 0 20px 20px 0;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 45%);
    mask-image: linear-gradient(90deg, transparent, #000 45%);
  }
  .caselog-inner {
    font: 11.5px/21px var(--mono);
    white-space: pre;
    color: var(--soft);
    opacity: 0.16;
  }
  .caselog-inner :global(div) { transition: color 2.4s ease, opacity 2.4s ease; }
  .caselog-inner :global(div.new) { color: var(--accent); opacity: 1; }

  @media (max-width: 820px) {
    .caselog { inset: 0; }
  }
</style>
```

- [ ] **Step 8: Render it from `src/components/ProjectCase.astro`**

In the frontmatter, replace:
```astro
import { Image } from 'astro:assets';
```
with:
```astro
import { Image } from 'astro:assets';
import EventLog from './EventLog.astro';
```

In the markup, replace:
```astro
<article class:list={['case', { flip }]} id={project.id} aria-labelledby={`${project.id}-title`}>
  {project.screenshot ? (
```
with:
```astro
<article class:list={['case', { flip }]} id={project.id} aria-labelledby={`${project.id}-title`}>
  {project.eventLog && <EventLog />}
  {project.screenshot ? (
```

- [ ] **Step 9: Run all the tests to verify they pass**

Run: `npm test && npm run test:e2e`
Expected: PASS, with every unit and e2e test passing.

- [ ] **Step 10: Commit**

```bash
git add src tests/unit/eventlog.test.ts tests/e2e/eventlog.spec.ts
git commit -m "feat: add faint event log behind the ticketing case study

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Share image, favicon, accessibility audit, JS budget

**Files:**
- Create: `public/favicon.svg`, `scripts/make-og.mjs`, `public/og.png` (generated), `scripts/check-budget.mjs`
- Test: `tests/e2e/quality.spec.ts`

**Interfaces:**
- Consumes: the finished page from Tasks 3–6; the meta tags already emitted by `Base.astro` (Task 3).
- Produces: `npm run og` (regenerates `public/og.png`) and `npm run budget` (fails when client JS exceeds 15 KB gzipped).

- [ ] **Step 1: Write the failing e2e tests**

`tests/e2e/quality.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('has canonical, description, and Open Graph tags', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://aiden-longoria.pages.dev/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^I build the full stack/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://aiden-longoria.pages.dev/og.png');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
});

test('serves the favicon and share image', async ({ request }) => {
  const icon = await request.get('/favicon.svg');
  expect(icon.status()).toBe(200);
  const og = await request.get('/og.png');
  expect(og.status()).toBe(200);
  expect(og.headers()['content-type']).toContain('image/png');
});

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 800 }]) {
  test(`has no axe violations at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/quality.spec.ts`
Expected: FAIL on `serves the favicon and share image` (404). If an axe test also fails, fix the violation it names in the owning component before moving on, since the spec requires zero violations.

- [ ] **Step 3: Write `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#02121a"/>
  <circle cx="24" cy="38" r="12" fill="#7fe0d4" fill-opacity=".85"/>
  <circle cx="42" cy="22" r="7" fill="#5cc8d6" fill-opacity=".6"/>
  <circle cx="46" cy="44" r="4" fill="#a8f0dc" fill-opacity=".5"/>
</svg>
```

- [ ] **Step 4: Write `scripts/make-og.mjs` and generate the image**

```js
// Screenshots the built hero at 1200x630 into public/og.png. Run after `npm run build`.
import { preview } from 'astro';
import { chromium } from '@playwright/test';

const PORT = 4399;
const server = await preview({ root: '.', server: { port: PORT }, logLevel: 'warn' });
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForFunction(() => Number(document.querySelector('[data-field]')?.getAttribute('data-frames')) > 90);
  await page.screenshot({ path: 'public/og.png' });
  await browser.close();
  console.log('wrote public/og.png');
} finally {
  await server.stop();
}
```

Run: `npm run build && npm run og`
Expected: prints `wrote public/og.png`. Open `public/og.png` and check that it shows the nav, the headline, and orbs on the underwater background, with nothing cut off mid-word in the headline.

- [ ] **Step 5: Write `scripts/check-budget.mjs`**

```js
// Fails when the client JavaScript in dist/ exceeds 15 KB gzipped (external .js files plus inline <script> bodies).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMIT = 15 * 1024;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

let total = 0;
for (const file of walk('dist')) {
  const ext = extname(file);
  if (ext === '.js') {
    total += gzipSync(readFileSync(file)).length;
  } else if (ext === '.html') {
    const html = readFileSync(file, 'utf8');
    for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/type="application\/(ld\+)?json"/.test(attrs) || !body.trim()) continue;
      total += gzipSync(body).length;
    }
  }
}

const kb = (n) => (n / 1024).toFixed(1);
console.log(`client JS: ${kb(total)} KB gzipped (limit ${kb(LIMIT)} KB)`);
if (total > LIMIT) {
  console.error('JS budget exceeded');
  process.exit(1);
}
```

Run: `npm run build && npm run budget`
Expected: `client JS: <n> KB gzipped (limit 15.0 KB)` with n well under 15, and exit code 0.

- [ ] **Step 6: Run the full suite**

Run: `npm test && npm run test:e2e`
Expected: PASS, with every unit and e2e test passing, including axe at both widths.

- [ ] **Step 7: Commit**

```bash
git add public scripts tests/e2e/quality.spec.ts
git commit -m "feat: add favicon, share image, axe audit, and JS budget check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: README, deploy to Cloudflare Pages, launch checks

**Files:**
- Create: `README.md`
- Modify (only if Cloudflare assigns a different hostname): `astro.config.mjs` (`site`), `tests/e2e/quality.spec.ts` (the two URL strings)

**Interfaces:**
- Consumes: the finished site.
- Produces: the live production URL.

- [ ] **Step 1: Write `README.md`**

```markdown
# Aiden Longoria · Portfolio

Single-page portfolio: link hub and project showcase. Astro 7, static, deployed on Cloudflare Pages.

## Edit content

Everything visible lives in `src/data/site.ts`.

- **Add a project:** append an entry to `projects`. It gets a hub tile and a case study automatically.
- **A project goes live:** set its `url`. Until then the page shows "Live link coming soon".
- **Add a screenshot:** put the image in `src/assets/projects/`, then in `site.ts` add
  `import shot from '../assets/projects/<file>.png';` and set `screenshot: shot` on the project.

## Develop

    npm install
    npm run dev          # http://localhost:4321
    npm test             # unit tests (Vitest)
    npm run test:e2e     # browser tests (Playwright; builds and previews the site)
    npm run budget       # after a build: client JS must stay under 15 KB gzipped
    npm run og           # after a build: regenerate public/og.png

## Leak guard

`tests/forbidden-terms.local.txt` (gitignored, never commit it) lists names that must never appear in
this public repo, one per line. `npm test` fails if any appear in `src/` or `public/`.

## Deploy

Cloudflare Pages builds `main` automatically: build command `npm run build`, output `dist`,
environment variable `NODE_VERSION=22.14.0`. Pull requests get preview URLs.
```

- [ ] **Step 2: Create the local leak-guard file (Aiden)**

Aiden creates `tests/forbidden-terms.local.txt` with the real restaurant names, their old Pages hostnames, the town, and the street, one per line. Then:

Run: `npm test`
Expected: PASS, with the leak guard **running** (not skipped) and passing. Check that the file is ignored with `git status --short`: it must not be listed.

- [ ] **Step 3: Commit and push**

```bash
git add README.md
git commit -m "docs: add README with content editing and deploy notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 4: Create the Cloudflare Pages project (Aiden, in the dashboard)**

Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → `AidenL0/portfolio`.
- Project name: `aiden-longoria`
- Production branch: `main`
- Framework preset: Astro. Build command: `npm run build`. Output directory: `dist`.
- Environment variable: `NODE_VERSION` = `22.14.0`

Save and deploy. Expected: the build succeeds, and the site is live at `https://aiden-longoria.pages.dev`.

- [ ] **Step 5: If Cloudflare assigned a different hostname, update it**

Only if the production URL isn't `https://aiden-longoria.pages.dev`: replace that origin with the real one in `astro.config.mjs` (`site`) and in both URL strings in `tests/e2e/quality.spec.ts`. Then run:
```bash
npm run build && npm run og && npm test && npm run test:e2e
git add astro.config.mjs tests/e2e/quality.spec.ts public/og.png
git commit -m "chore: point canonical URL at the assigned Pages hostname

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```
Expected: all tests pass, and Cloudflare redeploys.

- [ ] **Step 6: Launch checks on the live URL**

- In Chrome DevTools → Lighthouse, run a Mobile audit of the production URL. Expected: Performance ≥ 95 and Accessibility = 100. If Performance is lower, check the report's top opportunity (likely font preloading or canvas work) and fix it in a follow-up commit.
- Paste the production URL into the LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/). Expected: the card shows the title, description, and `og.png`.
- On a real phone: orbs rise, a social tap shows the gather pulse and opens the profile in a new tab, and the page doesn't scroll sideways.
```
