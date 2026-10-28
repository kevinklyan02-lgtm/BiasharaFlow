/** Read at call time so tests can stub the env. Demo tools are on unless explicitly disabled. */
export const isDemoMode = () => import.meta.env.VITE_DEMO_MODE !== 'false';
