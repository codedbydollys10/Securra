// src/components/IncidentMap.jsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { listenToReports } from "../services/firestoreService";
import "./IncidentMap.css";

// Custom emoji markers
const makeIcon = (emoji, color) =>
  L.divIcon({
    className: "",
    html: `<div style="
      background:${color};
      border:2px solid rgba(255,255,255,0.3);
      border-radius:50%;
      width:36px;height:36px;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;
      box-shadow:0 0 12px ${color}88;
    ">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const ICONS = {
  fire: makeIcon("🔥", "#f75c03"),
  accident: makeIcon("🚗", "#1557c0"),
  cyclone: makeIcon("🌪", "#8b5cf6"),
  sos: makeIcon("🆘", "#ef4444"),
};

const STATUS_COLOR = {
  pending: "#f59e0b",
  reviewing: "#3b82f6",
  verified: "#22c55e",
  dispatched: "#0a3d8f",
  fake: "#6b7280",
};

export default function IncidentMap({ showNearby = false, height = "500px", filter = "All" }) {
  const [reports, setReports] = useState([]);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    // Get user location
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setUserPos([20.5937, 78.9629]) // Default: India center
    );

    // Listen to all reports in real-time
    const unsub = listenToReports((allReports) => {
      console.log("📍 Live map reports updated:", allReports.length, "reports");
      allReports.forEach(r => {
        if (!r.lat || !r.lng) {
          console.warn(`Report ${r.id} missing lat/lng:`, r);
        }
      });
      setReports(allReports);
    });
    
    return unsub;
  }, []);

  const center = userPos || [20.5937, 78.9629];

  // Filter: show verified and dispatched reports (active emergencies)
  let activeReports = reports.filter((r) => 
    (r.status === "verified" || r.status === "dispatched") && r.status !== "fake"
  );

  console.log("📍 Map Filter - Total reports:", reports.length, "| Verified+Dispatched:", activeReports.length);
  console.log("   Verified:", reports.filter(r => r.status === "verified").length);
  console.log("   Dispatched:", reports.filter(r => r.status === "dispatched").length);

  // Apply type filter
  if (filter !== "All") {
    const filterType = filter.toLowerCase();
    activeReports = activeReports.filter((r) => {
      if (filterType === "accident") return r.type === "accident";
      if (filterType === "fire") return r.type === "fire";
      if (filterType === "cyclone") return r.type === "cyclone";
      if (filterType === "sos") return r.type === "sos";
      return true;
    });
    console.log(`   After ${filter} filter:`, activeReports.length);
  }

  return (
    <div className="map-container" style={{ height }}>
      <MapContainer
        center={center}
        zoom={userPos ? 13 : 5}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* User location */}
        {userPos && (
          <Marker
            position={userPos}
            icon={L.divIcon({
              className: "",
              html: `<div style="
                width:14px;height:14px;
                background:#2e78e4;
                border:3px solid white;
                border-radius:50%;
                box-shadow:0 0 15px #2e78e4;
              "/>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })}
          >
            <Popup>
              <b>Your Location</b>
            </Popup>
          </Marker>
        )}

        {/* Incidents */}
        {activeReports.map((report) => {
          if (!report.lat || !report.lng) return null;
          const icon = ICONS[report.type] || ICONS.accident;
          const color = STATUS_COLOR[report.status] || "#f75c03";
          return (
            <React.Fragment key={report.id}>
              <Marker position={[report.lat, report.lng]} icon={icon}>
                <Popup>
                  <div className="map-popup">
                    <div className="popup-type">
                      {report.type?.toUpperCase()} INCIDENT
                    </div>
                    <p>{report.description}</p>
                    <div className="popup-meta">
                      <span
                        className="popup-status"
                        style={{ color }}
                      >
                        ● {report.status}
                      </span>
                      <span className="popup-confidence">
                        Confidence: {report.confidence || 1}x
                      </span>
                    </div>
                    {report.photoURL && (
                      <img
                        src={report.photoURL}
                        alt="Evidence"
                        style={{ width: "100%", borderRadius: 6, marginTop: 6 }}
                      />
                    )}
                  </div>
                </Popup>
              </Marker>
              {/* Confidence circle */}
              {report.status === "verified" && (
                <Circle
                  center={[report.lat, report.lng]}
                  radius={500}
                  pathOptions={{
                    color: "#f75c03",
                    fillColor: "#f75c03",
                    fillOpacity: 0.08,
                    weight: 1,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item"><span>🔥</span> Fire</div>
        <div className="legend-item"><span>🚗</span> Accident</div>
        <div className="legend-item"><span>🌪</span> Cyclone</div>
        <div className="legend-item"><span>🆘</span> SOS</div>
        <div className="legend-item" style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#999" }}>
          Active: {activeReports.length} | Total: {reports.length}
        </div>
      </div>
    </div>
  );
}
