import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
}

export function NetworkErrorBoundary({ children }: NetworkErrorBoundaryProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNetworkError, setShowNetworkError] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNetworkError(false);
      console.log('[NetworkErrorBoundary] Back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNetworkError(true);
      console.log('[NetworkErrorBoundary] Lost connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-8 shadow-2xl">
            {/* Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-600/20 blur-2xl rounded-full"></div>
                <div className="relative flex items-center justify-center w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                  <WifiOff className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Message */}
            <h2 className="text-xl font-bold text-center text-white mb-2">
              Connection Lost
            </h2>
            
            <p className="text-sm text-gray-400 text-center mb-6">
              You've lost your internet connection. Some features may be unavailable. Check your connection and refresh when ready.
            </p>

            {/* Status */}
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Connection Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500/50 rounded-full animate-pulse"></div>
                  <span className="text-xs text-yellow-400">Offline</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg transition-all duration-300 font-medium text-sm"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook to use network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
