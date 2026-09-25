// Captures the project screenshots into src/assets/projects/.
// Restaurant sites are redacted before capture: logos, map embeds, contact links, and every element whose own text
// matches a term in tests/forbidden-terms.local.txt are blurred, and the capture aborts if any match is left sharp.
//
// Usage: LA_ESQUINA_URL=https://... FOURTH_QUARTER_URL=https://... npm run shots
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';

const OUT_DIR = 'src/assets/projects';
const TERMS_FILE = 'tests/forbidden-terms.local.txt';
const VIEWPORT = { width: 1440, height: 900 }; // 16:10, matching the case-study frame

const targets = [
  { id: 'ticketing', url: 'https://northwind-helpdesk.up.railway.app/', redact: false },
  { id: 'la-esquina', url: process.env.LA_ESQUINA_URL, redact: true },
  // The hero photo has the business name printed on the product labels, which text matching can't see.
  { id: 'fourth-quarter', url: process.env.FOURTH_QUARTER_URL, redact: true, blur: ['img[src*="smoothies"]'] },
];

const terms = existsSync(TERMS_FILE)
  ? readFileSync(TERMS_FILE, 'utf8').split(/\r?\n/).map((t) => t.trim()).filter(Boolean)
  : [];

/** Runs in the page: blurs identifying content, then returns any matching text still left sharp. */
function redact({ terms, extra }) {
  const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const folded = terms.map(fold);
  const matches = (s) => folded.some((t) => fold(s).includes(t));
  const blur = (el) => el.style.setProperty('filter', 'blur(10px)', 'important');
  const isBlurred = (el) => {
    for (let e = el; e; e = e.parentElement) if (getComputedStyle(e).filter.includes('blur')) return true;
    return false;
  };

  document
    .querySelectorAll('img[src*="logo" i], img[alt*="logo" i], iframe, address, a[href^="tel:"], a[href*="facebook"], a[href*="maps"]')
    .forEach(blur);
  extra.forEach((selector) => document.querySelectorAll(selector).forEach(blur));

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.parentElement && matches(n.textContent)) hits.push(n.parentElement);
  hits.forEach(blur);

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  return hits.filter((el) => visible(el) && !isBlurred(el)).length;
}

const pending = targets.filter((t) => t.url);
if (pending.some((t) => t.redact) && terms.length === 0) {
  console.error(`Refusing to capture restaurant sites without ${TERMS_FILE}: nothing to redact against.`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
try {
  for (const t of targets) {
    if (!t.url) {
      console.log(`skip ${t.id}: no URL set`);
      continue;
    }
    const page = await browser.newPage({ viewport: VIEWPORT });
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 90_000 });
    await page.waitForTimeout(1200); // let entrance animations and web fonts settle
    if (t.redact) {
      const leftover = await page.evaluate(redact, { terms, extra: t.blur ?? [] });
      if (leftover > 0) throw new Error(`${t.id}: ${leftover} matching element(s) still unblurred`);
    }
    await page.screenshot({ path: `${OUT_DIR}/${t.id}.jpg`, type: 'jpeg', quality: 82 });
    console.log(`wrote ${OUT_DIR}/${t.id}.jpg`);
    await page.close();
  }
} finally {
  await browser.close();
}
