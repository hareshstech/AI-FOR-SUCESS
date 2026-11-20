import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Primitives';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  componentDidCatch(error: Error) {
    console.error('NEXORA ErrorBoundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      let friendly = 'Something went wrong while loading this workspace view.';
      if (this.state.message.includes('Missing or insufficient permissions')) {
        friendly = 'Your session does not have permission to access this resource. Please sign in again.';
      }
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--nx-bg-primary)] text-[var(--nx-text-primary)]">
          <div className="max-w-md w-full rounded-2xl border border-[var(--nx-border-strong)] bg-[var(--nx-surface-base)] p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--nx-error-bg)] text-[var(--nx-error)] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="font-display text-lg font-semibold">Workspace interruption</h1>
            <p className="text-sm text-[var(--nx-text-secondary)] mt-2 leading-relaxed">{friendly}</p>
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => window.location.reload()}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Reload NEXORA
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
