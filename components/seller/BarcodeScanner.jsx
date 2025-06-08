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

  // Load Quagga dynamically
  useEffect(() => {
    const loadQuagga = async () => {
      try {
        // Import Quagga dynamically (you’ll need to install it: npm install quagga)
        const QuaggaModule = await import('quagga');
        Quagga = QuaggaModule.default;
        setQuaggaLoaded(true);
      } catch (err) {
        console.error('Failed to load Quagga:', err);
        setError('Failed to load barcode scanner library');
      }
    };

    loadQuagga();

  }, []);

  // Start Quagga scanner
  useEffect(() => {
    if (!quaggaLoaded || !Quagga || !scannerRef.current) return;

    let mounted = true;

    const startScanner = () => {
      setError('');
      setIsScanning(true);

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 320,
            height: 240,
            facingMode: "environment" // Use back camera
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader"
          ]
        },
        locate: true
      }, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          if (mounted) {
            setError('Unable to access camera. Please check permissions.');
            setIsScanning(false);
          }
          return;
        }

        if (mounted) {
          console.log("Quagga initialization finished. Ready to start");
          Quagga.start();
          setIsScanning(true);
        }
      });

      // Set up barcode detection handler
      Quagga.onDetected((result) => {
        if (!scanningActive || !mounted) return;

        const code = result.codeResult.code;
        console.log('Barcode detected:', code);

        // Validate EAN-13 format (13 digits)
        if (code && /^\d{13}$/.test(code)) {
          setScanningActive(false);
          Quagga.stop();
          onBarcodeDetected(code);
        }
      });

      // Handle processing errors
      Quagga.onProcessed((result) => {
        if (!mounted) return;

        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
          // Clear previous drawings
          drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));

          // Draw bounding box around detected code
          if (result.codeResult && result.codeResult.code) {
            drawingCtx.strokeStyle = '#00ff00';
            drawingCtx.lineWidth = 3;

            if (result.line) {
              drawingCtx.beginPath();
              drawingCtx.moveTo(result.line[0].x, result.line[0].y);
              drawingCtx.lineTo(result.line[1].x, result.line[1].y);
              drawingCtx.stroke();
            }

            // Draw bounding box
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
      });
    };

    startScanner();

    return () => {
      mounted = false;
      setScanningActive(false);
      if (Quagga) {
        Quagga.stop();
        Quagga.offDetected();
        Quagga.offProcessed();
      }
    };

  }, [quaggaLoaded, onBarcodeDetected, scanningActive]);

  const handleClose = () => {
    setScanningActive(false);
    if (Quagga) {
      Quagga.stop();
    }
    onClose();
  };

  const handleManualInput = () => {
    const barcode = prompt('Enter EAN-13 barcode (13 digits):');
    if (barcode && barcode.trim() && /^\d{13}$/.test(barcode.trim())) {
      setScanningActive(false);
      if (Quagga) {
        Quagga.stop();
      }
      onBarcodeDetected(barcode.trim());
    } else if (barcode && barcode.trim()) {
      alert('Please enter a valid 13-digit EAN-13 barcode');
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
              EAN-13 Barcode Scanner
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
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={handleManualInput}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Enter Manually
                </button>
              </div>
            ) : !quaggaLoaded ? (
              <div className="text-center py-8">
                <FaSpinner className="text-indigo-500 text-4xl mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading scanner...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Camera Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <div
                    ref={scannerRef}
                    className="w-full h-64 flex items-center justify-center"
                    style={{ minHeight: '240px' }}
                  >
                    {isScanning && scanningActive && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="border-2 border-white border-dashed w-3/4 h-20 rounded-lg flex items-center justify-center">
                          <div className="flex items-center gap-2 text-white">
                            <FaSpinner className="animate-spin" />
                            <span>Scanning for EAN-13...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-center text-gray-600">
                  <p className="text-sm">Point your camera at an EAN-13 barcode</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Make sure the barcode is clearly visible and well-lit
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    EAN-13 barcodes have 13 digits
                  </p>
                </div>

                {/* Manual Input Button */}
                <button
                  onClick={handleManualInput}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <FaBarcode />
                  Enter EAN-13 Manually
                </button>
              </div>
            )}
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
};

export default BarcodeScanner;
