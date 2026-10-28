import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { qk } from '@/api/keys';
import type { Trader } from '@/api/types';
import { readStorage, writeStorage } from '@/lib/storage';
import { QueryBoundary } from '@/components/QueryBoundary';

const STORAGE_KEY = 'biasharaflow.traderId';

interface TraderContextValue {
  traders: Trader[];
  trader: Trader;
  setTraderId: (id: number) => void;
}

const TraderContext = createContext<TraderContextValue | null>(null);

/**
 * Loads the trader list once, remembers the selection, and only renders children when a
 * trader exists, so every screen can rely on `useTrader()` being non-null.
 */
export function TraderProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const query = useQuery({ queryKey: qk.traders, queryFn: () => api.getTraders() });
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const stored = Number(readStorage(STORAGE_KEY));
    return Number.isInteger(stored) && stored > 0 ? stored : null;
  });

  const setTraderId = useCallback((id: number) => {
    setSelectedId(id);
    writeStorage(STORAGE_KEY, String(id));
  }, []);

  return (
    <QueryBoundary query={query}>
      {(traders) => (
        <Resolved traders={traders} selectedId={selectedId} setTraderId={setTraderId}>
          {children}
        </Resolved>
      )}
    </QueryBoundary>
  );
}

function Resolved({
  traders,
  selectedId,
  setTraderId,
  children,
}: {
  traders: Trader[];
  selectedId: number | null;
  setTraderId: (id: number) => void;
  children: ReactNode;
}) {
  // A stored id that no longer exists falls back to the first trader.
  const trader = traders.find((t) => t.trader_id === selectedId) ?? traders[0];
  const value = useMemo(
    () => (trader ? { traders, trader, setTraderId } : null),
    [traders, trader, setTraderId],
  );
  if (!value) return <p className="p-8 text-center text-slate-600">No traders are available.</p>;
  return <TraderContext.Provider value={value}>{children}</TraderContext.Provider>;
}

export function useTrader(): TraderContextValue {
  const ctx = useContext(TraderContext);
  if (!ctx) throw new Error('useTrader must be used inside <TraderProvider>');
  return ctx;
}
