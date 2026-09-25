import { describe, it, expect } from 'vitest';
import { projects, withLiveUrls, type Project } from '../../src/data/site';

const base: Project = {
  id: 'demo',
  name: 'Demo',
  tileBlurb: 'Demo site',
  category: 'Small business',
  description: 'A demo.',
  stack: ['Astro'],
  liveUrlEnv: 'DEMO_URL',
};

describe('withLiveUrls', () => {
  it('fills url from the named env var and hides the hostname', () => {
    const [p] = withLiveUrls([base], { DEMO_URL: 'https://demo-site.pages.dev/' });
    expect(p.url).toBe('https://demo-site.pages.dev/');
    expect(p.hideHost).toBe(true);
  });

  it('leaves the project pending when the env var is missing, blank, invalid, or not https', () => {
    for (const value of [undefined, '', '   ', 'not a url', 'http://demo-site.pages.dev']) {
      const [p] = withLiveUrls([base], { DEMO_URL: value });
      expect(p.url, String(value)).toBeUndefined();
    }
  });

  it('leaves projects without liveUrlEnv untouched', () => {
    const fixed: Project = { ...base, liveUrlEnv: undefined, url: 'https://fixed.example.com' };
    const [p] = withLiveUrls([fixed], { DEMO_URL: 'https://other.example.com' });
    expect(p).toEqual(fixed);
  });

  it('does not mutate its input', () => {
    const input = [{ ...base }];
    withLiveUrls(input, { DEMO_URL: 'https://demo-site.pages.dev' });
    expect(input[0].url).toBeUndefined();
  });
});

describe('restaurant projects', () => {
  it('read their live URLs from Cloudflare env vars, never from the repo', () => {
    expect(projects.find((p) => p.id === 'la-esquina')?.liveUrlEnv).toBe('LA_ESQUINA_URL');
    expect(projects.find((p) => p.id === 'fourth-quarter')?.liveUrlEnv).toBe('FOURTH_QUARTER_URL');
  });
});
