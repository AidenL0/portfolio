import { describe, it, expect } from 'vitest';
import { findLeaks, fold, repoTextFiles } from '../support/leak-guard';

describe('leak guard helpers', () => {
  it('folds case and accents so "Taquería" matches "taqueria"', () => {
    expect(fold('Taquería ÉL')).toBe('taqueria el');
  });

  it('scans the whole repo, not just src/ and public/', () => {
    const files = repoTextFiles();
    expect(files).toContain('README.md');
    expect(files).toContain('astro.config.mjs');
    expect(files.some((f) => f.startsWith('docs/'))).toBe(true);
    expect(files.some((f) => f.startsWith('tests/'))).toBe(true);
  });

  it('skips the terms file itself, the lockfile, and binaries', () => {
    const files = repoTextFiles();
    expect(files).not.toContain('tests/forbidden-terms.local.txt');
    expect(files).not.toContain('package-lock.json');
    expect(files.some((f) => f.endsWith('.png'))).toBe(false);
  });

  it('reports a hit by file and term number, never the term itself', () => {
    const hits = findLeaks(['README.md'], ['cloudflare pages builds'], () => 'Cloudflare Pages builds `main`');
    expect(hits).toEqual(['README.md contains forbidden term #1']);
  });
});
