// Site-wide "pause motion" switch (WCAG 2.2.2). State lives on <html data-motion>, is remembered in
// localStorage, and is announced with a `motionchange` event so the canvas and the event log can react.

const STORAGE_KEY = 'motion-paused';
export const MOTION_EVENT = 'motionchange';

export function motionPaused(): boolean {
  return document.documentElement.dataset.motion === 'paused';
}

export function setMotionPaused(paused: boolean): void {
  document.documentElement.dataset.motion = paused ? 'paused' : 'on';
  try {
    localStorage.setItem(STORAGE_KEY, paused ? '1' : '0');
  } catch {
    // Storage can be blocked (private mode, site-data settings); the switch still works for this visit.
  }
  window.dispatchEvent(new Event(MOTION_EVENT));
}

/** Wires the toggle button: its label always names the action it will take. */
export function initMotionToggle(button: HTMLButtonElement): void {
  const render = () => {
    button.textContent = motionPaused() ? 'Play motion' : 'Pause motion';
  };
  button.addEventListener('click', () => {
    setMotionPaused(!motionPaused());
    render();
  });
  render();
}
