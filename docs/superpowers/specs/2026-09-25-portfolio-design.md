# Portfolio Site — Design Spec

**Date:** 2026-09-25
**Owner:** Aiden Longoria (GitHub: AidenL0)
**Repo:** https://github.com/AidenL0/portfolio (public)
**Visual reference:** [`2026-09-25-portfolio-mockup.html`](./2026-09-25-portfolio-mockup.html) (approved mockup, "Abyss" direction). Where this spec and the mockup disagree, this spec wins.

## 1. Purpose

A single landing page that is the first thing recruiters, hiring managers, and potential clients see. It has two jobs:

1. **Link hub** (top of page): one screen with who Aiden is, his three socials, and his live projects.
2. **Portfolio** (below): a short write-up of each project for anyone who keeps reading.

Success criteria:

- The design is distinctive and memorable, with ambient motion that never distracts or causes discomfort.
- Positioning covers all of Aiden's work, both small-business sites and systems work, and doesn't lean on any single project.
- No real names, logos, or contact details of the restaurants the demo sites were based on.
- Adding or updating a project means editing one data file.

## 2. Content

### Identity

- **Name:** Aiden Longoria
- **Eyebrow:** `Software Engineer · Texas A&M–Kingsville ’27`
- **Headline:** `From storefront sites` + *`to systems of record.`* (second phrase in italic accent)
- **Lede:** `I build the full stack: fast websites for small businesses and the software that runs behind them. Open to full-time roles starting summer 2027.`
- No photo of Aiden anywhere on the page.

### Socials (exactly these three, in this order)

| Label | Handle shown | URL |
|---|---|---|
| GitHub | AidenL0 | https://github.com/AidenL0 |
| LinkedIn | aiden-longoria | https://linkedin.com/in/aiden-longoria-4329a4366 |
| Handshake | profile | https://app.joinhandshake.com/profiles/tummy_ache_surviver |

### Projects (in this order)

| Display name | Category | Stack | URL | Notes |
|---|---|---|---|---|
| Event-sourced ticketing platform (hub tile: "Northwind Helpdesk") | Systems | Next.js, TypeScript, PostgreSQL, Windows Server | https://northwind-helpdesk.up.railway.app | `eventLog: true` |
| La Esquina Taqueria | Small business | Astro, Cloudflare Pages, Stripe | *pending* | Generic name for a real small-town Mexican restaurant |
| Fourth Quarter Cafe | Small business | Astro, Cloudflare Pages | *pending* | Generic name for a real small-town sports cafe |

Descriptions:

- **Ticketing:** A help desk that stores every state change as an append-only event, so any ticket's full history can be reconstructed. Built with government records compliance in mind.
- **La Esquina Taqueria:** A fast, edge-deployed site for a family Mexican restaurant, with Stripe checkout and signature-verified payment webhooks.
- **Fourth Quarter Cafe:** Menu, hours, gallery, and directions for a sports cafe serving smoothies, açaí bowls, and made-to-order food.

The restaurants' real names, their old Pages URLs (which contain those names), their town, and their addresses must **never** appear on the site, in page metadata, or anywhere in this public repo, including docs and tests.

## 3. Visual design

### Tokens

| Token | Value | Use |
|---|---|---|
| `--deep` | `#02121a` | Lower background |
| `--mid` | `#073443` | Mid background |
| `--glow` | `#0f5d6e` | Top-of-page light |
| `--abyss` | `#010a0f` | Bottom of page |
| `--ink` | `#dff4f2` | Primary text |
| `--soft` | `#8fbfc0` | Secondary text |
| `--accent` | `#7fe0d4` | Accent, focus ring, italic headline |

Background: `radial-gradient(120% 55% at 30% -8%, glow 0%, mid 30%, deep 62%, abyss 100%)`.
Glass panels: fill `rgba(170,240,235,.06)`, border `rgba(170,240,235,.16)`, radius 18px, `backdrop-filter: blur(10px)`.

The page uses a single dark theme on purpose: it is an underwater scene, and there is no light mode.

### Type

- **Display:** Instrument Serif (headline, nav name, project titles, section headings)
- **Body/UI:** IBM Plex Sans 400/500/600
- **Utility:** JetBrains Mono 400 (event log, small labels)
- Fonts are self-hosted through the Fontsource npm packages (`@fontsource/instrument-serif`, `@fontsource/ibm-plex-sans`, `@fontsource/jetbrains-mono`), bundled by Astro, with no runtime requests to Google.

### Layout

1. Nav: name on the left (italic serif); `Projects / About / Contact` on the right, hidden under 820px. `About` and `Contact` scroll to the lede and the "Find me" panel.
2. Hero: eyebrow, headline, lede, max-width about 800px.
3. Link hub: two glass panels in a 1:2 grid. The left panel is "Find me" (socials); the right is "Live projects" (three tiles that link to `#<project-id>`).
4. Projects section: a "Projects" heading, then one case card per project. Cards alternate screenshot left and right, and the ticketing card has the event log behind it.
5. Under 820px everything stacks into one column.

