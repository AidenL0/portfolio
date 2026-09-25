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
