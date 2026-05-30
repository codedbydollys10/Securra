// src/services/geolocationService.js
// Geolocation and reverse geocoding service

/**
 * Get current device location
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported on this device"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Location permission denied. Please enable location access."));
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error("Location information not available."));
        } else if (error.code === error.TIMEOUT) {
          reject(new Error("Location request timed out. Please try again."));
        } else {
          reject(new Error(`Location error: ${error.message}`));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Get human-readable location name using reverse geocoding
 * Uses Open Street Map Nominatim API (free, no key required)
 */
export const getReverseGeocodingName = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Securra-App", // Nominatim requires User-Agent
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract location components from response
    const address = data.address || {};
    
    // Build location name: city/area, state
    let locationName = "";
    
    // Try different address components in order of preference
    const city = address.city || address.town || address.village || address.county;
    const state = address.state || address.province;
    const country = address.country;

    if (city && state) {
      locationName = `${city}, ${state}`;
    } else if (city) {
      locationName = city;
    } else if (state) {
      locationName = state;
    } else if (country) {
      locationName = country;
    } else {
      locationName = data.display_name?.split(",")[0] || "Unknown Location";
    }

    return {
      locationName,
      fullAddress: data.display_name,
      latitude,
      longitude,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    // Return generic location if API fails
    return {
      locationName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      fullAddress: "Coordinates provided",
      latitude,
      longitude,
    };
  }
};

/**
 * Get location name with fallback (tries multiple APIs)
 */
export const getLocationName = async (latitude, longitude) => {
  try {
    // Primary: Try Nominatim (OSM)
    return await getReverseGeocodingName(latitude, longitude);
  } catch (error) {
    console.warn("Nominatim failed, returning coordinates:", error);
    return {
      locationName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      fullAddress: "Location coordinates",
      latitude,
      longitude,
    };
  }
};