## 4. Motion and interaction

All values come from the approved mockup settings: **Look: Soft orbs · Movement: Rising · Social hover: Particles gather · Project hover: Spotlight.**

### Particle field (`particles.ts`)

- One `<canvas>` behind the whole page (hero plus projects), with `pointer-events: none` and `aria-hidden="true"`.
- **Count:** `min(70, area / 16000)`, halved when the device has no hover support (`(hover: none)`).
- **Particle:** depth `z ∈ [0,1)`, radius `3 + z²·22`, tint picked from `[127,224,212] [92,200,214] [168,240,220] [70,160,180]`. Alpha is `.12 + z·.42`. Far orbs (low `z`) get soft edges through a radial gradient.
- **Rising:** each particle has a home point that rises at `.12 + z·.35` px/frame with a sine sway. When the home point passes above the top, the particle wraps to the bottom with a new random x. Particles fade out in the top 8% of the canvas.
- **Spring:** velocity += (home − pos) · `k` per frame, with `k = .012`. Damping is `0.9` per frame.
- **Cursor repel:** within 140px, push away with force `(1 − d/140) · 1.4 · (.5 + z)`. Repel is off while a gather attractor is active.
- **Gather:** while a social link is hovered or focused, its center becomes an elliptical attractor with radii `(w/2 + 14, h/2 + 12)`. Using normalized distance `d`, particles with `d < 5` get pull `(d − 1) · −.35 · (1 − d/5)` plus a tangential swirl of `.05`, and they are marked *captured*: their spring drops to `k = 0` and their home point stops rising, so they settle on the ring (`d ≈ 1`) regardless of how far away home was. The result is a slowly circling halo. Releasing the link clears *captured*, and the normal spring (`k = .012`) brings each particle back to its home point, which never drifted away. (This amends the mockup, which used `k = .0015`; there, particles with distant homes stalled well outside the ring.)
- **Touch:** on `pointerdown` on a social link (hover: none), run a 600ms gather pulse and then follow the link normally. The pulse never delays navigation.
- **Frame loop:** use `requestAnimationFrame` with `dt` normalized to 60fps and capped at 3. The loop runs only while the canvas intersects the viewport and `document.visibilityState === 'visible'`.
- **Resize:** a `ResizeObserver` re-seeds the field and caps the device pixel ratio at 2.
- The physics (step, spring, repel, attractor, seeding) lives in pure functions, separate from the canvas drawing, so it can be unit tested.

### Other motion

- **Caustics and rays:** CSS-only, 22s and 16s alternate loops at the top of the page (values as in the mockup).
- **Event log (`EventLog.astro`):** faint monospace lines behind the right side of the ticketing card, masked on the left. It appends one line every 2.4s. The new line shows in the accent color and fades to the base color over 2.4s, and the list slides up by one line over 0.9s. It keeps at most 30 lines and runs only while the card is visible. Line types: `ticket.created`, `ticket.assigned`, `ticket.commented`, `ticket.status`, `snapshot.rebuilt`, with fake sequence numbers, clock times, and usernames.
- **Social links:** the lighter gather treatment adds an accent underline (scaleX 0→1, 0.55s, 40% opacity) and slides in a `↗` arrow.
- **Project tiles (spotlight):** a 220px radial glow follows the cursor (`--x`/`--y` custom properties), the border brightens to `rgba(127,224,212,.5)`, and a `↘` arrow slides in. There is no translate or tilt.
- Focus-visible triggers the same effects as hover everywhere.

### Reduced motion (`prefers-reduced-motion: reduce`)

- Particles: seed and draw exactly one static frame, with no loop, repel, or gather.
- Caustics, rays, and event log: static (the log shows its initial lines and never appends).
- Hover effects: color and border changes only; no sliding arrows or scaling underlines (they appear instantly).

## 5. Accessibility

- Every link has a visible 2px accent focus ring.
- The canvas, event log, and decorative arrows use `aria-hidden="true"`.
- Social links have accessible names like "GitHub, AidenL0".
- All external links (socials, live project URLs) open in a new tab with `rel="noopener noreferrer"`. In-page links (nav, hub tiles) do not.
- Text contrast meets WCAG AA against the darkest background behind it; `--soft` on `--deep` must be at least 4.5:1.
- Heading order: `h1` is the headline, `h2` "Projects", and `h3` each project name.

## 6. Architecture

