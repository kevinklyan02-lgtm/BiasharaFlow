import { CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isApiError, userMessage } from '@/api/errors';
import type { Loan } from '@/api/types';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Button, Card, ErrorState, PageHeader } from '@/components/ui';
import { formatKes } from '@/lib/format';
import { OfferTerms, StatusBadge } from './OfferTerms';
import { useAcceptOffer, useDeclineOffer, useOffers } from './hooks';

/** There is no GET /offers/{id}, so the offer is found in the trader's offer list. */
export function OfferReviewPage() {
  const { offerId = '' } = useParams();
  const navigate = useNavigate();
  const query = useOffers();
  const accept = useAcceptOffer();
  const decline = useDeclineOffer();

  const busy = accept.isPending || decline.isPending;
  const actionError = accept.error ?? decline.error;
  const loan: Loan | undefined = accept.data;

  return (
    <>
      <PageHeader title="Review your offer" subtitle="Read every line before you accept." />
      <QueryBoundary query={query}>
        {(offers) => {
          const offer = offers.find((o) => o.offer_id === offerId);
          if (!offer) {
            return (
              <Card>
                <ErrorState
                  title="Offer not found"
                  message="This offer does not exist for the selected trader."
                />
                <div className="text-center">
                  <Link
                    to="/offers"
                    className="text-sm font-medium text-accent-600 hover:underline"
                  >
                    Back to offers
                  </Link>
                </div>
              </Card>
            );
          }

          return (
            <Card className="max-w-xl">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  {offer.offer_id} · {formatKes(offer.amount)}
                </h3>
                <StatusBadge status={offer.status} />
              </div>
              <OfferTerms offer={offer} />

              {loan && (
                <div
                  role="status"
                  className="mt-4 flex items-start gap-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-900"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Offer accepted. Loan {loan.loan_id} is active.</p>
                    <p>
                      You will repay {formatKes(loan.total_payable)} from a share of your daily
                      sales.
                    </p>
                    <Link to="/repayments" className="mt-1 inline-block font-medium underline">
                      Track repayment progress
                    </Link>
                  </div>
                </div>
              )}

              {decline.isSuccess && (
                <p
                  role="status"
                  className="mt-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700"
                >
                  Offer declined. No loan was created.
                </p>
              )}

              {actionError && (
                <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  {userMessage(actionError)}
                  {isApiError(actionError) && actionError.status === 409 && (
                    <> The page was refreshed with the current state.</>
                  )}
                </p>
              )}

              {offer.status === 'pending_review' && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    loading={accept.isPending}
                    disabled={busy}
                    onClick={() => accept.mutate(offer.offer_id)}
                  >
                    Accept offer
                  </Button>
                  <Button
                    variant="secondary"
                    loading={decline.isPending}
                    disabled={busy}
                    onClick={() => decline.mutate(offer.offer_id)}
                  >
                    Decline
                  </Button>
                </div>
              )}

              {offer.status !== 'pending_review' && (
                <Button variant="secondary" className="mt-5" onClick={() => navigate('/offers')}>
                  Back to offers
                </Button>
              )}
            </Card>
          );
        }}
      </QueryBoundary>
    </>
  );
}
