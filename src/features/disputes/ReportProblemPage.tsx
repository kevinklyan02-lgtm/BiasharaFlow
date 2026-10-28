import { useId, useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { userMessage } from '@/api/errors';
import type { Dispute } from '@/api/types';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Button, Card, EmptyState, PageHeader, Skeleton } from '@/components/ui';
import { useRepayments } from '@/features/repayments/hooks';
import { DISPUTE_REASONS } from '@/lib/catalog';
import { formatDateTime } from '@/lib/format';
import { useCreateDispute, useDisputes } from './hooks';

const NO_LOAN = '';

function ProblemForm({ onDone }: { onDone: (d: Dispute) => void }) {
  const create = useCreateDispute();
  const loans = useRepayments();
  const loanId = useId();
  const [reason, setReason] = useState<string | null>(null);
  const [loan, setLoan] = useState(NO_LOAN);
  const [touched, setTouched] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!reason) return;
    create.mutate(
      { reason, ...(loan !== NO_LOAN ? { loan_id: loan } : {}) },
      {
        onSuccess: (d) => {
          onDone(d);
          setReason(null);
          setLoan(NO_LOAN);
          setTouched(false);
        },
      },
    );
  }

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend className="font-semibold text-slate-900">What is the problem?</legend>
          <div className="mt-3 space-y-2">
            {DISPUTE_REASONS.map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-brand-600"
                />
                {r}
              </label>
            ))}
          </div>
          {touched && !reason && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              Choose what went wrong.
            </p>
          )}
        </fieldset>

        {loans.data && loans.data.length > 0 && (
          <div className="mt-4">
            <label htmlFor={loanId} className="text-sm font-medium text-slate-800">
              Which loan? (optional)
            </label>
            <select
              id={loanId}
              value={loan}
              onChange={(e) => setLoan(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <option value={NO_LOAN}>Not about a specific loan</option>
              {loans.data.map((l) => (
                <option key={l.loan_id} value={l.loan_id}>
                  {l.loan_id} ({l.status})
                </option>
              ))}
            </select>
          </div>
        )}

        <Button type="submit" className="mt-5" loading={create.isPending}>
          Send report
        </Button>
        {create.isError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {userMessage(create.error)}
          </p>
        )}
      </form>
    </Card>
  );
}

function Confirmation({ dispute }: { dispute: Dispute }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-900"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">Report received. Your reference is {dispute.dispute_id}.</p>
        <p className="mt-1">
          We will respond within {dispute.resolve_within_days} days. Keep this reference if you need
          to follow up.
        </p>
      </div>
    </div>
  );
}

function DisputeHistory() {
  const query = useDisputes();
  return (
    <Card>
      <h3 className="font-semibold text-slate-900">Your reports</h3>
      <QueryBoundary query={query} loading={<Skeleton className="mt-3 h-16 w-full" />}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState title="No reports yet" />
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {[...items].reverse().map((d) => (
                <li key={d.dispute_id} className="py-3 text-sm">
                  <p className="font-medium text-slate-900">
                    {d.dispute_id} · {d.reason}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(d.at)} · {d.status} · reply within {d.resolve_within_days} days
                    {d.loan_id ? ` · ${d.loan_id}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </Card>
  );
}

export function ReportProblemPage() {
  const [submitted, setSubmitted] = useState<Dispute | null>(null);
  return (
    <>
      <PageHeader
        title="Report a Problem"
        subtitle="Wrong balance? Double deduction? Let us know and we'll help."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          {submitted && <Confirmation dispute={submitted} />}
          <ProblemForm onDone={setSubmitted} />
        </div>
        <DisputeHistory />
      </div>
    </>
  );
}
