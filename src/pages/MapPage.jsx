// src/pages/MapPage.jsx
import React, { useState } from "react";
import IncidentMap from "../components/IncidentMap";
import { Map, Filter } from "lucide-react";
import "./MapPage.css";

const FILTERS = ["All", "Accident", "Fire", "Cyclone", "SOS"];

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="map-page">
      <div className="map-page-inner">
        {/* Header */}
        <div className="map-page-header">
          <div>
            <h1><Map size={24} /> Live Incident Map</h1>
            <p>Real-time view of all active emergencies across India</p>
          </div>
          {/* Filters */}
          <div className="map-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-btn ${activeFilter === f ? "active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <IncidentMap height="520px" filter={activeFilter} />

        {/* Nearby Emergency Services Info */}
        <div className="nearby-section">
          <h2>Find Nearby Emergency Services</h2>
          <p className="nearby-sub">
            Use the links below to locate emergency services near your current location
          </p>
          <div className="nearby-grid">
            {[
              {
                icon: "🏥",
                label: "Hospitals",
                query: "hospitals near me",
                color: "#22c55e",
              },
              {
                icon: "🚒",
                label: "Fire Stations",
                query: "fire station near me",
                color: "#f75c03",
              },
              {
                icon: "🚓",
                label: "Police Stations",
                query: "police station near me",
                color: "#1557c0",
              },
              {
                icon: "🏪",
                label: "Medical Stores",
                query: "pharmacy near me",
                color: "#8b5cf6",
              },
            ].map((s) => (
              <a
                key={s.label}
                href={`https://www.google.com/maps/search/${encodeURIComponent(s.query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="nearby-card"
                style={{ "--scolor": s.color }}
              >
                <span className="nearby-icon">{s.icon}</span>
                <span className="nearby-label">{s.label}</span>
                <span className="nearby-hint">Open in Google Maps →</span>
              </a>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="map-info-cards">
          <div className="info-card">
            <h4>🔴 Pending</h4>
            <p>Report received, awaiting admin review</p>
          </div>
          <div className="info-card">
            <h4>🟡 Reviewing</h4>
            <p>Admin is currently reviewing this report</p>
          </div>
          <div className="info-card">
            <h4>🟢 Verified</h4>
            <p>Incident confirmed, response in progress</p>
          </div>
          <div className="info-card">
            <h4>🔵 Dispatched</h4>
            <p>Emergency services have been dispatched</p>
          </div>
        </div>
      </div>
    </div>
  );
}
