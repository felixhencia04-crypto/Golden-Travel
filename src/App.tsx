import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppProvider } from './store';
import AnimatedRoutes from './components/AnimatedRoutes';
import ScrollToTop from './components/ScrollToTop';
import OpenInNewTabButton from './components/OpenInNewTabButton';
import { Toaster } from 'sonner';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Oops! Sesuatu berjalan salah.</h1>
            <p className="text-gray-600">Terjadi kesalahan saat memuat halaman. Silakan coba muat ulang halaman.</p>
            <pre className="bg-gray-100 p-4 rounded text-left text-xs overflow-auto max-h-40">
              {this.state.error?.toString()}
            </pre>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Toaster position="top-center" />
        <Router>
          <ScrollToTop />
          <AnimatedRoutes />
          <OpenInNewTabButton />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}
