// src/services/weatherService.js
// WeatherAPI.com Integration for Disaster Alerts
// Get your API key: https://www.weatherapi.com/

const WAPI_BASE = "https://api.weatherapi.com/v1";
// Prefer a dedicated WEATHERAPI key but fall back to previous var for convenience.
const WAPI_KEY =
  process.env.REACT_APP_WEATHERAPI_KEY || process.env.REACT_APP_OPENWEATHER_API_KEY;

const ensureKey = () => {
  if (!WAPI_KEY) {
    throw new Error("Missing Weather API key (REACT_APP_WEATHERAPI_KEY)");
  }
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    /* ignore parse errors */
  }
  if (!res.ok) {
    const msg =
      body?.error?.message ||
      body?.message ||
      res.statusText ||
      "Weather fetch failed";
    throw new Error(msg);
  }
  return body;
};

/**
 * Get current weather + disaster alerts for a location
 */
export const getWeatherAlerts = async (lat, lng) => {
  ensureKey();
  // WeatherAPI forecast returns current + forecast + alerts when alerts=yes
  const data = await fetchJson(
    `${WAPI_BASE}/forecast.json?key=${WAPI_KEY}&q=${lat},${lng}&days=3&alerts=yes&aqi=no`
  );

  return {
    current: {
      temp: data.current?.temp_c,
      humidity: data.current?.humidity,
      wind_speed: (data.current?.wind_kph || 0) / 3.6, // convert to m/s for consistency
      feels_like: data.current?.feelslike_c,
      weather: [{ description: data.current?.condition?.text, icon: data.current?.condition?.icon }],
    },
    alerts: data.alerts?.alert || [],
    daily: data.forecast?.forecastday || [],
  };
};

/**
 * Get weather by city name (for search)
 */
export const getWeatherByCity = async (city) => {
  ensureKey();
  return fetchJson(
    `${WAPI_BASE}/current.json?key=${WAPI_KEY}&q=${encodeURIComponent(city)}&aqi=no`
  );
};

/**
 * Classify alert severity
 */
export const classifyAlert = (alert) => {
  const event = alert.event?.toLowerCase() || alert.headline?.toLowerCase() || "";
  if (event.includes("cyclone") || event.includes("hurricane"))
    return { type: "cyclone", icon: "🌪", color: "#ff4500", severity: "high" };
  if (event.includes("flood"))
    return { type: "flood", icon: "🌊", color: "#1e90ff", severity: "high" };
  if (event.includes("thunder") || event.includes("storm"))
    return { type: "storm", icon: "⛈", color: "#ffd700", severity: "medium" };
  if (event.includes("heat"))
    return { type: "heat", icon: "🌡", color: "#ff6347", severity: "medium" };
  return { type: "other", icon: "⚠️", color: "#ff8c00", severity: "low" };
};
