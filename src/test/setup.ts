import '@testing-library/jest-dom/vitest';

// Recharts' ResponsiveContainer needs ResizeObserver, which jsdom does not provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

// Parallel test files make renders slower; give async queries more headroom than the 1s default.
import { configure } from '@testing-library/react';
configure({ asyncUtilTimeout: 15000 });
