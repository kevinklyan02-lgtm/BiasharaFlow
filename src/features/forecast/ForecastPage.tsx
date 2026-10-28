import { PageHeader } from '@/components/ui';
import { ForecastCard } from './ForecastCard';
import { InsightsPanel } from './InsightsPanel';

export function ForecastPage() {
  return (
    <>
      <PageHeader
        title="Forecast Chart"
        subtitle="The shaded range shows the low and high case. Your limit is based on the low case."
      />
      <div className="space-y-5">
        <ForecastCard />
        <InsightsPanel />
      </div>
    </>
  );
}
