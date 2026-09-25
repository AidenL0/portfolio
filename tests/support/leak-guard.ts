// Finds forbidden terms (real business names, town, street) anywhere in the repo's text files.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

export const TERMS_FILE = 'tests/forbidden-terms.local.txt';
const SKIP_FILES = new Set([TERMS_FILE, 'package-lock.json']);
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.pdf']);

/** Lowercases and strips accents, so "Taquería" and "taqueria" compare equal. */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Every tracked or new, non-ignored text file in the repo, as forward-slash paths. */
export function repoTextFiles(): string[] {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' });
  return out
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((f) => !SKIP_FILES.has(f) && !BINARY_EXT.has(extname(f).toLowerCase()));
}

/** One entry per (file, term) match. Reports the term's line number, never the term itself. */
export function findLeaks(files: string[], terms: string[], read: (file: string) => string = (f) => readFileSync(f, 'utf8')): string[] {
  const folded = terms.map(fold);
  const hits: string[] = [];
  for (const file of files) {
    const text = fold(read(file));
    folded.forEach((term, i) => {
      if (text.includes(term)) hits.push(`${file} contains forbidden term #${i + 1}`);
    });
  }
  return hits;
}
