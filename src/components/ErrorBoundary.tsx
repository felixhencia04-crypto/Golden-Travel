import React from 'react';
import { RotateCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Tampilan Memerlukan Refresh</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Terjadi pembaruan sistem atau server sedang memuat ulang. Klik tombol di bawah untuk memulihkan tampilan website.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left overflow-x-auto max-h-24">
                <p className="text-[10px] font-mono text-rose-400 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Muat Ulang (Reload)</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Halaman Utama</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
export default ErrorBoundary;
