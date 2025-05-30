// hooks/usePWA.js
import { useState, useEffect, useCallback } from 'react';

export default function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installError, setInstallError] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  // Check if PWA is installed
  const checkInstallStatus = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isIOSStandalone = isIOS && navigator.standalone;
    const isAndroidStandalone = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    return isStandalone || isIOSStandalone || isAndroidStandalone;
  }, []);

  // Update debug info
  const updateDebugInfo = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const info = {
      isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost',
      hasServiceWorker: 'serviceWorker' in navigator,
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      userAgent: navigator.userAgent,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isIOSStandalone: /iPad|iPhone|iPod/.test(navigator.userAgent) && navigator.standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
      serviceWorkerState: null,
    };

    // Check service worker state
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          info.serviceWorkerState = registration.active ? 'active' : 'inactive';
        } else {
          info.serviceWorkerState = 'not-registered';
        }
        setDebugInfo({...info});
      });
    } else {
      setDebugInfo(info);
    }
  }, []);

  useEffect(() => {
    // Initial checks
    setIsInstalled(checkInstallStatus());
    updateDebugInfo();

    // Check if prompt was already captured (in case event fired before component mounted)
    if (typeof window !== 'undefined' && window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      setIsInstallable(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: beforeinstallprompt event fired', e);
      e.preventDefault();
      
      // Store the event both in state and globally (as backup)
      setDeferredPrompt(e);
      window.deferredPrompt = e;
      setIsInstallable(true);
      setInstallError(null);
      
      updateDebugInfo();
    };

    // Listen for successful installation
    const handleAppInstalled = (e) => {
      console.log('PWA: appinstalled event fired', e);
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setInstallError(null);
      if (window.deferredPrompt) {
        delete window.deferredPrompt;
      }
      updateDebugInfo();
    };

    // Listen for display mode changes
    const handleDisplayModeChange = (e) => {
      console.log('PWA: display mode changed', e.matches);
      setIsInstalled(checkInstallStatus());
      updateDebugInfo();
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleDisplayModeChange);
    }

    // Register service worker with better timing
    if ('serviceWorker' in navigator) {
      // Wait a bit to ensure page is loaded
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
          .then((registration) => {
            console.log('Service Worker registered:', registration.scope);
            updateDebugInfo();
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
              console.log('Service Worker update found');
            });
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
            updateDebugInfo();
          });
      }, 1000);
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, [checkInstallStatus, updateDebugInfo]);

  // Install the PWA
  const installApp = useCallback(async () => {
    console.log('PWA: Install attempt started', { deferredPrompt, isInstallable });
    
    if (!deferredPrompt) {
      const error = 'No install prompt available. Try refreshing the page and waiting a moment.';
      setInstallError(error);
      console.warn('PWA:', error);
      return false;
    }

    try {
      setIsInstalling(true);
      setInstallError(null);
      
      console.log('PWA: Showing install prompt');
      const promptResult = await deferredPrompt.prompt();
      console.log('PWA: Prompt result:', promptResult);
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA: User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('PWA: Installation accepted');
        return true;
      } else {
        console.log('PWA: Installation dismissed');
        setInstallError('Installation cancelled');
        return false;
      }
    } catch (error) {
      console.error('PWA: Installation failed:', error);
      setInstallError(error.message || 'Installation failed');
      return false;
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
      setIsInstallable(false);
      if (window.deferredPrompt) {
        delete window.deferredPrompt;
      }
    }
  }, [deferredPrompt]);

  // Force check for install prompt (for testing)
  const forceCheckInstallability = useCallback(() => {
    updateDebugInfo();
    
    // Trigger a check by reloading service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          console.log('PWA: Service worker is registered');
        } else {
          console.log('PWA: No service worker registration found');
        }
      });
    }
  }, [updateDebugInfo]);

  return {
    isInstallable,
    isInstalled,
    isInstalling,
    installError,
    installApp,
    debugInfo,
    forceCheckInstallability
  };
}