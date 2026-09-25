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
