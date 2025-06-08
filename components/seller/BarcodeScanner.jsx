'use client'
import React, { useState, useEffect, useRef } from 'react';
import { FaBarcode, FaTimes, FaCamera, FaExclamationTriangle, FaSpinner, FaMobile } from 'react-icons/fa';
import { Transition } from '@headlessui/react';

// Dynamically import Quagga to avoid SSR issues
let Quagga = null;

const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [quaggaLoaded, setQuaggaLoaded] = useState(false);
  const [scanningActive, setScanningActive] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [detectedCodes, setDetectedCodes] = useState(new Set());
  const [isIOS, setIsIOS] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('unknown');
  const timeoutRef = useRef(null);
  const cleanupRef = useRef(false);

  // Detect iOS device
  useEffect(() => {
    const detectIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };
    setIsIOS(detectIOS());
  }, []);

  // Load Quagga dynamically
  useEffect(() => {
    const loadQuagga = async () => {
      try {
        const QuaggaModule = await import('quagga');
        Quagga = QuaggaModule.default;
        setQuaggaLoaded(true);
      } catch (err) {
        console.error('Failed to load Quagga:', err);
        setError('Failed to load barcode scanner library. Please try again or enter the barcode manually.');
      }
    };

    loadQuagga();
  }, []);

  // Check camera permissions (especially important for iOS)
  const checkCameraPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        setCameraPermission(permission.state);
        return permission.state === 'granted';
      }
      return true; // Assume granted if we can't check
    } catch (err) {
      console.log('Permission check not supported');
      return true;
    }
  };

  // Cleanup function
  const cleanup = () => {
    cleanupRef.current = true;
    setScanningActive(false);
    setIsInitializing(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (Quagga) {
      try {
        Quagga.stop();
        Quagga.offDetected();
        Quagga.offProcessed();
      } catch (cleanupErr) {
        console.error('Error during Quagga cleanup:', cleanupErr);
      }
    }
  };

  // Start Quagga scanner with iOS optimizations
  useEffect(() => {
    if (!quaggaLoaded || !Quagga || !scannerRef.current || isInitializing) return;

    cleanupRef.current = false;

    const startScanner = async () => {
      // Check permissions first (important for iOS)
      const hasPermission = await checkCameraPermission();
      if (!hasPermission && cameraPermission === 'denied') {
        setError('Camera access denied. Please enable camera permissions in your browser settings and refresh the page.');
        return;
      }

      // Add a small delay to ensure DOM is fully ready
      timeoutRef.current = setTimeout(() => {
        if (cleanupRef.current || !scannerRef.current) return;

        setError('');
        setIsInitializing(true);

        const scannerElement = scannerRef.current;
        if (!scannerElement) {
          console.error('Scanner element not found');
          setError('Scanner initialization failed');
          setIsInitializing(false);
          return;
        }

        // iOS-optimized dimensions
        const isMobile = window.innerWidth < 768;
        const width = isMobile ? Math.min(320, window.innerWidth - 32) : 320;
        const height = isMobile ? Math.min(240, (window.innerWidth - 32) * 0.75) : 240;

        scannerElement.style.width = `${width}px`;
        scannerElement.style.height = `${height}px`;

        // iOS-optimized Quagga configuration
        const config = {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerElement,
            constraints: {
              width: { min: 320, ideal: isIOS ? 640 : 800, max: isIOS ? 1280 : 1920 },
              height: { min: 240, ideal: isIOS ? 480 : 600, max: isIOS ? 960 : 1080 },
              facingMode: "environment"
            }
          },
          locator: {
            patchSize: isIOS ? "small" : "medium", // Smaller patch for better iOS performance
            halfSample: isIOS ? true : false // Enable half sampling on iOS for performance
          },
          numOfWorkers: isIOS ? 1 : Math.min(navigator.hardwareConcurrency || 1, 2), // Single worker on iOS
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "code_128_reader",
              ...(isIOS ? [] : ["code_39_reader"]) // Fewer readers on iOS for performance
            ]
          },
          locate: true,
          frequency: isIOS ? 5 : 10 // Lower frequency on iOS
        };

        Quagga.init(config, (err) => {
          setIsInitializing(false);
          
          if (err) {
            console.error('Quagga initialization error:', err);
            if (!cleanupRef.current) {
              if (err.name === 'NotAllowedError') {
                setError(isIOS 
                  ? 'Camera access denied. Please allow camera access in Safari settings and refresh the page.'
                  : 'Camera access denied. Please allow camera permissions and try again.'
                );
              } else if (err.name === 'NotFoundError') {
                setError('No camera found. Please ensure your device has a camera.');
              } else if (err.name === 'OverconstrainedError') {
                setError(isIOS 
                  ? 'Camera not compatible. Please try using Safari browser.'
                  : 'Camera constraints not supported. Please try a different device.'
                );
              } else {
                setError(isIOS 
                  ? 'Unable to access camera. Please ensure you\'re using Safari and have allowed camera access.'
                  : 'Unable to access camera. Please check permissions and try again.'
                );
              }
              setIsScanning(false);
            }
            return;
          }

          if (!cleanupRef.current && scannerRef.current) {
            console.log("Quagga initialization finished. Ready to start");
            try {
              Quagga.start();
              setIsScanning(true);
            } catch (startErr) {
              console.error('Error starting Quagga:', startErr);
              setError('Failed to start camera scanner');
              setIsScanning(false);
            }
          }
        });

        // Set up barcode detection handler with iOS-optimized debouncing
        Quagga.onDetected((result) => {
          if (!scanningActive || cleanupRef.current) return;

          const code = result.codeResult.code;
          
          // Skip if we've already detected this code recently
          if (detectedCodes.has(code)) return;
          
          console.log('Barcode detected:', code);

          // Validate barcode format
          if (code && (/^\d{13}$/.test(code) || /^\d{8}$/.test(code) || /^[A-Za-z0-9]{6,}$/.test(code))) {
            setDetectedCodes(prev => new Set([...prev, code]));
            setScanningActive(false);
            
            // Longer delay for iOS to prevent double scanning
            setTimeout(() => {
              if (!cleanupRef.current) {
                cleanup();
                onBarcodeDetected(code);
              }
            }, isIOS ? 200 : 100);
          }
        });

        // Simplified processing for iOS (less visual feedback to improve performance)
        if (!isIOS) {
          Quagga.onProcessed((result) => {
            if (cleanupRef.current) return;

            try {
              const drawingCtx = Quagga.canvas.ctx.overlay;
              const drawingCanvas = Quagga.canvas.dom.overlay;

              if (result && drawingCtx && drawingCanvas) {
                drawingCtx.clearRect(0, 0, 
                  parseInt(drawingCanvas.getAttribute("width")) || width, 
                  parseInt(drawingCanvas.getAttribute("height")) || height
                );

                if (result.codeResult && result.codeResult.code) {
                  drawingCtx.strokeStyle = '#00ff00';
                  drawingCtx.lineWidth = 2;

                  if (result.line) {
                    drawingCtx.beginPath();
                    drawingCtx.moveTo(result.line[0].x, result.line[0].y);
                    drawingCtx.lineTo(result.line[1].x, result.line[1].y);
                    drawingCtx.stroke();
                  }
                }
              }
            } catch (drawErr) {
              console.warn('Error in drawing overlay:', drawErr);
            }
          });
        }
      }, isIOS ? 200 : 100); // Longer delay for iOS
    };

    startScanner();

    return cleanup;
  }, [quaggaLoaded, onBarcodeDetected, scanningActive, isIOS]);

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const handleManualInput = () => {
    const barcode = prompt('Enter barcode:');
    if (barcode && barcode.trim()) {
      const trimmedBarcode = barcode.trim();
      if (/^\d{13}$/.test(trimmedBarcode) || /^\d{8}$/.test(trimmedBarcode) || /^[A-Za-z0-9]{6,}$/.test(trimmedBarcode)) {
        cleanup();
        onBarcodeDetected(trimmedBarcode);
      } else {
        alert('Please enter a valid barcode (EAN-13, EAN-8, or alphanumeric code)');
      }
    }
  };

  return (
    <Transition show={true} as="div">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Transition.Child
          as="div"
          className="fixed inset-0 bg-black bg-opacity-75"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          onClick={handleClose}
        />

        <Transition.Child
          as="div"
          className="relative bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden"
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaBarcode className="text-indigo-600" />
              Barcode Scanner
              {isIOS && <FaMobile className="text-gray-400 text-sm" title="iOS Optimized" />}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Scanner Content */}
          <div className="p-4">
            {error ? (
              <div className="text-center py-8">
                <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
                <p className="text-red-600 mb-4 text-sm leading-relaxed">{error}</p>
                {isIOS && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
                    <h4 className="font-semibold text-blue-800 text-sm mb-2">iPhone/iPad Tips:</h4>
                    <ul className="text-blue-700 text-xs space-y-1">
                      <li>• Use Safari browser for best compatibility</li>
                      <li>• Ensure camera permissions are enabled</li>
                      <li>• Make sure you're on HTTPS (not HTTP)</li>
                      <li>• Try refreshing the page if issues persist</li>
                    </ul>
                  </div>
                )}
                <button
                  onClick={handleManualInput}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Enter Manually
                </button>
              </div>
            ) : !quaggaLoaded || isInitializing ? (
              <div className="text-center py-8">
                <FaSpinner className="text-indigo-500 text-4xl mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">
                  {!quaggaLoaded ? 'Loading scanner...' : isIOS ? 'Initializing camera (this may take longer on iOS)...' : 'Initializing camera...'}
                </p>
                {isIOS && isInitializing && (
                  <p className="text-gray-500 text-sm mt-2">
                    Please allow camera access when prompted
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Camera Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden mx-auto" style={{ 
                  width: window.innerWidth < 768 ? Math.min(320, window.innerWidth - 32) : 320, 
                  height: window.innerWidth < 768 ? Math.min(240, (window.innerWidth - 32) * 0.75) : 240 
                }}>
                  <div
                    ref={scannerRef}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {isScanning && scanningActive && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="border-2 border-white border-dashed w-3/4 h-16 rounded-lg flex items-center justify-center">
                          <div className="flex items-center gap-2 text-white text-sm">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            <span>Scanning...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-center text-gray-600">
                  <p className="text-sm">Point your camera at a barcode</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Make sure the barcode is clearly visible and well-lit
                  </p>
                  {isIOS ? (
                    <p className="text-xs text-blue-600 mt-1">
                      iOS optimized • Works best in Safari
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      Supports EAN-13, EAN-8, Code 128, and Code 39
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleManualInput}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaBarcode />
                    Enter Manually
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};

export default BarcodeScanner;