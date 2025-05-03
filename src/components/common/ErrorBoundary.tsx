'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnError?: boolean;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('Uncaught error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    if (this.props.resetOnError) {
      this.handleReset();
    }
  }

  private handleReset = (): void => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  private renderErrorDetails = (): ReactNode => {
    if (!this.state.errorInfo || !this.props.showDetails) {
      return null;
    }

    return (
      <details className="mt-2 text-sm text-red-600">
        <summary>Error details</summary>
        <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
          {this.state.errorInfo.componentStack}
        </pre>
      </details>
    );
  };

  private renderErrorContent = (): ReactNode => {
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
        <p className="text-red-600 mt-2">{this.state.error?.message}</p>
        {this.renderErrorDetails()}
        <button
          onClick={this.handleReset}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return this.renderErrorContent();
    }

    return this.props.children;
  }
} 