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
