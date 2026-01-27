import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log error to console for now — Vercel logs will capture this when reproducible
    // You can integrate Sentry/LogRocket here later.
    // eslint-disable-next-line no-console
    console.error('Uncaught error in React tree:', error, info);
    this.setState({ info });
  }

  render() {
    if (!this.state.hasError) return this.props.children as React.ReactElement;

    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ color: '#b91c1c' }}>Something went wrong</h2>
        <p>We captured an error while rendering the application. Check the browser console for details.</p>
        {this.state.error && (
          <details style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
            <summary>Show error</summary>
            <div>{this.state.error?.message}</div>
            <pre>{this.state.info?.componentStack}</pre>
          </details>
        )}
        <button style={{ marginTop: 12 }} onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}
