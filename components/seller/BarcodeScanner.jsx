'use client'
import React, { useState, useEffect, useRef } from 'react';
import { FaBarcode, FaTimes, FaCamera, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
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
  const [detectedCodes, setDetectedCodes] = useState(new Set()); // Track detected codes
  const timeoutRef = useRef(null);
  const cleanupRef = useRef(false);

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

  // Start Quagga scanner
  useEffect(() => {
    if (!quaggaLoaded || !Quagga || !scannerRef.current || isInitializing) return;

    cleanupRef.current = false;

    const startScanner = () => {
      // Add a small delay to ensure DOM is fully ready
      timeoutRef.current = setTimeout(() => {
        if (cleanupRef.current || !scannerRef.current) return;

        setError('');
        setIsInitializing(true);

        // Ensure the scanner container has proper dimensions
        const scannerElement = scannerRef.current;
        if (!scannerElement) {
          console.error('Scanner element not found');
          setError('Scanner initialization failed');
          setIsInitializing(false);
          return;
        }

        // Set explicit dimensions on the container
        scannerElement.style.width = '320px';
        scannerElement.style.height = '240px';

        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerElement,
            constraints: {
              width: { min: 320, ideal: 640, max: 1920 },
              height: { min: 240, ideal: 480, max: 1080 },
              facingMode: "environment" // Use back camera
            }
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          numOfWorkers: Math.min(navigator.hardwareConcurrency || 1, 2),
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "code_128_reader", // Add more barcode types
              "code_39_reader"
            ]
          },
          locate: true,
          frequency: 10 // Reduce frequency to improve performance
        }, (err) => {
          setIsInitializing(false);
          
          if (err) {
            console.error('Quagga initialization error:', err);
            if (!cleanupRef.current) {
              if (err.name === 'NotAllowedError') {
                setError('Camera access denied. Please allow camera permissions and try again.');
              } else if (err.name === 'NotFoundError') {
                setError('No camera found. Please ensure your device has a camera.');
              } else if (err.name === 'OverconstrainedError') {
                setError('Camera constraints not supported. Please try a different device.');
              } else {
                setError('Unable to access camera. Please check permissions and try again.');
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

        // Set up barcode detection handler with debouncing
        Quagga.onDetected((result) => {
          if (!scanningActive || cleanupRef.current) return;

          const code = result.codeResult.code;
          
          // Skip if we've already detected this code recently
          if (detectedCodes.has(code)) return;
          
          console.log('Barcode detected:', code);

          // Validate barcode format (EAN-13, EAN-8, or other common formats)
          if (code && (/^\d{13}$/.test(code) || /^\d{8}$/.test(code) || /^[A-Za-z0-9]{6,}$/.test(code))) {
            setDetectedCodes(prev => new Set([...prev, code]));
            setScanningActive(false);
            
            // Delay to prevent double scanning
            setTimeout(() => {
              if (!cleanupRef.current) {
                cleanup();
                onBarcodeDetected(code);
              }
            }, 100);
          }
        });

        // Handle processing errors and visual feedback
        Quagga.onProcessed((result) => {
          if (cleanupRef.current) return;

          try {
            const drawingCtx = Quagga.canvas.ctx.overlay;
            const drawingCanvas = Quagga.canvas.dom.overlay;

            if (result && drawingCtx && drawingCanvas) {
              // Clear previous drawings
              drawingCtx.clearRect(0, 0, 
                parseInt(drawingCanvas.getAttribute("width")) || 320, 
                parseInt(drawingCanvas.getAttribute("height")) || 240
              );

              // Draw visual feedback for detected barcodes
              if (result.codeResult && result.codeResult.code) {
                drawingCtx.strokeStyle = '#00ff00';
                drawingCtx.lineWidth = 3;

                if (result.line) {
                  drawingCtx.beginPath();
                  drawingCtx.moveTo(result.line[0].x, result.line[0].y);
                  drawingCtx.lineTo(result.line[1].x, result.line[1].y);
                  drawingCtx.stroke();
                }

                // Draw bounding boxes
                if (result.boxes) {
                  drawingCtx.strokeStyle = '#ff0000';
                  result.boxes.filter(box => box !== result.box).forEach(box => {
                    Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: '#ff0000', lineWidth: 2 });
                  });
                }

                if (result.box) {
                  drawingCtx.strokeStyle = '#00ff00';
                  Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: '#00ff00', lineWidth: 2 });
                }
              }
            }
          } catch (drawErr) {
            console.warn('Error in drawing overlay:', drawErr);
          }
        });
      }, 100);
    };

    startScanner();

    return cleanup;
  }, [quaggaLoaded, onBarcodeDetected, scanningActive]);

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const handleManualInput = () => {
    const barcode = prompt('Enter barcode:');
    if (barcode && barcode.trim()) {
      const trimmedBarcode = barcode.trim();
      // Validate common barcode formats
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
                  {!quaggaLoaded ? 'Loading scanner...' : 'Initializing camera...'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Camera Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden mx-auto" style={{ width: '320px', height: '240px' }}>
                  <div
                    ref={scannerRef}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {isScanning && scanningActive && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="border-2 border-white border-dashed w-3/4 h-20 rounded-lg flex items-center justify-center">
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
                  <p className="text-xs text-gray-400 mt-1">
                    Supports EAN-13, EAN-8, Code 128, and Code 39
                  </p>
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