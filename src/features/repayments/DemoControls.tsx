import { useId, useState, type FormEvent } from 'react';
import { userMessage } from '@/api/errors';
import type { Loan } from '@/api/types';
import { Button, Card, SimulatedBadge } from '@/components/ui';
import { newTxnId } from '@/lib/id';
import { formatKes } from '@/lib/format';
import { useRepay } from './hooks';

interface Sent {
  txn_id: string;
  daily_sales: number;
}

/** Simulates one day of Till sales. A fresh txn_id per click; resend reuses the last one. */
export function DemoControls({ loan, suggested }: { loan: Loan; suggested: number }) {
  const repay = useRepay();
  const inputId = useId();
  const [sales, setSales] = useState(String(suggested));
  const [last, setLast] = useState<Sent | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const amount = Number(sales);
  const valid = Number.isInteger(amount) && amount > 0;

  function send(body: Sent) {
    repay.mutate(
      { loanId: loan.loan_id, ...body },
      {
        onSuccess: (res) => {
          setLast(body);
          const before = loan.repaid;
          setMessage(
            res.duplicate
              ? 'Duplicate transaction ignored. Nothing changed.'
              : `Day recorded. ${formatKes(res.loan.repaid - before)} deducted. Balance ${formatKes(res.loan.balance)}.`,
          );
        },
        onError: () => setMessage(null),
      },
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    send({ txn_id: newTxnId(), daily_sales: amount });
  }

  return (
    <Card className="border-dashed border-amber-300 bg-amber-50/50">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-slate-900">Demo controls</h3>
        <SimulatedBadge />
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Pretend a day of M-PESA Till sales happened and see the capped repayment.
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-800">
            Daily sales (KES)
          </label>
          <input
            id={inputId}
            type="number"
            min={1}
            step={1}
            value={sales}
            onChange={(e) => setSales(e.target.value)}
            className="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
        </div>
        <Button type="submit" loading={repay.isPending} disabled={!valid}>
          Simulate a day of sales
        </Button>
        {last && (
          <Button
            type="button"
            variant="secondary"
            disabled={repay.isPending}
            onClick={() => send(last)}
          >
            Send the same transaction again
          </Button>
        )}
      </form>
      {!valid && sales !== '' && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          Enter a positive whole number.
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-slate-800">
          {message}
        </p>
      )}
      {repay.isError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {userMessage(repay.error)}
        </p>
      )}
    </Card>
  );
}
