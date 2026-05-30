// src/pages/Alerts.jsx
import React, { useState, useEffect } from "react";
import { getWeatherAlerts, classifyAlert } from "../services/weatherService";
import { Cloud, Wind, Thermometer, Droplets, AlertTriangle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import "./Alerts.css";

// Indian cities for quick check
const CITIES = [
  { name: "Mumbai", lat: 19.076, lng: 72.877 },
  { name: "Delhi", lat: 28.613, lng: 77.209 },
  { name: "Chennai", lat: 13.083, lng: 80.27 },
  { name: "Odisha Coast", lat: 20.29, lng: 85.82 },
  { name: "Kolkata", lat: 22.572, lng: 88.363 },
  { name: "Bhayandar", lat: 19.3, lng: 72.85 },
];

export default function Alerts() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(CITIES[5]);

  const fetchWeather = async (city) => {
    setLoading(true);
    try {
      const data = await getWeatherAlerts(city.lat, city.lng);
      setWeather(data);
    } catch (e) {
      toast.error(`Weather fetch failed: ${e.message}`);
      // Demo data fallback
      setWeather({
        current: { temp: 32, humidity: 75, wind_speed: 18, weather: [{ description: "Partly cloudy", icon: "02d" }] },
        alerts: [
          { event: "Cyclone Warning", description: "Strong winds expected. Stay indoors.", start: Date.now() / 1000, end: Date.now() / 1000 + 86400 * 2 },
        ],
        daily: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWeather(selectedCity); }, [selectedCity]);

  return (
    <div className="alerts-page">
      <div className="alerts-inner">
        {/* Header */}
        <div className="alerts-header">
          <div>
            <h1>🌤️ Weather & Disaster Alerts</h1>
            <p>Live weather data and official disaster alerts for Indian regions</p>
          </div>
          <button
            className="btn btn-ghost refresh-btn"
            onClick={() => fetchWeather(selectedCity)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>

        {/* City Selector */}
        <div className="city-tabs">
          {CITIES.map((c) => (
            <button
              key={c.name}
              className={`city-tab ${selectedCity.name === c.name ? "active" : ""}`}
              onClick={() => setSelectedCity(c)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading && (
          <div className="loading-row">
            <RefreshCw size={20} className="spin" />
            <span>Fetching weather data...</span>
          </div>
        )}

        {weather && !loading && (
          <>
            {/* Current Weather */}
            <div className="weather-card card">
              <div className="weather-location">📍 {selectedCity.name}</div>
              <div className="weather-main">
                <span className="weather-temp">{Math.round(weather.current.temp)}°C</span>
                <span className="weather-desc">
                  {weather.current.weather?.[0]?.description}
                </span>
              </div>
              <div className="weather-details">
                <div className="wdetail">
                  <Droplets size={15} />
                  <span>Humidity: {weather.current.humidity}%</span>
                </div>
                <div className="wdetail">
                  <Wind size={15} />
                  <span>Wind: {Math.round(weather.current.wind_speed * 3.6)} km/h</span>
                </div>
                <div className="wdetail">
                  <Thermometer size={15} />
                  <span>Feels like: {Math.round(weather.current.feels_like || weather.current.temp)}°C</span>
                </div>
              </div>
            </div>

            {/* Disaster Alerts */}
            {weather.alerts.length > 0 ? (
              <div className="disaster-alerts">
                <h2 className="section-title-sm">
                  <AlertTriangle size={18} color="var(--orange)" /> Active Alerts
                </h2>
                {weather.alerts.map((alert, i) => {
                  const cls = classifyAlert(alert);
                  return (
                    <div key={i} className="alert-card" style={{ "--acolor": cls.color }}>
                      <div className="alert-header-row">
                        <span className="alert-icon">{cls.icon}</span>
                        <div className="alert-info">
                          <h3>{alert.event}</h3>
                          <span className={`badge badge-${cls.severity === "high" ? "red" : cls.severity === "medium" ? "yellow" : "orange"}`}>
                            {cls.severity.toUpperCase()} SEVERITY
                          </span>
                        </div>
                      </div>
                      <p className="alert-desc">{alert.description}</p>
                      <div className="alert-footer">
                        <span>From: {new Date(alert.start * 1000).toLocaleDateString()}</span>
                        <span>To: {new Date(alert.end * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-alerts card">
                <span>✅</span>
                <p>No active disaster alerts for {selectedCity.name}</p>
              </div>
            )}

            {/* NDMA Info */}
            <div className="info-sources card">
              <h3>📋 Official Sources</h3>
              <div className="source-links">
                {[
                  { label: "NDMA India", url: "https://ndma.gov.in" },
                  { label: "IMD Weather", url: "https://imd.gov.in" },
                  { label: "INCOIS", url: "https://incois.gov.in" },
                  { label: "Disaster Management", url: "https://ndmindia.mha.gov.in" },
                ].map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="source-link">
                    {s.label} →
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
