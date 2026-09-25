// Fake, append-only help-desk event stream for the decorative log behind the ticketing case.

export interface LogState {
  seq: number;
  ticket: number;
  /** Seconds since midnight. */
  t: number;
}

const USERS = ['m.garza', 'j.reyes', 'k.tran', 's.ortiz'] as const;
const KINDS = ['ticket.created', 'ticket.assigned', 'ticket.commented', 'ticket.status', 'snapshot.rebuilt'] as const;

export function initialLogState(): LogState {
  return { seq: 18420, ticket: 4127, t: 9 * 3600 + 14 * 60 };
}

const pad = (n: number, len: number) => String(n).padStart(len, '0');

export function nextLine(s: LogState, rand: () => number = Math.random): string {
  const int = (n: number) => Math.floor(rand() * n);
  const user = () => USERS[int(USERS.length)];

  s.seq += 1;
  s.t += 7 + int(40);
  const clock = `${pad(Math.floor(s.t / 3600) % 24, 2)}:${pad(Math.floor(s.t / 60) % 60, 2)}:${pad(s.t % 60, 2)}`;

  const kind = KINDS[int(KINDS.length)];
  let detail: string;
  switch (kind) {
    case 'ticket.created':
      s.ticket += 1;
      detail = `#${s.ticket}  by ${user()}`;
      break;
    case 'ticket.assigned':
      detail = `#${s.ticket - int(4)}  -> it-desk-${1 + int(3)}`;
      break;
    case 'ticket.commented':
      detail = `#${s.ticket - int(6)}  by ${user()}`;
      break;
    case 'ticket.status':
      detail = `#${s.ticket - int(9)}  open -> resolved`;
      break;
    case 'snapshot.rebuilt':
      detail = `#${s.ticket - 20}  from ${40 + int(60)} events`;
      break;
  }
  return `seq ${pad(s.seq, 6)}  ${clock}  ${kind.padEnd(18)} ${detail}`;
}
