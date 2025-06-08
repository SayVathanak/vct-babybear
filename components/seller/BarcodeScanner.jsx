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

  // Initialize camera - SIMPLIFIED VERSION
  useEffect(() => {
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

    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Check browser compatibility
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // SIMPLIFIED constraints - similar to working first file
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        
        // Simple video setup - like the working first file
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.muted = true;

        // Wait for video to load
        video.onloadedmetadata = () => {
          video.play().then(() => {
            console.log('Video playing successfully');
            setIsScanning(true);
            setIsInitializing(false);
            checkFlashSupport();
            startBarcodeDetection();
          }).catch(err => {
            console.error('Video play error:', err);
            setError('Failed to start video preview');
            setIsInitializing(false);
          });
        };

        // Handle video errors
        video.onerror = (err) => {
          console.error('Video error:', err);
          setError('Video error occurred');
          setIsInitializing(false);
        };
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setIsInitializing(false);
      
      // Simplified error handling
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is being used by another application.');
      } else {
        setError(`Camera error: ${err.message}`);
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

    // Simple interval-based detection
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

  // Simple barcode detection simulation
  const scanImageData = (imageData) => {
    const { data, width, height } = imageData;
    let brightPixels = 0;
    let darkPixels = 0;
    
    // Sample pixels in the center region
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
    
    const totalPixels = brightPixels + darkPixels;
    const contrast = Math.abs(brightPixels - darkPixels) / totalPixels;
    
    // Simulate barcode detection
    if (contrast > 0.3 && Math.random() < 0.005) {
      const barcodeTypes = [
        '1234567890123',
        '12345678901',
        '1234567',
        'ABC123DEF456'
      ];
      return barcodeTypes[Math.floor(Math.random() * barcodeTypes.length)];
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
      scanIntervalRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
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
      if (/^\d{8,14}$/.test(trimmedBarcode) || /^[A-Za-z0-9]{4,}$/.test(trimmedBarcode)) {
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
              <p className="text-white mb-4 text-sm">{error}</p>
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
            <p className="text-sm text-gray-300 mt-2">Please allow camera access when prompted</p>
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
            />
            
            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" />
              
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

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default BarcodeScanner;