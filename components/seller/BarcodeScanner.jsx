'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, AlertTriangle, RotateCcw } from 'lucide-react';

const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanAttempts, setScanAttempts] = useState(0);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [facingMode, setFacingMode] = useState('environment');
  const [quaggaReady, setQuaggaReady] = useState(false);
  const quaggaInitialized = useRef(false);
  const detectionCount = useRef(0);

  // Check if QuaggaJS is available
  const isQuaggaAvailable = useCallback(() => {
    return typeof window !== 'undefined' && window.Quagga;
  }, []);

  // Initialize QuaggaJS with iPhone-optimized settings
  const initializeQuagga = useCallback(async () => {
    if (!isQuaggaAvailable()) {
      setError('QuaggaJS library not found. Please ensure it\'s loaded.');
      setIsInitializing(false);
      return;
    }

    if (quaggaInitialized.current) {
      try {
        window.Quagga.stop();
      } catch (err) {
        console.warn('Error stopping existing Quagga instance:', err);
      }
      quaggaInitialized.current = false;
    }

    try {
      setError(null);
      setIsInitializing(true);
      
      const Quagga = window.Quagga;
      
      // iPhone-optimized QuaggaJS configuration
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          constraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: facingMode,
            aspectRatio: { min: 1, max: 2 },
            frameRate: { ideal: 15, max: 30 } // Lower framerate for better performance on iPhone
          },
          target: videoRef.current,
          // iPhone-specific settings
          area: { // Define scanning area for better performance
            top: "20%",
            right: "10%",
            left: "10%",
            bottom: "20%"
          }
        },
        locator: {
          patchSize: "medium", // Better for iPhone performance
          halfSample: true // Reduces processing load
        },
        numOfWorkers: navigator.hardwareConcurrency || 2, // Adaptive worker count
        frequency: 10, // Scan frequency
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "upc_reader",
            "upc_e_reader"
          ],
          debug: {
            drawBoundingBox: false, // Disable for better performance
            showFrequency: false,
            drawScanline: false,
            showPattern: false
          }
        },
        locate: true,
        // iPhone performance optimizations
        tracking: false, // Disable tracking for simpler processing
        debug: false
      };

      console.log('Initializing Quagga with config:', config);

      Quagga.init(config, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          setError(`Scanner initialization failed: ${err.message}`);
          setIsInitializing(false);
          return;
        }

        console.log('Quagga initialized successfully');
        
        try {
          // Set up event listeners before starting
          Quagga.onProcessed((result) => {
            setScanAttempts(prev => prev + 1);
            
            // Optional: Draw detection box (can impact performance)
            const drawingCtx = Quagga.canvas.ctx.overlay;
            const drawingCanvas = Quagga.canvas.dom.overlay;
            
            if (result && drawingCtx && drawingCanvas) {
              drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
              
              if (result.boxes) {
                result.boxes.forEach(box => {
                  if (box !== result.box) {
                    drawingCtx.strokeStyle = "green";
                    drawingCtx.strokeRect(box[0].x, box[0].y, box[1].x - box[0].x, box[1].y - box[0].y);
                  }
                });
              }
              
              if (result.box) {
                drawingCtx.strokeStyle = "blue";
                drawingCtx.strokeRect(result.box[0].x, result.box[0].y, result.box[1].x - result.box[0].x, result.box[1].y - result.box[0].y);
              }
            }
          });

          Quagga.onDetected((data) => {
            console.log('Barcode detected:', data);
            
            if (data && data.codeResult && data.codeResult.code) {
              const code = data.codeResult.code;
              const confidence = data.codeResult.confidence || 0;
              
              console.log(`Detected code: ${code}, confidence: ${confidence}`);
              
              // Require minimum confidence and prevent duplicate rapid scans
              if (confidence > 50 && code !== lastScannedCode) {
                detectionCount.current++;
                
                // Require multiple detections for reliability (iPhone camera can be shaky)
                if (detectionCount.current >= 2) {
                  setLastScannedCode(code);
                  console.log('Barcode confirmed:', code);
                  
                  try {
                    Quagga.stop();
                    quaggaInitialized.current = false;
                  } catch (stopErr) {
                    console.warn('Error stopping Quagga:', stopErr);
                  }
                  
                  onBarcodeDetected(code);
                }
              }
            }
          });

          // Start scanning
          Quagga.start();
          quaggaInitialized.current = true;
          setIsScanning(true);
          setIsInitializing(false);
          setQuaggaReady(true);
          
          console.log('Quagga started successfully');
          
        } catch (startErr) {
          console.error('Error starting Quagga:', startErr);
          setError('Failed to start scanner: ' + startErr.message);
          setIsInitializing(false);
        }
      });

    } catch (err) {
      console.error('Quagga setup error:', err);
      setError('Scanner setup failed: ' + err.message);
      setIsInitializing(false);
    }
  }, [facingMode, lastScannedCode, onBarcodeDetected, isQuaggaAvailable]);

  // Initialize scanner
  useEffect(() => {
    let mounted = true;
    
    const initScanner = async () => {
      if (!mounted) return;
      
      // Check camera permission
      try {
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'camera' });
          setCameraPermission(permission.state);
          
          permission.addEventListener('change', () => {
            setCameraPermission(permission.state);
          });
        }
      } catch (err) {
        console.warn('Permission check failed:', err);
      }

      // Small delay for iPhone to ensure DOM is ready
      setTimeout(() => {
        if (mounted && videoRef.current) {
          initializeQuagga();
        }
      }, 500);
    };

    initScanner();

    return () => {
      mounted = false;
      
      if (quaggaInitialized.current && window.Quagga) {
        try {
          window.Quagga.stop();
        } catch (err) {
          console.warn('Cleanup error:', err);
        }
        quaggaInitialized.current = false;
      }
    };
  }, [initializeQuagga]);

  const handleClose = () => {
    if (quaggaInitialized.current && window.Quagga) {
      try {
        window.Quagga.stop();
      } catch (err) {
        console.warn('Error stopping Quagga on close:', err);
      }
    }
    onClose();
  };

  const toggleCamera = () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    setIsScanning(false);
    setQuaggaReady(false);
    setScanAttempts(0);
    detectionCount.current = 0;
    
    // Reinitialize with new camera
    setTimeout(() => {
      initializeQuagga();
    }, 300);
  };

  const handleManualInput = () => {
    const code = prompt('Enter barcode manually:');
    if (code && code.trim()) {
      onBarcodeDetected(code.trim());
    }
  };

  const retryScanner = () => {
    setError(null);
    setIsScanning(false);
    setQuaggaReady(false);
    setScanAttempts(0);
    detectionCount.current = 0;
    initializeQuagga();
  };

  const handleVideoClick = () => {
    // For iPhone - sometimes helps with video playback issues
    if (videoRef.current) {
      try {
        videoRef.current.play();
      } catch (err) {
        console.warn('Manual video play failed:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white bg-black bg-opacity-75">
        <h3 className="text-lg font-semibold">Scan Barcode</h3>
        <div className="flex gap-2">
          {quaggaReady && (
            <button
              onClick={toggleCamera}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              title="Switch Camera"
            >
              <RotateCcw size={20} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scanner Content */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full text-white text-center p-4">
            <div className="max-w-sm">
              <AlertTriangle className="text-4xl mx-auto mb-4 text-yellow-400" />
              <p className="text-lg mb-2">Scanner Error</p>
              <p className="text-sm opacity-75 mb-6">{error}</p>
              
              {cameraPermission === 'denied' && (
                <div className="text-xs opacity-75 mb-6 p-4 bg-red-500 bg-opacity-20 rounded-lg">
                  <p className="font-semibold mb-2">Camera Access Required</p>
                  <p>Please allow camera access:</p>
                  <p>1. Tap the camera icon in your browser's address bar</p>
                  <p>2. Select "Allow"</p>
                  <p>3. Refresh the page</p>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={retryScanner}
                  className="block w-full px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Retry Scanner
                </button>
                <button
                  onClick={handleManualInput}
                  className="block w-full px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Enter Manually
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Video Element */}
            <div 
              ref={videoRef} 
              className="w-full h-full relative cursor-pointer"
              onClick={handleVideoClick}
            />
            
            {/* Loading Overlay */}
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg">Initializing Scanner...</p>
                  <p className="text-sm opacity-75 mt-2">
                    {!isQuaggaAvailable() ? 'Loading QuaggaJS...' : 'Starting camera...'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Scanning Frame Overlay */}
            {quaggaReady && isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Main scanning frame */}
                  <div className="w-72 h-44 border-2 border-white border-opacity-50 rounded-lg relative">
                    {/* Animated scanning line */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 shadow-lg shadow-red-500/50 animate-pulse"></div>
                  </div>
                  
                  {/* Corner indicators */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                </div>
              </div>
            )}

            {/* Scan Status */}
            {scanAttempts > 0 && quaggaReady && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Scanning... ({scanAttempts})</span>
                </div>
              </div>
            )}

            {/* Detection confidence indicator */}
            {detectionCount.current > 0 && (
              <div className="absolute top-4 right-4 bg-yellow-600 bg-opacity-80 text-white px-3 py-2 rounded-lg text-sm">
                Detections: {detectionCount.current}/2
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="p-4 text-center text-white bg-black bg-opacity-75">
        {isInitializing && !error && (
          <p className="text-sm opacity-75">Setting up camera and scanner...</p>
        )}
        
        {quaggaReady && isScanning && (
          <>
            <p className="text-sm mb-2 opacity-90">
              Point camera at barcode within the frame
            </p>
            <p className="text-xs opacity-60 mb-4">
              Using {facingMode} camera • Tap screen if needed • QuaggaJS Scanner
            </p>
          </>
        )}
        
        {!isInitializing && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleManualInput}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Manual Entry
            </button>
            {!isQuaggaAvailable() && (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Reload Page
              </button>
            )}
          </div>
        )}
        
        {/* Library status */}
        <div className="mt-3 text-xs opacity-50">
          {isQuaggaAvailable() ? '✓ QuaggaJS Ready' : '⚠ QuaggaJS Not Loaded'}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;