// src/services/cameraService.js
// Camera capture and image handling service

/**
 * Request camera access and return video stream
 * Tries rear camera first (for phones), falls back to front camera (for laptops)
 */
export const requestCameraAccess = async () => {
  try {
    // Try rear camera first (phones)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" }, // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      return stream;
    } catch (error) {
      // Fall back to front camera (laptops)
      console.log("Rear camera not available, switching to front camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Use front camera on laptops
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      return stream;
    }
  } catch (error) {
    if (error.name === "NotAllowedError") {
      throw new Error("Camera permission denied. Please enable camera access.");
    } else if (error.name === "NotFoundError") {
      throw new Error("No camera found on this device.");
    } else {
      throw new Error(`Camera error: ${error.message}`);
    }
  }
};

/**
 * Stop camera stream
 */
export const stopCameraStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
};

/**
 * Capture photo from video element and return canvas
 */
export const capturePhotoFromVideo = (videoElement) => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const context = canvas.getContext("2d");
    context.drawImage(videoElement, 0, 0);
    
    return canvas;
  } catch (error) {
    throw new Error(`Failed to capture photo: ${error.message}`);
  }
};

/**
 * Convert canvas to blob
 */
export const canvasToBlob = (canvas) => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      "image/jpeg",
      0.9
    );
  });
};

/**
 * Convert canvas to base64
 */
export const canvasToBase64 = (canvas) => {
  return canvas.toDataURL("image/jpeg", 0.9);
};

/**
 * Convert file to base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
