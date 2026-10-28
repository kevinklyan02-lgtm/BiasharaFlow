import { Card, EmptyState, PageHeader } from '@/components/ui';

/** Placeholder for screens delivered in later phases (see docs/ROADMAP.md). */
export function ComingSoon({ title, phase }: { title: string; phase: number }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <EmptyState title="Coming soon" message={`This screen is built in phase ${phase}.`} />
      </Card>
    </>
  );
}
