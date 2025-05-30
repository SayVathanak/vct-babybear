// app/offline/page.jsx
'use client'
import { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    
    // Add a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (navigator.onLine) {
      // Use router.push if using Next.js router, or window.location.replace for better UX
      window.location.replace('/');
    } else {
      setIsRetrying(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <div className="relative mb-6">
            {isOnline ? (
              <Wifi className="w-24 h-24 mx-auto text-green-500 animate-pulse" />
            ) : (
              <WifiOff className="w-24 h-24 mx-auto text-gray-400" />
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            {isOnline ? "Connection Restored!" : "You're Offline"}
          </h1>
          
          <p className="text-gray-600 leading-relaxed">
            {isOnline 
              ? "Your internet connection has been restored. You can now go back online."
              : "It looks like you've lost your internet connection. Check your network and try again."
            }
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            disabled={!isOnline || isRetrying}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              isOnline && !isRetrying
                ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : isOnline ? (
              'Go Back Online'
            ) : (
              'Still Offline'
            )}
          </button>

          <button
            onClick={handleRefresh}
            className="w-full py-2 px-4 rounded-lg font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-all duration-200"
          >
            Refresh Page
          </button>

          <div className="flex items-center justify-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              isOnline 
                ? 'text-green-700 bg-green-100' 
                : 'text-red-700 bg-red-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              {isOnline ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-400 border-t border-gray-200 pt-4">
          <p>Baby Bear - Available offline with limited functionality</p>
        </div>
      </div>
    </div>
  );
}