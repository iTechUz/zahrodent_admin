import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.name || 'Component'}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Nimadir noto'g'ri bajarildi</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {this.props.name ? `${this.props.name} modulida` : 'Ilovada'} kutilmagan xatolik yuz berdi. 
            Xatolik haqida ma'lumot ishlab chiquvchilarga yuborildi.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button onClick={this.handleReset} variant="outline" className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              Sahifani yangilash
            </Button>
            <Button onClick={this.handleGoHome} className="gap-2">
              <Home className="w-4 h-4" />
              Bosh sahifaga qaytish
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 text-left w-full max-w-2xl bg-muted p-4 rounded-lg overflow-auto">
              <p className="font-mono text-sm text-destructive mb-2 font-bold">
                Debug Info: {this.state.error?.message}
              </p>
              <pre className="font-mono text-xs opacity-70">
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
