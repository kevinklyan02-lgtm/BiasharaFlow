import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ApiProvider } from '@/api/ApiProvider';
import { api } from '@/api/client';
import { createQueryClient } from '@/api/queryClient';
import { TraderProvider } from '@/features/traders/TraderContext';
import { AppRoutes } from './routes';

export function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <ApiProvider client={api}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TraderProvider>
            <AppRoutes />
          </TraderProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ApiProvider>
  );
}
