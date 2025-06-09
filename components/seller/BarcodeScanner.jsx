'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script'

// SVG Icons
const IconCamera = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2-2h-3l-2.5-3z"></path>
    <circle cx="12" cy="13" r="3"></circle>
  </svg>
);

const IconTimes = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const IconSpinner = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" {...props}>
    <line x1="12" y1="2" x2="12" y2="6"></line>
    <line x1="12" y1="18" x2="12" y2="22"></line>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
    <line x1="2" y1="12" x2="6" y2="12"></line>
    <line x1="18" y1="12" x2="22" y2="12"></line>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
  </svg>
);

const IconExclamationTriangle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const IconRedo = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="23 4 23 10 17 10"></polyline>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
);

const IconLightbulb = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15.09 14.37a5 5 0 0 1-6.18 0M12 20v-4M12 4V2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
    <path d="M9 18h6a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4Z"></path>
  </svg>
);

const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanningIntervalRef = useRef(null);
  const codeReaderRef = useRef(null);
  const lastScanTimeRef = useRef(0);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isZxingLoaded, setIsZxingLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Camera feature states
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Clean up function
  const cleanup = useCallback(() => {
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (e) {
        console.log('Error resetting code reader:', e);
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    cleanup();

    try {
      // Get available cameras first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);

      // Set up camera constraints
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: selectedCameraId ? undefined : { ideal: 'environment' },
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
              .then(resolve)
              .catch(reject);
          };
          videoRef.current.onerror = reject;
        });

        // Set up torch capability
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities();
          setTorchSupported(!!capabilities.torch);
          
          // Set camera ID if not already set
          if (!selectedCameraId) {
            const settings = track.getSettings();
            setSelectedCameraId(settings.deviceId || '');
          }
        }

        setIsLoading(false);
        setIsScanning(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      let errorMessage = 'Failed to access camera.';
      
      switch (err.name) {
        case 'NotAllowedError':
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
          break;
        case 'NotFoundError':
          errorMessage = 'No camera found on this device.';
          break;
        case 'NotReadableError':
          errorMessage = 'Camera is already in use by another application.';
          break;
        case 'OverconstrainedError':
          errorMessage = 'Camera constraints not supported. Trying with basic settings...';
          // Retry with basic constraints
          setTimeout(() => {
            setSelectedCameraId('');
            startCamera();
          }, 1000);
          return;
        default:
          errorMessage = `Camera error: ${err.message}`;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [selectedCameraId, cleanup]);

  // Initialize camera on mount and when camera changes
  useEffect(() => {
    startCamera();
    return cleanup;
  }, [startCamera, cleanup]);

  // Barcode scanning logic
  useEffect(() => {
    if (!isScanning || !isZxingLoaded || !videoRef.current || !canvasRef.current) {
      return;
    }

    // Initialize ZXing reader
    if (!codeReaderRef.current && window.ZXingBrowser) {
      try {
        codeReaderRef.current = new window.ZXingBrowser.BrowserMultiFormatReader();
        console.log('ZXing BrowserMultiFormatReader initialized');
      } catch (err) {
        console.error('Failed to initialize ZXing reader:', err);
        setError('Failed to initialize barcode scanner');
        return;
      }
    }

    if (!codeReaderRef.current) {
      return;
    }

    // Start scanning with interval-based approach for better reliability
    scanningIntervalRef.current = setInterval(() => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          return;
        }

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (canvas.width === 0 || canvas.height === 0) {
          return;
        }

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Try to decode barcode
        try {
          const result = codeReaderRef.current.decodeFromCanvas(canvas);
          
          if (result && result.getText()) {
            const now = Date.now();
            const barcodeText = result.getText().trim();
            
            // Prevent duplicate scans
            if (now - lastScanTimeRef.current > 2000 && barcodeText) {
              lastScanTimeRef.current = now;
              console.log('Barcode detected:', barcodeText);
              
              // Stop scanning before calling the callback
              setIsScanning(false);
              cleanup();
              
              // Call the callback
              onBarcodeDetected(barcodeText);
            }
          }
        } catch (decodeError) {
          // No barcode found in this frame - this is normal
          if (debugMode && decodeError.message !== 'No MultiFormat Readers were able to detect the code.') {
            console.log('Decode attempt:', decodeError.message);
          }
        }
      } catch (scanError) {
        console.error('Scanning error:', scanError);
      }
    }, 100); // Scan every 100ms

    return () => {
      if (scanningIntervalRef.current) {
        clearInterval(scanningIntervalRef.current);
        scanningIntervalRef.current = null;
      }
    };
  }, [isScanning, isZxingLoaded, onBarcodeDetected, debugMode, cleanup]);

  // Event handlers
  const handleClose = useCallback(() => {
    setIsScanning(false);
    cleanup();
    onClose();
  }, [onClose, cleanup]);

  const handleRetry = useCallback(() => {
    startCamera();
  }, [startCamera]);

  const handleCameraSwitch = useCallback((event) => {
    setSelectedCameraId(event.target.value);
  }, []);

  const handleToggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    const newTorchState = !isTorchOn;
    
    try {
      await track.applyConstraints({
        advanced: [{ torch: newTorchState }]
      });
      setIsTorchOn(newTorchState);
    } catch (err) {
      console.error("Failed to toggle torch:", err);
    }
  }, [isTorchOn, torchSupported]);

  return (
    <>
      <Script
        src="https://unpkg.com/@zxing/browser@0.1.4/umd/zxing-browser.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('ZXing library loaded successfully');
          setIsZxingLoaded(true);
        }}
        onError={() => {
          console.error("Failed to load ZXing script");
          setError("Could not load barcode scanning library. Please check your internet connection.");
        }}
      />

      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Header */}
        <header className="bg-black bg-opacity-50 p-3 z-10">
          <div className="flex items-center justify-between text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IconCamera />
              <span>Scan Barcode</span>
            </h2>
            <div className="flex items-center gap-2">
              {/* Debug toggle (remove in production) */}
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`p-2 rounded-full text-xs transition-colors ${
                  debugMode ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Toggle Debug Mode"
              >
                DBG
              </button>
              
              {torchSupported && (
                <button
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-full transition-colors ${
                    isTorchOn ? 'bg-yellow-400 text-black' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title="Toggle Flashlight"
                >
                  <IconLightbulb />
                </button>
              )}
              
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
                title="Close Scanner"
              >
                <IconTimes />
              </button>
            </div>
          </div>
          
          {cameras.length > 1 && !isLoading && (
            <div className="mt-2">
              <select
                value={selectedCameraId}
                onChange={handleCameraSwitch}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2 text-sm"
              >
                {cameras.map((camera) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${camera.deviceId.substring(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white p-4">
              <IconSpinner className="text-4xl mb-4" />
              <p className="text-lg">Starting Camera...</p>
              <p className="text-sm text-gray-300 mt-2">
                {!isZxingLoaded && "Loading barcode scanner..."}
              </p>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white text-center p-4">
              <IconExclamationTriangle className="text-red-500 text-4xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Scanner Error</h3>
              <p className="text-gray-300 mb-6 max-w-sm">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 bg-blue-600 py-2 px-5 rounded-lg hover:bg-blue-700"
              >
                <IconRedo />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {/* Scanning Overlay */}
          {isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Scanning frame */}
              <div className="relative w-11/12 max-w-sm h-48">
                <div className="w-full h-full border-4 border-green-500 border-dashed rounded-lg animate-pulse" />
                <div className="absolute -bottom-8 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                    Point camera at barcode
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Debug info */}
          {debugMode && isScanning && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs max-w-xs">
              <p>Video: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}</p>
              <p>Ready State: {videoRef.current?.readyState || 'N/A'}</p>
              <p>ZXing Loaded: {isZxingLoaded ? 'Yes' : 'No'}</p>
              <p>Reader: {codeReaderRef.current ? 'Ready' : 'Not Ready'}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BarcodeScanner;