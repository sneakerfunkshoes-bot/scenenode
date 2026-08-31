'use client';

import { Component, type ReactNode, useEffect } from 'react';
import { trackClientError } from '@/lib/client-analytics';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    trackClientError('react-boundary', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm font-medium text-white">Something went wrong</p>
            <p className="mt-2 text-xs text-zinc-500">
              Refresh the page or start a new analysis.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ClientAnalytics({ children }: { children: ReactNode }) {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      trackClientError('window-error', event.message || 'Script error');
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const msg =
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason ?? 'Unhandled rejection');
      trackClientError('unhandled-rejection', msg);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
