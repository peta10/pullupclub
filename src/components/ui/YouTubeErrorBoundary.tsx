import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class YouTubeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silently catch YouTube-related errors (third-party cookies, etc.)
    if (
      error.message.includes('youtube') ||
      error.message.includes('google') ||
      error.message.includes('cookie') ||
      (errorInfo.componentStack && errorInfo.componentStack.includes('iframe'))
    ) {
      console.warn('YouTube embed error (normal for third-party cookies):', error.message);
      return;
    }
    
    console.error('Uncaught error in YouTube component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="relative bg-gray-800 flex items-center justify-center w-full" style={{ height: '315px' }}>
          <div className="text-center">
            <p className="text-white mb-4">Video temporarily unavailable</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default YouTubeErrorBoundary; 