// components/InstallButton.jsx
'use client'
import { useState, useEffect } from 'react';
import usePWA from '@/hooks/usePWA';
import { CiMobile3 } from 'react-icons/ci';
import { FiX, FiInfo } from 'react-icons/fi';

export default function InstallButton({ 
  variant = "floating", // "floating", "inline", "compact"
  showInstructions = true,
  className = ""
}) {
  const { 
    isInstallable, 
    isInstalled, 
    isInstalling, 
    installError, 
    installApp,
    isPWASupported,
    installInstructions 
  } = usePWA();
  
  const [showError, setShowError] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  // Show error temporarily
  useEffect(() => {
    if (installError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [installError]);

  const handleInstall = async () => {
    const success = await installApp();
    
    // If installation failed and we should show instructions
    if (!success && showInstructions && !isInstallable) {
      setShowManualInstructions(true);
    }
  };

  // Don't show if already installed
  if (isInstalled) return null;

  // Don't show if PWA not supported at all
  if (!isPWASupported) return null;

  // Base styles for different variants
  const getVariantStyles = () => {
    switch (variant) {
      case "inline":
        return "bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md";
      case "compact":
        return "bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-full";
      case "floating":
      default:
        return "fixed bottom-4 right-4 z-50 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-full shadow-lg";
    }
  };

  const buttonStyles = `${getVariantStyles()} ${className} flex items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <>
      {/* Install Button */}
      <button
        onClick={handleInstall}
        disabled={isInstalling}
        className={buttonStyles}
        aria-label="Install PWA"
      >
        <CiMobile3 className={variant === "compact" ? "w-5 h-5" : "w-4 h-4"} />
        {variant !== "compact" && (
          <span>
            {isInstalling ? 'Installing...' : 
             isInstallable ? 'Install App' : 'Add to Home Screen'}
          </span>
        )}
      </button>

      {/* Error Toast */}
      {showError && (
        <div className="fixed top-4 right-4 z-[60] bg-red-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 animate-fade-in">
          <span className="text-sm">{installError}</span>
          <button 
            onClick={() => setShowError(false)}
            className="p-1 hover:bg-red-600 rounded"
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* Manual Instructions Modal */}
      {showManualInstructions && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <FiInfo className="text-sky-500 mt-1" size={20} />
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Install Instructions</h3>
                <p className="text-sm text-gray-600">{installInstructions}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowManualInstructions(false)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}