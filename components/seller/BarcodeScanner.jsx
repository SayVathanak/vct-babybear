'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';

// --- SVG Icons (replaces react-icons dependency) ---
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


// Main Component
const BarcodeScanner = ({ onBarcodeDetected, onClose }) => {
  // Refs for DOM elements and other persistent values
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const codeReaderRef = useRef(null);

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Camera feature states
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // --- Core Functions ---

  /**
   * Stops the current camera stream and tracks.
   */
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      console.log("Stopping all video tracks.");
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);
  
  /**
   * Initializes and starts the camera stream.
   * This is the heart of the component's camera logic.
   */
  const startCamera = useCallback(async () => {
    // 1. Reset state for a fresh start
    setIsLoading(true);
    setError(null);
    stopStream();

    try {
      // 2. Define flexible video constraints.
      // Prioritize the selected camera ID if available, otherwise default to the rear camera.
      const constraints = {
        video: {
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
          facingMode: selectedCameraId ? undefined : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      console.log("Requesting media stream with constraints:", constraints.video);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // 3. Enumerate devices *after* getting permission, which is more reliable.
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);

      // If no camera was pre-selected, set the current one as selected.
      if (!selectedCameraId && stream.getVideoTracks().length > 0) {
        const currentTrack = stream.getVideoTracks()[0];
        const currentDeviceId = currentTrack.getSettings().deviceId;
        setSelectedCameraId(currentDeviceId || videoDevices[0]?.deviceId || '');
      }
      
      // 4. Attach stream to the video element.
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // 5. Check for Torch/Flashlight capability.
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities();
          console.log("Camera capabilities:", capabilities);
          setTorchSupported(!!capabilities.torch);
        }

        // 6. Start the scanning process.
        setIsLoading(false);
        setIsScanning(true);
      }
    } catch (err) {
      console.error("CAMERA ERROR:", err);
      let errorMessage = 'Failed to access camera.';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'The requested camera resolution is not supported by your device.';
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [selectedCameraId, stopStream]);

  // --- Lifecycle Effect ---

  useEffect(() => {
    startCamera();

    // Cleanup function: This is crucial for stopping the camera when the component unmounts.
    return () => {
      console.log("BarcodeScanner component unmounting. Cleaning up.");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopStream();
    };
  }, [selectedCameraId]); // Re-run only when the selected camera changes.
  
  // --- Scanning Logic ---

  /**
   * The main scanning loop that uses requestAnimationFrame for performance.
   */
  useEffect(() => {
    let isMounted = true;
    
    const scanFrame = async () => {
      if (!isMounted || !isScanning || !videoRef.current || !canvasRef.current || !codeReaderRef.current) {
        return;
      }

      // Check if video is ready to be scanned
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          // Use ZXing to decode the barcode from the canvas
          const result = codeReaderRef.current.decodeFromCanvas(canvas);
          
          const now = Date.now();
          if (now - lastScanTimeRef.current > 2000) { // 2-second cooldown
            lastScanTimeRef.current = now;
            console.log("Barcode Detected:", result.getText());
            onBarcodeDetected(result.getText());
          }
        } catch (err) {
          // This error is expected when no barcode is found in a frame.
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    if (isScanning && !codeReaderRef.current) {
      // FIX: Dynamically import the ZXing library from a CDN
      import('https://unpkg.com/@zxing/browser@0.1.4/esm/index.js').then(({ BrowserMultiFormatReader }) => {
        if (isMounted) {
            codeReaderRef.current = new BrowserMultiFormatReader();
            console.log("ZXing library loaded. Starting scan loop.");
            scanFrame();
        }
      }).catch(err => {
        console.error("Failed to load ZXing library:", err);
        setError("Could not load scanner library. Please check your internet connection and try again.");
      });
    } else if (isScanning) {
      scanFrame();
    }

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScanning, onBarcodeDetected]);

  // --- UI Handlers ---

  const handleClose = useCallback(() => {
    setIsScanning(false);
    onClose();
  }, [onClose]);

  const handleRetry = useCallback(() => {
    startCamera();
  }, [startCamera]);

  const handleCameraSwitch = useCallback((event) => {
    const deviceId = event.target.value;
    console.log("Switching camera to:", deviceId);
    setSelectedCameraId(deviceId);
  }, []);

  const handleToggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;

    const track = streamRef.current.getVideoTracks()[0];
    const newTorchState = !isTorchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setIsTorchOn(newTorchState);
      console.log(`Torch turned ${newTorchState ? 'ON' : 'OFF'}`);
    } catch (err) {
      console.error("Failed to toggle torch:", err);
    }
  }, [isTorchOn, torchSupported]);
  
  // --- Render Logic ---

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <header className="bg-black bg-opacity-50 p-3 z-10">
        <div className="flex items-center justify-between text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <IconCamera />
            <span>Scan Barcode</span>
          </h2>
          <div className="flex items-center gap-2">
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
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
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
        {/* Video feed */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        {/* Hidden canvas for processing frames */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlays */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white text-center p-4">
            <IconSpinner className="text-4xl mb-4" />
            <p className="text-lg">Starting Camera...</p>
            <p className="text-sm text-gray-300 mt-1">Please grant camera permission.</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white text-center p-4">
            <IconExclamationTriangle className="text-red-500 text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Camera Error</h3>
            <p className="text-gray-300 mb-6 max-w-sm">{error}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 bg-blue-600 text-white py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconRedo />
              <span>Try Again</span>
            </button>
          </div>
        )}
        
        {/* Scanning Overlay UI */}
        {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-11/12 max-w-sm h-48 border-4 border-green-500 border-dashed rounded-lg" />
            </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
