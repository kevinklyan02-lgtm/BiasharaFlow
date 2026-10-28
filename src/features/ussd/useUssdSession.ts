import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { qk } from '@/api/keys';
import { userMessage } from '@/api/errors';
import { USSD_SERVICE_CODE } from '@/lib/catalog';
import { parseUssd, toUssdText, type UssdScreen } from './protocol';

export interface LogEntry {
  text: string;
  reply: string;
}

/**
 * One phone session. Each key press re-sends the whole input history in `text`, exactly like the
 * real gateway, so the backend handler stays stateless.
 */
export function useUssdSession(phoneNumber: string, traderId: number) {
  const api = useApi();
  const qc = useQueryClient();
  const [inputs, setInputs] = useState<string[]>([]);
  const [screen, setScreen] = useState<UssdScreen | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const sessionId = useRef('');

  const request = useCallback(
    async (next: string[]) => {
      setBusy(true);
      const text = toUssdText(next);
      try {
        const reply = await api.ussd({
          sessionId: sessionId.current,
          serviceCode: USSD_SERVICE_CODE,
          phoneNumber,
          text,
        });
        setInputs(next);
        setScreen(parseUssd(reply));
        setLog((l) => [...l, { text, reply }]);
        // The phone can create loans, check-ins and disputes; refresh the dashboard data.
        void qc.invalidateQueries({ queryKey: qk.trader(traderId) });
      } catch (e) {
        setScreen({ kind: 'END', text: userMessage(e) });
      } finally {
        setBusy(false);
      }
    },
    [api, phoneNumber, qc, traderId],
  );

  const dial = useCallback(() => {
    sessionId.current = `sess-${Date.now()}`;
    setLog([]);
    void request([]);
  }, [request]);

  const send = useCallback((input: string) => void request([...inputs, input]), [request, inputs]);

  const hangUp = useCallback(() => {
    setInputs([]);
    setScreen(null);
  }, []);

  // A different trader means a different phone: drop the old session.
  useEffect(() => {
    hangUp();
    setLog([]);
  }, [phoneNumber, hangUp]);

  return { screen, log, busy, active: screen?.kind === 'CON', dial, send, hangUp };
}
