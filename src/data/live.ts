// Build-time view of the projects with env-sourced live URLs applied (Cloudflare Pages env vars, or a shell env).
import { projects, withLiveUrls } from './site';

export const liveProjects = withLiveUrls(projects, { ...import.meta.env, ...process.env });
