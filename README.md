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
this public repo, one per line. `npm test` fails if any appear in any file git would publish (case- and accent-insensitive).
Without that file the check is skipped; you'll see `1 skipped` in the test summary.

## Deploy

Cloudflare Pages builds `main` automatically: build command `npm run build`, output `dist`,
environment variable `NODE_VERSION=22.14.0`. Pull requests get preview URLs.
