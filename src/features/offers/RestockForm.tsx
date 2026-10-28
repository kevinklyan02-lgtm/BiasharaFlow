import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { isApiError, userMessage } from '@/api/errors';
import { Button, Card } from '@/components/ui';
import { formatKes } from '@/lib/format';
import { useCreateOffer } from './hooks';

const PRESETS = [0.25, 0.5, 1];

/** Validates locally (1..limit) but still shows the server's own message if it disagrees. */
export function RestockForm({
  limit,
  onConflict,
}: {
  limit: number;
  /** Called with the backend's 409 message; the page shows it beside the current loan. */
  onConflict: (detail: string) => void;
}) {
  const navigate = useNavigate();
  const create = useCreateOffer();
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const amount = Number(value);
  const serverError = create.isError ? userMessage(create.error) : null;
  const error = localError ?? serverError;

  function setAmount(next: string) {
    setValue(next);
    setLocalError(null);
    create.reset();
  }

  function validate(): number | null {
    if (value.trim() === '' || !Number.isInteger(amount)) {
      setLocalError('Enter a whole number of shillings.');
      return null;
    }
    if (amount < 1 || amount > limit) {
      setLocalError(`Amount must be between 1 and the limit of ${formatKes(limit)}.`);
      return null;
    }
    return amount;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const valid = validate();
    if (valid === null) return;
    create.mutate(valid, {
      onSuccess: (offer) => navigate(`/offers/${offer.offer_id}`),
      onError: (e) => {
        if (isApiError(e) && e.status === 409) onConflict(e.detail);
      },
    });
  }

  return (
    <Card>
      <h3 className="font-semibold text-slate-900">Request a restock loan</h3>
      <p className="mt-1 text-sm text-slate-600">
        You can request up to <strong>{formatKes(limit)}</strong> this week. Nothing is borrowed
        until you review and accept the terms.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor={inputId} className="text-sm font-medium text-slate-800">
            Amount (KES)
          </label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={1}
            max={limit}
            step={1}
            value={value}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            placeholder={`e.g. ${Math.min(limit, 10000)}`}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          {error && (
            <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <input
          type="range"
          aria-label="Amount slider"
          min={Math.min(1000, limit)}
          max={limit}
          step={100}
          value={Number.isFinite(amount) && amount > 0 ? Math.min(amount, limit) : 0}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full accent-brand-600"
        />

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const preset = Math.floor((limit * p) / 100) * 100;
            if (preset < 100) return null;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
              >
                {p === 1 ? 'Full limit' : `${p * 100}%`} · {formatKes(preset)}
              </button>
            );
          })}
        </div>

        <Button
          type="submit"
          variant="accent"
          loading={create.isPending}
          className="w-full sm:w-auto"
        >
          Review offer
        </Button>
      </form>
    </Card>
  );
}
