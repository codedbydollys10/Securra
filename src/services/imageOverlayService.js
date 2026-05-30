// src/services/imageOverlayService.js
// Image overlay and watermark service

/**
 * Overlay text and metadata on image canvas
 * Adds timestamp and location name to image
 */
export const overlayImageData = (canvas, overlayData) => {
  const { timestamp, locationName, latitude, longitude } = overlayData;

  const context = canvas.getContext("2d");
  
  // Set up overlay styling
  const fontSize = Math.max(canvas.width / 50, 14); // Responsive font size
  context.font = `bold ${fontSize}px Arial, sans-serif`;
  context.fillStyle = "white";
  context.strokeStyle = "rgba(0, 0, 0, 0.7)";
  context.lineWidth = 3;
  context.textAlign = "left";

  // Format timestamp
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString("en-IN");
  const timeStr = date.toLocaleTimeString("en-IN");
  const timestampText = `${dateStr} ${timeStr}`;

  // Prepare text lines
  const lines = [
    `📍 Location: ${locationName}`,
    `📅 Time: ${timestampText}`,
    `Lat: ${latitude.toFixed(4)} | Lon: ${longitude.toFixed(4)}`,
  ];

  // Draw semi-transparent background bar
  const padding = fontSize / 2;
  const lineHeight = fontSize * 1.8;
  const totalHeight = lines.length * lineHeight + padding * 2;
  const bgWidth = canvas.width;

  // Background rectangle
  context.fillStyle = "rgba(0, 0, 0, 0.6)";
  context.fillRect(0, canvas.height - totalHeight, bgWidth, totalHeight);

  // Draw text lines
  context.fillStyle = "white";
  context.strokeStyle = "rgba(0, 0, 0, 0.8)";
  context.lineWidth = 2;
  
  let yPosition = canvas.height - totalHeight + padding + fontSize;
  
  lines.forEach((line) => {
    // Draw stroke (outline) for better visibility
    context.strokeText(line, padding, yPosition);
    context.fillText(line, padding, yPosition);
    yPosition += lineHeight;
  });

  return canvas;
};

/**
 * Overlay data on image and return base64
 */
export const overlayAndConvert = async (canvas, overlayData) => {
  const overlaidCanvas = overlayImageData(canvas, overlayData);
  return overlaidCanvas.toDataURL("image/jpeg", 0.9);
};

/**
 * Create a watermarked canvas with metadata
 */
export const createWatermarkedCanvas = (sourceCanvas, metadata) => {
  // Clone the source canvas
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const context = canvas.getContext("2d");
  
  // Draw original image
  context.drawImage(sourceCanvas, 0, 0);

  // Overlay metadata
  const overlayData = {
    timestamp: metadata.timestamp || new Date(),
    locationName: metadata.locationName || "Unknown Location",
    latitude: metadata.latitude || 0,
    longitude: metadata.longitude || 0,
  };

  overlayImageData(canvas, overlayData);

  return canvas;
};

/**
 * Add EXIF metadata to image (if supported)
 * This stores geolocation in image metadata
 */
export const addExifMetadata = (imageData, metadata) => {
  // Note: EXIF writing in browser is limited without external libraries
  // This is a placeholder for EXIF support
  // In production, use: https://github.com/jnordberg/iptcdata or piexifjs
  
  console.log("EXIF metadata (for reference):", {
    GPSLatitude: metadata.latitude,
    GPSLongitude: metadata.longitude,
    DateTime: metadata.timestamp,
    LocationName: metadata.locationName,
  });

  // Return original image data (EXIF writing requires additional libraries)
  return imageData;
};
