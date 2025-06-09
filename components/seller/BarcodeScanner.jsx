'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script'; // Import the Next.js Script component

// --- SVG Icons (replaces react-icons dependency) ---
// (Icons are included here for completeness but are unchanged from the previous version)
const IconCamera = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
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
    <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
  </svg>
);
const IconExclamationTriangle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);
const IconRedo = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
);
const IconLightbulb = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15.09 14.37a5 5 0 0 1-6.18 0M12 20v-4M12 4V2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path><path d="M9 18h6a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4Z"></path>
  </svg>
);

// Main Component
const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const codeReaderRef = useRef(null);
  const lastScanTimeRef = useRef(0);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isZxingLoaded, setIsZxingLoaded] = useState(false); // State to track script loading

  // Camera feature states
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // --- Core Functions ---
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    stopStream();

    try {
      const constraints = { video: { deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined, facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);

      if (!selectedCameraId && stream.getVideoTracks().length > 0) {
        const currentTrack = stream.getVideoTracks()[0];
        setSelectedCameraId(currentTrack.getSettings().deviceId || '');
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities();
          setTorchSupported(!!capabilities.torch);
        }
        setIsLoading(false);
        setIsScanning(true);
      }
    } catch (err) {
      console.error("CAMERA ERROR:", err);
      let errorMessage = 'Failed to access camera.';
      if (err.name === 'NotAllowedError') errorMessage = 'Camera permission denied.';
      else if (err.name === 'NotFoundError') errorMessage = 'No camera found.';
      else if (err.name === 'NotReadableError') errorMessage = 'Camera is already in use.';
      else if (err.name === 'OverconstrainedError') errorMessage = 'Camera resolution not supported.';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [selectedCameraId, stopStream]);

  // --- Lifecycle Effect ---
  useEffect(() => {
    startCamera();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      stopStream();
    };
  }, [startCamera, stopStream]);
  
  // --- Scanning Logic ---
  useEffect(() => {
    let isMounted = true;
    
    const scanFrame = () => {
      if (!isMounted || !isScanning || !videoRef.current || !canvasRef.current || !codeReaderRef.current) return;
      
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        try {
          const result = codeReaderRef.current.decodeFromCanvas(canvas);
          const now = Date.now();
          if (now - lastScanTimeRef.current > 2000) {
            lastScanTimeRef.current = now;
            onBarcodeDetected(result.getText());
          }
        } catch (err) { /* No barcode found */ }
      }
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    // Initialize the scanner once the ZXing script is loaded
    if (isScanning && isZxingLoaded && !codeReaderRef.current) {
      // Access the library from the window object
      if (window.ZXingBrowser) {
        codeReaderRef.current = new window.ZXingBrowser.BrowserMultiFormatReader();
        console.log("ZXing library loaded and ready. Starting scan loop.");
        scanFrame();
      } else {
          setError("Scanner library failed to initialize.");
      }
    }

    return () => { isMounted = false; };
  }, [isScanning, isZxingLoaded, onBarcodeDetected]);

  // --- UI Handlers ---
  const handleClose = useCallback(() => { setIsScanning(false); onClose(); }, [onClose]);
  const handleRetry = useCallback(() => { startCamera(); }, [startCamera]);
  const handleCameraSwitch = useCallback((event) => { setSelectedCameraId(event.target.value); }, []);
  const handleToggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    const newTorchState = !isTorchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: newTorchState }] });
      setIsTorchOn(newTorchState);
    } catch (err) { console.error("Failed to toggle torch:", err); }
  }, [isTorchOn, torchSupported]);
  
  // --- Render Logic ---
  return (
    <>
      {/* This Script component will load the ZXing library from a CDN at runtime.
        It will not be part of the server-side build, thus avoiding the error.
        Once loaded, it calls the onLoad function, setting our state to true.
      */}
      <Script
        src="https://unpkg.com/@zxing/browser@0.1.4/umd/zxing-browser.min.js"
        strategy="lazyOnload"
        onLoad={() => setIsZxingLoaded(true)}
        onError={() => {
            console.error("Failed to load ZXing script from CDN.");
            setError("Could not load scanner library. Check your internet connection.");
        }}
      />

      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Header */}
        <header className="bg-black bg-opacity-50 p-3 z-10">
          <div className="flex items-center justify-between text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IconCamera /><span>Scan Barcode</span>
            </h2>
            <div className="flex items-center gap-2">
              {torchSupported && (
                <button
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-full transition-colors ${ isTorchOn ? 'bg-yellow-400 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
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
              <select value={selectedCameraId} onChange={handleCameraSwitch} className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2 text-sm">
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
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlays */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white p-4">
              <IconSpinner className="text-4xl mb-4" />
              <p className="text-lg">Starting Camera...</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white text-center p-4">
              <IconExclamationTriangle className="text-red-500 text-4xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Scanner Error</h3>
              <p className="text-gray-300 mb-6 max-w-sm">{error}</p>
              <button onClick={handleRetry} className="flex items-center gap-2 bg-blue-600 py-2 px-5 rounded-lg hover:bg-blue-700">
                <IconRedo /><span>Try Again</span>
              </button>
            </div>
          )}
          {isScanning && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-11/12 max-w-sm h-48 border-4 border-green-500 border-dashed rounded-lg" /></div>}
        </div>
      </div>
    </>
  );
};

export default BarcodeScanner;