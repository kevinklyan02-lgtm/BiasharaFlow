export interface UssdScreen {
  /** CON keeps the session open and expects input; END closes it. */
  kind: 'CON' | 'END';
  text: string;
}

/** Splits "CON ..." / "END ..." into a kind and the text to display. */
export function parseUssd(reply: string): UssdScreen {
  const m = /^(CON|END)(?: ([\s\S]*)|)$/.exec(reply.trim());
  if (!m) return { kind: 'END', text: 'Unexpected reply from the server.' };
  return { kind: m[1] as 'CON' | 'END', text: m[2] ?? '' };
}

/** Inputs so far, joined by an asterisk, as the Africa's Talking gateway sends them. */
export const toUssdText = (inputs: string[]) => inputs.join('*');