```
portfolio/
├─ src/
│  ├─ data/site.ts           content: identity, socials, projects (typed)
│  ├─ assets/projects/       screenshots (optimized by astro:assets)
│  ├─ components/
│  │  ├─ Hero.astro
│  │  ├─ LinkHub.astro
│  │  ├─ ProjectCase.astro
│  │  └─ EventLog.astro
│  ├─ scripts/
│  │  ├─ particles/physics.ts   pure functions (tested)
│  │  ├─ particles/field.ts     canvas, loop, observers, DOM wiring
│  │  └─ hover.ts               spotlight --x/--y tracking
│  ├─ styles/tokens.css
│  ├─ layouts/Base.astro        <head>, meta, OG tags, fonts
│  └─ pages/index.astro
├─ public/                      favicon, og.png
├─ tests/
│  ├─ unit/                     Vitest
│  └─ e2e/                      Playwright
└─ docs/superpowers/specs/
```

### Data model (`site.ts`)

```ts
type Social = { label: string; handle: string; url: string };
type Project = {
  id: string;                 // anchor id, e.g. "ticketing"
  name: string;               // case-study title
  tileName?: string;          // shorter hub-tile name (defaults to name)
  tileBlurb: string;          // one line under the tile name
  category: 'Systems' | 'Small business';
  description: string;
  stack: string[];
  url?: string;               // absent → "Live link coming soon"
  screenshot?: ImageMetadata; // absent → styled placeholder
  eventLog?: boolean;
};
```

- The hub tiles and case cards are both generated from `projects`.
- A project with no `url` shows the non-link text "Live link coming soon" instead of a link.
- A project with no `screenshot` shows the mockup's styled placeholder.
- The page renders fully static, with no framework runtime. Client JS is limited to `field.ts` + `physics.ts` + `hover.ts` + the event log script, all bundled by Astro, with a budget of under 15 KB gzipped.

## 7. SEO and sharing

- `<title>Aiden Longoria · Software Engineer</title>`, plus a meta description built from the lede.
- Open Graph and Twitter card tags with `og.png` (1200×630, the hero on the underwater background, no photo).
- Canonical URL is the production Pages URL.

## 8. Deployment

- A new Cloudflare Pages project connected to `AidenL0/portfolio`: production branch `main`, build command `npm run build`, output `dist`. Preferred project name `aiden-longoria` → `aiden-longoria.pages.dev`; fall back to a close variant if taken.
- Pull requests get automatic preview deployments.
- All external references (résumé, LinkedIn, Handshake) use the **production** URL, never a hash deployment URL.
- The old `portfolio-tmc` project is left untouched until Aiden retires it.

### Restaurant URL migration (Aiden's task, outside this build)

1. In each restaurant repo, remove the logos and replace the real business name, address, phone, Facebook link, and map embed with placeholders.
2. Create new Pages projects (for example `la-esquina`, `fourth-quarter-cafe`) from those repos and check them.
3. Add the new URLs to `site.ts` and push.
4. Once nothing points to them, delete the old restaurant Pages projects.

## 9. Testing

**Unit (Vitest), `physics.ts`:**
- A displaced particle returns to within 1px of home after N steps with no forces.
- Cursor repel moves a particle within 140px away from the cursor, and has no effect beyond 140px.
- With an attractor active, particles that start inside `d < 5` settle near the ring (`d ≈ 1 ± 0.5`) after N steps. Once the attractor is released, they head back home.
- Seeding respects the count formula and the touch halving.

**Unit (Vitest), `site.ts`:**
- Exactly three socials, in order GitHub, LinkedIn, Handshake, with the URLs in §2.
- Every project `url` is `https://` or absent. Project ids are unique.
- Leak guard: the test reads forbidden terms (real business names, town, street) from `tests/forbidden-terms.local.txt`, one per line. That file is **gitignored** so the terms never enter the public repo. The test scans every text file git would publish (tracked plus new, non-ignored files; skipping the terms file, the lockfile, and binaries), ignoring case and accents, and fails on any match. If the file is absent (for example in CI), the test is skipped with a warning.

**E2E (Playwright), against `astro preview`:**
- The page loads with the `h1` headline visible.
- The three social links have the exact hrefs listed in §2.
- Projects without a URL show "Live link coming soon" and render no link.
- The hub tiles link to their case anchors.
- With reduced motion emulated, the canvas draws once and the event log line count doesn't change over 5s.
- At a 375px viewport, `document.documentElement.scrollWidth <= 375`.
- `@axe-core/playwright` reports zero violations.

**Manual, once before launch:** a Lighthouse mobile run on the preview deploy, with Performance ≥ 95 and Accessibility = 100.

## 10. Out of scope

- The ticketing system's promo page (the "Record" direction from brainstorming; next project).
- Contact form, blog, analytics, custom domain.
- Anonymizing the restaurant sites themselves (Aiden's checklist in §8).
