'use client'
import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCw, Zap, ZapOff } from 'lucide-react';

const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [facingMode, setFacingMode] = useState('environment');
  const [scanLine, setScanLine] = useState(0);
  const scanIntervalRef = useRef(null);
  const animationRef = useRef(null);
  const initTimeoutRef = useRef(null);

  // Detect if device is iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Animate scan line
  useEffect(() => {
    if (isScanning) {
      const animateScanLine = () => {
        setScanLine(prev => (prev + 2) % 200);
        animationRef.current = requestAnimationFrame(animateScanLine);
      };
      animateScanLine();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScanning]);

  // Initialize camera
  useEffect(() => {
    initializeCamera();
    return () => {
      cleanup();
    };
  }, [facingMode]);

  const initializeCamera = async () => {
    setIsInitializing(true);
    setError('');
    setIsScanning(false);

    // Clear any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    // Set a timeout to prevent indefinite loading
    initTimeoutRef.current = setTimeout(() => {
      if (isInitializing) {
        setError('Camera initialization timeout. Please try again.');
        setIsInitializing(false);
      }
    }, 10000); // 10 second timeout

    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      // Request camera permissions with fallback constraints
      let constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        }
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback to basic constraints if detailed ones fail
        console.warn('Detailed constraints failed, trying basic constraints:', err);
        constraints = {
          video: {
            facingMode: facingMode
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.setAttribute('muted', true);
        
        // Handle iOS autoplay issues
        if (isIOS) {
          videoRef.current.muted = true;
          videoRef.current.setAttribute('webkit-playsinline', true);
        }

        // Wait for video metadata and play
        const playVideo = () => {
          return new Promise((resolve, reject) => {
            const onLoadedMetadata = () => {
              videoRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
              
              videoRef.current.play()
                .then(() => {
                  // Clear the timeout since we're successful
                  if (initTimeoutRef.current) {
                    clearTimeout(initTimeoutRef.current);
                  }
                  
                  setIsScanning(true);
                  setIsInitializing(false);
                  checkFlashSupport();
                  startBarcodeDetection();
                  resolve();
                })
                .catch(reject);
            };

            const onError = (err) => {
              videoRef.current.removeEventListener('error', onError);
              reject(err);
            };

            if (videoRef.current.readyState >= 1) {
              // Metadata already loaded
              onLoadedMetadata();
            } else {
              videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
              videoRef.current.addEventListener('error', onError);
            }
          });
        };

        await playVideo();
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      
      // Clear the timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      setIsInitializing(false);
      
      if (err.name === 'NotAllowedError') {
        setError(isIOS 
          ? 'Camera access denied. Please allow camera access in Settings > Safari > Camera and refresh the page.'
          : 'Camera access denied. Please allow camera permissions and try again.'
        );
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.');
      } else if (err.name === 'OverconstrainedError') {
        setError(isIOS 
          ? 'Camera not compatible. Please try using Safari browser.'
          : 'Camera constraints not supported. Please try a different device.'
        );
      } else if (err.message === 'Camera API not supported') {
        setError('Camera API not supported by your browser. Please use a modern browser.');
      } else {
        setError(isIOS 
          ? 'Unable to access camera. Please ensure you\'re using Safari and camera access is enabled.'
          : 'Unable to access camera. Please check permissions and try again.'
        );
      }
    }
  };

  const checkFlashSupport = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack && videoTrack.getCapabilities) {
        try {
          const capabilities = videoTrack.getCapabilities();
          setFlashSupported(!!capabilities.torch);
        } catch (err) {
          console.warn('Flash capability check failed:', err);
          setFlashSupported(false);
        }
      }
    }
  };

  const toggleFlash = async () => {
    if (streamRef.current && flashSupported) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled }]
        });
        setFlashEnabled(!flashEnabled);
      } catch (err) {
        console.error('Flash toggle error:', err);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const startBarcodeDetection = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && isScanning) {
        detectBarcode();
      }
    }, 200); // Check every 200ms
  };

  const detectBarcode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = scanImageData(imageData);
      
      if (code) {
        setIsScanning(false);
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
        onBarcodeDetected(code);
      }
    } catch (err) {
      console.error('Barcode detection error:', err);
    }
  };

  // Simple barcode detection (placeholder - in real app you'd use a library like ZXing)
  const scanImageData = (imageData) => {
    // This is a simplified placeholder
    // In a real implementation, you'd use a barcode scanning library
    // For now, we'll simulate occasional detection for demo purposes
    if (Math.random() < 0.01) { // 1% chance per scan
      return '1234567890123'; // Simulate EAN-13 barcode
    }
    return null;
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const handleManualInput = () => {
    const barcode = prompt('Enter barcode:');
    if (barcode && barcode.trim()) {
      const trimmedBarcode = barcode.trim();
      if (/^\d{8,13}$/.test(trimmedBarcode) || /^[A-Za-z0-9]{6,}$/.test(trimmedBarcode)) {
        cleanup();
        onBarcodeDetected(trimmedBarcode);
      } else {
        alert('Please enter a valid barcode');
      }
    }
  };

  const handleRetry = () => {
    setError('');
    initializeCamera();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between p-4 pt-12">
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X size={24} />
          </button>
          <h1 className="text-white text-lg font-semibold">Scan Barcode</h1>
          <div className="flex items-center gap-2">
            {!error && !isInitializing && flashSupported && (
              <button
                onClick={toggleFlash}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                {flashEnabled ? <Zap size={20} /> : <ZapOff size={20} />}
              </button>
            )}
            {!error && !isInitializing && (
              <button
                onClick={switchCamera}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <RotateCw size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-sm">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <p className="text-white mb-4 text-sm leading-relaxed">{error}</p>
              {isIOS && (
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 mb-4 text-left">
                  <h4 className="font-semibold text-blue-300 text-sm mb-2">iPhone/iPad Tips:</h4>
                  <ul className="text-blue-200 text-xs space-y-1">
                    <li>• Use Safari browser</li>
                    <li>• Enable camera in Settings</li>
                    <li>• Make sure you're on HTTPS</li>
                    <li>• Try refreshing the page</li>
                  </ul>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRetry}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full"
                >
                  Try Again
                </button>
                <button
                  onClick={handleManualInput}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors w-full"
                >
                  Enter Barcode Manually
                </button>
              </div>
            </div>
          </div>
        ) : isInitializing ? (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-lg">Initializing Camera...</p>
            {isIOS && (
              <p className="text-sm text-gray-300 mt-2">
                Please allow camera access when prompted
              </p>
            )}
            <button
              onClick={handleManualInput}
              className="mt-6 bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/30 hover:bg-white/30 transition-colors"
            >
              Enter Code Manually
            </button>
          </div>
        ) : (
          <>
            {/* Video Stream */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              onError={(e) => {
                console.error('Video error:', e);
                setError('Video playback failed. Please try again.');
                setIsInitializing(false);
              }}
            />
            
            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Dark overlay with cutout */}
              <div className="absolute inset-0 bg-black/60" />
              
              {/* Viewfinder frame */}
              <div className="relative w-80 h-48 border-2 border-white rounded-lg bg-transparent">
                {/* Corner brackets */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-green-400 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-green-400 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-green-400 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-green-400 rounded-br-lg"></div>
                
                {/* Scanning line */}
                {isScanning && (
                  <div 
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-80 transition-all duration-100"
                    style={{ 
                      top: `${scanLine}px`,
                      boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)'
                    }}
                  />
                )}
                
                {/* Center targeting box */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-12 border border-white/50 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-white text-xs font-medium">
                      {isScanning ? 'Scanning...' : 'Align barcode here'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-12">
              <div className="text-center text-white">
                <p className="text-lg font-medium mb-2">Point camera at barcode</p>
                <p className="text-sm text-gray-300 mb-4">
                  Position the barcode within the frame for automatic scanning
                </p>
                <button
                  onClick={handleManualInput}
                  className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/30 hover:bg-white/30 transition-colors"
                >
                  Enter Code Manually
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default BarcodeScanner;