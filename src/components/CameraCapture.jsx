// src/components/CameraCapture.jsx
import React, { useRef, useEffect, useState } from "react";
import { Camera, X, Check, RotateCcw, Loader } from "lucide-react";
import {
  requestCameraAccess,
  stopCameraStream,
  capturePhotoFromVideo,
  canvasToBase64,
} from "../services/cameraService";
import {
  getCurrentLocation,
  getLocationName,
} from "../services/geolocationService";
import { overlayAndConvert } from "../services/imageOverlayService";
import toast from "react-hot-toast";
import "./CameraCapture.css";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [locationData, setLocationData] = useState(null);

  // Initialize camera on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        setLoading(true);
        const cameraStream = await requestCameraAccess();
        setStream(cameraStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
          };
        }
      } catch (error) {
        toast.error(error.message || "Failed to access camera");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stopCameraStream(stream);
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current) return;

    try {
      setLoading(true);
      toast.loading("Capturing photo and location...");

      // Capture photo from video
      const photoCanvas = capturePhotoFromVideo(videoRef.current);

      // Get location
      const location = await getCurrentLocation();
      const locationInfo = await getLocationName(
        location.latitude,
        location.longitude
      );

      // Store location data for overlay
      const timestamp = new Date();
      const overlayData = {
        timestamp,
        locationName: locationInfo.locationName,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      setLocationData({
        ...overlayData,
        fullAddress: locationInfo.fullAddress,
        accuracy: location.accuracy,
      });

      // Create overlaid image
      const overlaidBase64 = await overlayAndConvert(photoCanvas, overlayData);

      // Convert to base64 for preview
      setCapturedImage(overlaidBase64);
      toast.dismiss();
      toast.success("Photo captured!");
    } catch (error) {
      toast.error(error.message || "Failed to capture photo");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!capturedImage || !locationData) {
      toast.error("Photo or location data missing");
      return;
    }

    try {
      // Pass captured data to parent component
      onCapture({
        image: capturedImage,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationName: locationData.locationName,
        fullAddress: locationData.fullAddress,
        timestamp: locationData.timestamp,
        accuracy: locationData.accuracy,
      });

      toast.success("Photo confirmed!");
    } catch (error) {
      toast.error(error.message || "Failed to process photo");
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setLocationData(null);
  };

  if (loading && !cameraReady) {
    return (
      <div className="camera-modal-overlay">
        <div className="camera-modal">
          <div className="loader-container">
            <Loader className="spinner" size={48} />
            <p>Accessing camera...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal">
        {/* Header */}
        <div className="camera-header">
          <h2>📸 Capture Incident Photo</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Camera Preview or Captured Image */}
        <div className="camera-preview-container">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-video"
              />
              <div className="camera-overlay-frame" />
            </>
          ) : (
            <>
              <img src={capturedImage} alt="Captured" className="captured-image" />
              {locationData && (
                <div className="location-info-overlay">
                  <p>✓ Location: {locationData.locationName}</p>
                  <p>✓ Timestamp: {locationData.timestamp.toLocaleString()}</p>
                  <p>✓ Accuracy: ±{Math.round(locationData.accuracy)}m</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Instructions */}
        {!capturedImage && cameraReady && (
          <div className="camera-instructions">
            <p>📍 Position the incident in the frame</p>
            <p>Location will be automatically captured</p>
          </div>
        )}

        {/* Buttons */}
        <div className="camera-actions">
          {!capturedImage ? (
            <button
              onClick={handleCapture}
              disabled={loading}
              className="capture-btn"
            >
              {loading ? (
                <>
                  <Loader size={20} className="spinner-small" /> Capturing...
                </>
              ) : (
                <>
                  <Camera size={20} /> Capture Photo
                </>
              )}
            </button>
          ) : (
            <>
              <button onClick={handleRetake} className="retake-btn">
                <RotateCcw size={20} /> Retake
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="confirm-btn"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="spinner-small" /> Confirming...
                  </>
                ) : (
                  <>
                    <Check size={20} /> Confirm & Continue
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Debug Info (optional) */}
        {process.env.NODE_ENV === "development" && locationData && (
          <div className="debug-info">
            <small>
              Lat: {locationData.latitude.toFixed(4)} | Lon:{" "}
              {locationData.longitude.toFixed(4)}
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
