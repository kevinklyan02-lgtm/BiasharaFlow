import { useState, type FormEvent } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { Button, Card, PageHeader } from '@/components/ui';
import { useTrader } from '@/features/traders/TraderContext';
import { DEMO_PHONES, USSD_SERVICE_CODE } from '@/lib/catalog';
import { useUssdSession } from './useUssdSession';

export function UssdPage() {
  const { trader } = useTrader();
  const phone = DEMO_PHONES[trader.trader_id];
  const session = useUssdSession(phone ?? '', trader.trader_id);
  const [value, setValue] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value) return;
    session.send(value);
    setValue('');
  }

  return (
    <>
      <PageHeader
        title="USSD Phone"
        subtitle="A feature-phone view of the same service. It calls the same /ussd handler the Africa's Talking sandbox uses."
      />
      <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[22rem] rounded-[2rem] border-4 border-slate-800 bg-slate-900 p-4 shadow-xl">
          <p className="mb-2 text-center text-xs text-slate-400">
            {phone ?? 'No demo number'} · {USSD_SERVICE_CODE}
          </p>
          <div
            aria-label="Phone screen"
            aria-live="polite"
            className="min-h-64 whitespace-pre-wrap rounded-lg bg-lime-100 p-3 font-mono text-sm text-slate-900"
          >
            {session.screen ? (
              session.screen.text || ' '
            ) : (
              <span className="text-slate-500">Press Dial to start.</span>
            )}
            {session.screen?.kind === 'END' && (
              <p className="mt-3 border-t border-slate-400/40 pt-2 text-xs text-slate-600">
                Session ended.
              </p>
            )}
          </div>

          {session.active ? (
            <form onSubmit={onSubmit} className="mt-3 flex gap-2">
              <input
                aria-label="USSD input"
                inputMode="numeric"
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
                className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-white px-3 py-2 font-mono"
              />
              <Button type="submit" loading={session.busy} disabled={!value}>
                Send
              </Button>
            </form>
          ) : (
            <Button
              className="mt-3 w-full"
              loading={session.busy}
              disabled={!phone}
              onClick={session.dial}
            >
              <Phone className="h-4 w-4" aria-hidden />
              {session.screen ? 'Dial again' : 'Dial'}
            </Button>
          )}
          {session.active && (
            <button
              type="button"
              onClick={session.hangUp}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              <PhoneOff className="h-4 w-4" aria-hidden />
              Cancel
            </button>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <h3 className="font-semibold text-slate-900">Try it</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
              <li>Press Dial to see the main menu.</li>
              <li>
                Type <code className="rounded bg-slate-100 px-1">2</code> for a restock loan, then{' '}
                <code className="rounded bg-slate-100 px-1">1</code> to pick an amount.
              </li>
              <li>
                Type <code className="rounded bg-slate-100 px-1">1</code> to accept the terms. The
                loan appears on the dashboard.
              </li>
            </ol>
            <p className="mt-3 text-xs text-slate-500">
              Switching trader in the top bar changes the phone number. All figures are simulated.
            </p>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900">Request log</h3>
            <p className="mt-1 text-xs text-slate-500">
              What the phone sent (<code>text</code>) and what the backend answered. Useful when
              checking the handler.
            </p>
            {session.log.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Nothing sent yet.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {session.log.map((l, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-2 font-mono text-xs">
                    <span className="text-slate-500">text=</span>
                    <span className="font-semibold">{l.text === '' ? '(empty)' : l.text}</span>
                    <pre className="mt-1 whitespace-pre-wrap text-slate-700">{l.reply}</pre>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
