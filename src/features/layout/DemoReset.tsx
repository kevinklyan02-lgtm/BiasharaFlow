import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { isApiError } from '@/api/errors';
import { isDemoMode } from '@/lib/config';
import { useDemoReset } from './hooks';

/** Two-step button: clearing demo data is destructive, so it asks once. */
export function DemoReset() {
  const reset = useDemoReset();
  const [confirming, setConfirming] = useState(false);
  if (!isDemoMode()) return null;

  const message = reset.isSuccess
    ? 'Demo data cleared.'
    : reset.isError
      ? isApiError(reset.error) && reset.error.status === 403
        ? 'Reset is turned off on this server.'
        : 'Could not reset. Try again.'
      : null;

  return (
    <div className="mt-2 px-4">
      {confirming ? (
        <div role="group" aria-label="Confirm reset" className="space-y-2 text-xs text-brand-50">
          <p>Clear all offers, loans, check-ins and reports?</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={reset.isPending}
              onClick={() => reset.mutate(undefined, { onSettled: () => setConfirming(false) })}
              className="rounded-md bg-white px-3 py-1.5 font-semibold text-brand-900 disabled:opacity-60"
            >
              Yes, reset
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-md border border-white/40 px-3 py-1.5 hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            reset.reset();
            setConfirming(true);
          }}
          className="flex items-center gap-2 text-sm text-brand-50/90 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset demo data
        </button>
      )}
      {message && (
        <p role="status" className="mt-2 text-xs text-brand-100">
          {message}
        </p>
      )}
    </div>
  );
}
