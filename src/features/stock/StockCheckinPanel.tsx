import { useState } from 'react';
import { PackageSearch } from 'lucide-react';
import { userMessage } from '@/api/errors';
import { Button, Card, cx } from '@/components/ui';
import { STOCK_ITEMS } from '@/lib/catalog';
import { useStockCheckin } from './hooks';

export function StockCheckinPanel() {
  const checkin = useStockCheckin();
  const [selected, setSelected] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<string | null>(null);

  function submit() {
    if (!selected) return;
    checkin.mutate(selected, {
      onSuccess: () => {
        setRecorded(selected);
        setSelected(null);
      },
    });
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <PackageSearch className="h-5 w-5 text-brand-700" aria-hidden />
        <h3 className="font-semibold text-slate-900">Stock check-in</h3>
      </div>
      <p className="mt-1 text-sm text-slate-600">Which item is running low?</p>

      <div role="radiogroup" aria-label="Item running low" className="mt-3 flex flex-wrap gap-2">
        {STOCK_ITEMS.map((item) => {
          const on = selected === item;
          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setSelected(item);
                setRecorded(null);
              }}
              className={cx(
                'rounded-full border px-3 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                on
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              {item}
            </button>
          );
        })}
      </div>

      <Button className="mt-4" disabled={!selected} loading={checkin.isPending} onClick={submit}>
        Report running low
      </Button>

      {recorded && (
        <p role="status" className="mt-3 text-sm text-brand-800">
          Recorded: {recorded} is running low.
        </p>
      )}
      {checkin.isError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {userMessage(checkin.error)}
        </p>
      )}
    </Card>
  );
}
