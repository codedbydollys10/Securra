// src/pages/SafetyInfo.jsx
import React, { useState } from "react";
import { CheckSquare, Square, BookOpen, ShieldCheck } from "lucide-react";
import "./SafetyInfo.css";

const DISASTER_INFO = {
  fire: {
    icon: "🔥",
    title: "Fire Safety",
    color: "#f75c03",
    causes: ["Electrical short circuits", "Gas leaks", "Unattended cooking", "Inflammable materials", "Arson"],
    prevention: ["Install smoke detectors", "Keep fire extinguisher handy", "Don't overload electrical sockets", "Store chemicals safely", "Never leave stove unattended"],
    steps: ["Stay low — smoke rises", "Cover nose with wet cloth", "Crawl to nearest exit", "Feel door before opening — if hot, don't open", "Call 101 (Fire Department)", "Meet at designated assembly point"],
  },
  accident: {
    icon: "🚗",
    title: "Road Accident",
    color: "#1557c0",
    causes: ["Over-speeding", "Drunk driving", "Distracted driving", "Poor road conditions", "Mechanical failure"],
    prevention: ["Always wear seatbelt", "Follow speed limits", "Never use phone while driving", "Maintain safe distance", "Get regular vehicle servicing"],
    steps: ["Call 112 immediately", "Don't move injured person unless in danger", "Stop bleeding with clean cloth", "Keep victim calm and awake", "Clear area for ambulance", "Collect accident details for police"],
  },
  cyclone: {
    icon: "🌪",
    title: "Cyclone Safety",
    color: "#8b5cf6",
    causes: ["Warm ocean water", "Low atmospheric pressure", "Climate change", "Seasonal wind patterns"],
    prevention: ["Check IMD alerts regularly", "Reinforce windows and doors", "Store emergency supplies", "Know your evacuation route", "Keep phone charged"],
    steps: ["Move to strongest room (no windows)", "Stay away from coast", "Avoid electrical equipment", "Follow official evacuation orders", "Do not venture out during eye of storm", "Call 1070 (Disaster Helpline)"],
  },
};

const KIT_ITEMS = [
  { id: 1, item: "Drinking water (3L per person per day)", category: "Essential" },
  { id: 2, item: "Emergency food (3-day supply)", category: "Essential" },
  { id: 3, item: "Flashlight + extra batteries", category: "Essential" },
  { id: 4, item: "First aid kit", category: "Medical" },
  { id: 5, item: "Prescription medicines", category: "Medical" },
  { id: 6, item: "Power bank (fully charged)", category: "Electronics" },
  { id: 7, item: "Battery-powered radio", category: "Electronics" },
  { id: 8, item: "Whistle (to signal for help)", category: "Safety" },
  { id: 9, item: "Waterproof bag for documents", category: "Documents" },
  { id: 10, item: "Copies of ID, Aadhaar, insurance", category: "Documents" },
  { id: 11, item: "Cash in small denominations", category: "Financial" },
  { id: 12, item: "Warm blankets / rain poncho", category: "Clothing" },
  { id: 13, item: "Rope (10m)", category: "Safety" },
  { id: 14, item: "Hand sanitizer + masks", category: "Hygiene" },
  { id: 15, item: "Emergency contact list (written)", category: "Communication" },
];

export default function SafetyInfo() {
  const [activeTab, setActiveTab] = useState("fire");
  const [checked, setChecked] = useState({});
  const info = DISASTER_INFO[activeTab];

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="info-page">
      <div className="info-inner">
        {/* Header */}
        <div className="info-header">
          <BookOpen size={24} />
          <div>
            <h1>Safety Information</h1>
            <p>Know what to do before, during, and after disasters</p>
          </div>
        </div>

        {/* Disaster Tabs */}
        <div className="disaster-tabs">
          {Object.entries(DISASTER_INFO).map(([key, d]) => (
            <button
              key={key}
              className={`dtab ${activeTab === key ? "active" : ""}`}
              style={{ "--dcolor": d.color }}
              onClick={() => setActiveTab(key)}
            >
              {d.icon} {d.title}
            </button>
          ))}
        </div>

        {/* Disaster Info */}
        <div className="info-grid">
          <div className="info-section card" style={{ borderTop: `3px solid ${info.color}` }}>
            <h2>{info.icon} {info.title}</h2>

            <div className="info-block">
              <h3>⚠️ Common Causes</h3>
              <ul className="info-list">
                {info.causes.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>

            <div className="info-block">
              <h3>🛡️ Prevention Tips</h3>
              <ul className="info-list green">
                {info.prevention.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>

            <div className="info-block">
              <h3>🆘 Emergency Steps</h3>
              <ol className="steps-list">
                {info.steps.map((s, i) => (
                  <li key={i}>
                    <span className="step-num">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Emergency Kit Checklist */}
          <div className="kit-section card">
            <div className="kit-header">
              <h2><ShieldCheck size={20} /> Emergency Kit Checklist</h2>
              <span className="kit-progress">
                {checkedCount}/{KIT_ITEMS.length} ready
              </span>
            </div>
            <div className="kit-bar">
              <div
                className="kit-fill"
                style={{ width: `${(checkedCount / KIT_ITEMS.length) * 100}%` }}
              />
            </div>
            <div className="kit-list">
              {KIT_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`kit-item ${checked[item.id] ? "checked" : ""}`}
                  onClick={() => toggle(item.id)}
                >
                  {checked[item.id] ? (
                    <CheckSquare size={16} color="var(--success)" />
                  ) : (
                    <Square size={16} color="var(--text-muted)" />
                  )}
                  <span className="kit-text">{item.item}</span>
                  <span className="kit-cat">{item.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NDMA Helplines */}
        <div className="helplines card">
          <h2>📞 Official Helplines</h2>
          <div className="helplines-grid">
            {[
              { name: "National Emergency", num: "112" },
              { name: "Disaster Management", num: "1070" },
              { name: "Fire", num: "101" },
              { name: "Ambulance", num: "108" },
              { name: "Coast Guard", num: "1554" },
              { name: "NDRF", num: "011-24363260" },
            ].map((h) => (
              <a key={h.name} href={`tel:${h.num}`} className="helpline-card">
                <span className="helpline-num">{h.num}</span>
                <span className="helpline-name">{h.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
