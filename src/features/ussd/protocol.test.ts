import { describe, expect, it } from 'vitest';
import { parseUssd, toUssdText } from './protocol';

describe('ussd protocol', () => {
  it('strips the CON prefix and keeps the session open', () => {
    expect(parseUssd('CON Welcome\n1. My limit')).toEqual({
      kind: 'CON',
      text: 'Welcome\n1. My limit',
    });
  });

  it('strips the END prefix', () => {
    expect(parseUssd('END Goodbye')).toEqual({ kind: 'END', text: 'Goodbye' });
  });

  it('treats an unknown reply as an ended session with a message', () => {
    expect(parseUssd('<html>502</html>')).toEqual({
      kind: 'END',
      text: 'Unexpected reply from the server.',
    });
  });

  it('handles a bare prefix', () => {
    expect(parseUssd('END')).toEqual({ kind: 'END', text: '' });
  });

  it('joins inputs with an asterisk', () => {
    expect(toUssdText([])).toBe('');
    expect(toUssdText(['2', '1', '1'])).toBe('2*1*1');
  });
});
