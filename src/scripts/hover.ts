/** Keeps `--x`/`--y` on each `[data-spotlight]` element at the cursor position, as percentages, for the CSS glow. */
export function trackSpotlight(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--y', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
}
