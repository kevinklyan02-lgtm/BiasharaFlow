import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from './ui';

/** Last line of defence: a render crash shows a message instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui] render error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto max-w-md pt-16">
        <ErrorState
          title="The page hit a problem"
          message="Please reload and try again. Your data is safe."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
}
