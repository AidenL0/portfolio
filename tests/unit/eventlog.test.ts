import { describe, it, expect } from 'vitest';
import { initialLogState, nextLine } from '../../src/scripts/eventlog';

const LINE = /^seq (\d{6}) {2}(\d{2}):(\d{2}):(\d{2}) {2}(ticket\.created|ticket\.assigned|ticket\.commented|ticket\.status|snapshot\.rebuilt)\s+#(\d+)/;

function rng(s = 3) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('nextLine', () => {
  const state = initialLogState();
  const rand = rng();
  const lines = Array.from({ length: 60 }, () => nextLine(state, rand));
  const parsed = lines.map((l) => l.match(LINE));

  it('formats every line as seq, clock, event type, ticket', () => {
    parsed.forEach((m, i) => expect(m, lines[i]).not.toBeNull());
  });

  it('increments the sequence number by exactly 1, starting at 018421', () => {
    expect(parsed.map((m) => Number(m![1]))).toEqual(Array.from({ length: 60 }, (_, i) => 18421 + i));
  });

  it('keeps the clock moving forward', () => {
    const secs = parsed.map((m) => Number(m![2]) * 3600 + Number(m![3]) * 60 + Number(m![4]));
    for (let i = 1; i < secs.length; i++) expect(secs[i]).toBeGreaterThan(secs[i - 1]);
  });

  it('gives each ticket.created a new, higher ticket number', () => {
    const created = parsed.filter((m) => m![5] === 'ticket.created').map((m) => Number(m![6]));
    expect(created.length).toBeGreaterThan(0);
    for (let i = 1; i < created.length; i++) expect(created[i]).toBe(created[i - 1] + 1);
    expect(created[0]).toBeGreaterThan(4127);
  });
});
