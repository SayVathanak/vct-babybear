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

  // Enhanced iOS detection
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
           /iPhone|iPad|iPod|iOS/i.test(navigator.userAgent);
  };

  // Check if running in standalone PWA mode
  const isStandalonePWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  };

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
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      initializeCamera();
    }, 100);
    
    return () => {
      clearTimeout(timer);
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
    }, 15000); // Increased to 15 seconds for iOS

    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }

      // Check browser compatibility
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported. Please use Safari on iOS.');
      }

      // iOS-specific constraints with fallbacks
      const getConstraints = (attempt = 1) => {
        const baseConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        };

        if (attempt === 1) {
          // First attempt: High quality
          return {
            video: {
              ...baseConstraints.video,
              frameRate: { ideal: 30, min: 15 },
              aspectRatio: { ideal: 16/9 }
            }
          };
        } else if (attempt === 2) {
          // Second attempt: Medium quality
          return {
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 800, min: 480 },
              height: { ideal: 600, min: 360 }
            }
          };
        } else {
          // Final attempt: Basic constraints
          return {
            video: {
              facingMode: facingMode
            }
          };
        }
      };

      let stream = null;
      let lastError = null;

      // Try multiple constraint configurations
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Camera attempt ${attempt}...`);
          const constraints = getConstraints(attempt);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log(`Camera attempt ${attempt} successful`);
          break;
        } catch (err) {
          console.warn(`Camera attempt ${attempt} failed:`, err);
          lastError = err;
          
          if (attempt === 3) {
            throw lastError;
          }
          
          // Wait a bit between attempts
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!stream) {
        throw lastError || new Error('Failed to get camera stream');
      }

      streamRef.current = stream;

      if (videoRef.current) {
        // Set video properties for iOS compatibility
        const video = videoRef.current;
        
        // Clear any existing src
        video.srcObject = null;
        video.src = '';
        
        // Set the new stream
        video.srcObject = stream;
        
        // iOS-specific attributes
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;

        // Handle video loading with better error handling
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Video loading timeout'));
          }, 10000);

          const onLoadedMetadata = () => {
            clearTimeout(timeoutId);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };

          const onError = (err) => {
            clearTimeout(timeoutId);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(err);
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);

          // Force load if metadata already available
          if (video.readyState >= 1) {
            onLoadedMetadata();
          }
        });

        // Play video with iOS-specific handling
        try {
          await video.play();
        } catch (playError) {
          console.warn('Video play failed, trying iOS workaround:', playError);
          
          // iOS workaround: try playing after a short delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
          try {
            video.muted = true;
            await video.play();
          } catch (secondPlayError) {
            throw new Error(`Video play failed: ${secondPlayError.message}`);
          }
        }

        // Clear timeout on success
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }

        setIsScanning(true);
        setIsInitializing(false);
        checkFlashSupport();
        
        // Start barcode detection after a short delay
        setTimeout(() => {
          startBarcodeDetection();
        }, 500);
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      setIsInitializing(false);
      
      // Enhanced error messages for iOS
      if (err.name === 'NotAllowedError') {
        setError(
          isIOS() 
            ? 'Camera access denied. Please:\n1. Open Settings > Safari > Camera\n2. Allow camera access\n3. Refresh this page\n4. Make sure you\'re using Safari browser'
            : 'Camera access denied. Please allow camera permissions and try again.'
        );
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'OverconstrainedError') {
        setError(
          isIOS() 
            ? 'Camera compatibility issue. Please try:\n1. Use Safari browser\n2. Update iOS to latest version\n3. Restart Safari'
            : 'Camera constraints not supported.'
        );
      } else if (err.name === 'NotReadableError') {
        setError(
          isIOS()
            ? 'Camera is being used by another app. Please:\n1. Close all camera apps\n2. Restart Safari\n3. Try again'
            : 'Camera is busy or unavailable.'
        );
      } else if (err.message.includes('Video play failed')) {
        setError(
          isIOS()
            ? 'Video playback issue. Please:\n1. Enable autoplay in Safari settings\n2. Make sure sound is not muted\n3. Try refreshing the page'
            : 'Video playback failed. Please try again.'
        );
      } else {
        setError(
          isIOS() 
            ? `Camera error: ${err.message}\n\nTips for iOS:\n• Use Safari browser\n• Enable camera in Settings\n• Try refreshing the page\n• Check if running in Private Browsing mode`
            : `Camera error: ${err.message}`
        );
      }
    }
  };

  const checkFlashSupport = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
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

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
  };

  const startBarcodeDetection = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    // Use QuaggaJS if available, otherwise fallback to placeholder
    if (typeof window !== 'undefined' && window.Quagga) {
      initQuaggaScanner();
    } else {
      // Fallback to interval-based detection
      scanIntervalRef.current = setInterval(() => {
        if (videoRef.current && canvasRef.current && isScanning) {
          detectBarcode();
        }
      }, 300); // Slightly slower for better performance on iOS
    }
  };

  const initQuaggaScanner = () => {
    if (!window.Quagga || !videoRef.current) return;

    window.Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoRef.current
      },
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader"
        ]
      }
    }, (err) => {
      if (err) {
        console.error('Quagga init error:', err);
        // Fallback to manual detection
        startManualDetection();
        return;
      }
      
      window.Quagga.start();
      
      window.Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        if (code && isScanning) {
          setIsScanning(false);
          window.Quagga.stop();
          onBarcodeDetected(code);
        }
      });
    });
  };

  const startManualDetection = () => {
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && isScanning) {
        detectBarcode();
      }
    }, 300);
  };

  const detectBarcode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    try {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
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

  // Enhanced barcode detection simulation
  const scanImageData = (imageData) => {
    // This is still a placeholder - you should integrate a real barcode library
    // For demo purposes, we'll simulate detection based on image brightness patterns
    
    const { data, width, height } = imageData;
    let brightPixels = 0;
    let darkPixels = 0;
    
    // Sample pixels in the center region where barcode should be
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const sampleWidth = Math.floor(width / 4);
    const sampleHeight = Math.floor(height / 8);
    
    for (let y = centerY - sampleHeight; y < centerY + sampleHeight; y++) {
      for (let x = centerX - sampleWidth; x < centerX + sampleWidth; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const index = (y * width + x) * 4;
          const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
          
          if (brightness > 128) {
            brightPixels++;
          } else {
            darkPixels++;
          }
        }
      }
    }
    
    // Simple pattern detection - if there's a good mix of light and dark pixels
    const totalPixels = brightPixels + darkPixels;
    const contrast = Math.abs(brightPixels - darkPixels) / totalPixels;
    
    // Simulate barcode detection with very low probability
    if (contrast > 0.3 && Math.random() < 0.005) { // 0.5% chance per scan
      // Generate a realistic barcode
      const barcodeTypes = [
        '1234567890123', // EAN-13
        '12345678901',   // UPC-A
        '1234567',       // EAN-8
        'ABC123DEF456'   // Code 128
      ];
      return barcodeTypes[Math.floor(Math.random() * barcodeTypes.length)];
    }
    
    return null;
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    // Stop Quagga if it's running
    if (typeof window !== 'undefined' && window.Quagga) {
      try {
        window.Quagga.stop();
      } catch (err) {
        console.warn('Quagga stop error:', err);
      }
    }
    
    setIsScanning(false);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const handleManualInput = () => {
    const barcode = prompt('Enter barcode manually:');
    if (barcode && barcode.trim()) {
      const trimmedBarcode = barcode.trim();
      // More flexible barcode validation
      if (/^\d{8,14}$/.test(trimmedBarcode) || /^[A-Za-z0-9]{4,}$/.test(trimmedBarcode)) {
        cleanup();
        onBarcodeDetected(trimmedBarcode);
      } else {
        alert('Please enter a valid barcode (numbers for UPC/EAN, or alphanumeric for other types)');
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
              <pre className="text-white mb-4 text-sm leading-relaxed whitespace-pre-wrap text-left">
                {error}
              </pre>
              {isIOS() && (
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 mb-4 text-left">
                  <h4 className="font-semibold text-blue-300 text-sm mb-2">Additional iOS Troubleshooting:</h4>
                  <ul className="text-blue-200 text-xs space-y-1">
                    <li>• Close all other apps using camera</li>
                    <li>• Restart Safari completely</li>
                    <li>• Check if in Private Browsing mode</li>
                    <li>• Ensure iOS is up to date</li>
                    <li>• Try airplane mode on/off</li>
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
            {isIOS() && (
              <div className="text-center mt-4 max-w-sm">
                <p className="text-sm text-gray-300 mb-2">
                  Please allow camera access when prompted
                </p>
                <p className="text-xs text-gray-400">
                  If the camera doesn't start, try refreshing the page or check Safari settings
                </p>
              </div>
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
              webkit-playsinline="true"
              onError={(e) => {
                console.error('Video error:', e);
                setError('Video playback failed. Please try again or use manual input.');
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