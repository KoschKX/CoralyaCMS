"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Custom fallback UI. Receives the caught error. */
  fallback?: (error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * ErrorBoundary catches rendering errors in its subtree and renders a
 * fallback UI instead of crashing the whole page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) return this.props.fallback(error);
      return (
        <div
          role="alert"
          className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <strong>Rendering error:</strong> {error.message}
        </div>
      );
    }
    return this.props.children;
  }
}
