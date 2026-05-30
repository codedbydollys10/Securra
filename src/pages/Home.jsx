// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, AlertTriangle, Map, Bot, ChevronRight, Flame, Car, Wind } from "lucide-react";
import SOSButton from "../components/SOSButton";
import { listenToReports } from "../services/firestoreService";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

const STATS = [
  { label: "Active Incidents", key: "active" },
  { label: "Verified Reports", key: "verified" },
  { label: "Help Dispatched", key: "dispatched" },
];

export default function Home() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const unsub = listenToReports(setReports);
    return unsub;
  }, []);

  const stats = {
    active: reports.filter((r) => ["pending", "reviewing"].includes(r.status)).length,
    verified: reports.filter((r) => r.status === "verified").length,
    dispatched: reports.filter((r) => r.status === "dispatched").length,
  };

  const recent = reports.filter((r) => r.status !== "fake").slice(0, 3);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">
            <Shield size={14} /> Emergency Response Platform
          </div>
          <h1 className="hero-title">
            Alert. Assist. <span className="highlight">Protect.</span>
          </h1>
          <p className="hero-sub">
            India's community-powered disaster reporting platform. Report emergencies,
            track response, and get real-time AI safety guidance.
          </p>
          <div className="hero-actions">
            <Link to="/report" className="btn btn-primary">
              <AlertTriangle size={16} /> Report Emergency
            </Link>
            <Link to="/map" className="btn btn-ghost">
              <Map size={16} /> Live Map
            </Link>
          </div>
        </div>

        {/* SOS */}
        <div className="hero-sos">
          <SOSButton />
        </div>
      </section>

      {/* Stats */}
      <section className="stats-row">
        {STATS.map((s) => (
          <div key={s.key} className="stat-card">
            <span className="stat-num">{stats[s.key]}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Disaster Types */}
      <section className="section">
        <h2 className="section-title">Disasters We Cover</h2>
        <div className="disaster-grid">
          {[
            { icon: <Car size={28} />, label: "Road Accident", color: "#1557c0", desc: "Report accidents, get first aid guidance, track emergency response." },
            { icon: <Flame size={28} />, label: "Fire", color: "#f75c03", desc: "Alert fire department, guide evacuations, coordinate response." },
            { icon: <Wind size={28} />, label: "Cyclone", color: "#8b5cf6", desc: "Weather alerts, preparation checklists, shelter tracking." },
          ].map((d) => (
            <Link to="/report" key={d.label} className="disaster-card" style={{ "--accent": d.color }}>
              <div className="disaster-icon" style={{ background: `${d.color}22`, color: d.color }}>
                {d.icon}
              </div>
              <h3>{d.label}</h3>
              <p>{d.desc}</p>
              <span className="disaster-cta">Report <ChevronRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <h2 className="section-title">Platform Features</h2>
        <div className="features-grid">
          {[
            { icon: "🗺️", title: "Live Incident Map", desc: "Real-time map of all active incidents in your area.", to: "/map" },
            { icon: "🤖", title: "AI Safety Guide", desc: "Get instant safety advice powered by Grok AI.", to: "/assistant" },
            { icon: "🌤️", title: "Weather Alerts", desc: "Live cyclone and disaster weather warnings.", to: "/alerts" },
            { icon: "📋", title: "Report Tracking", desc: "Track your report from submission to help dispatch.", to: "/profile" },
            { icon: "⭐", title: "Trust Scores", desc: "Reputation system to filter fake reports.", to: "/profile" },
            { icon: "🆘", title: "Emergency Kit", desc: "Preparation checklist for cyclone and floods.", to: "/info" },
          ].map((f) => (
            <Link to={f.to} key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Incidents */}
      {recent.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Incidents</h2>
            <Link to="/map" className="btn btn-ghost" style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}>
              View All
            </Link>
          </div>
          <div className="incidents-list">
            {recent.map((r) => (
              <div key={r.id} className="incident-row">
                <span className="incident-icon">
                  {r.type === "fire" ? "🔥" : r.type === "accident" ? "🚗" : "🌪"}
                </span>
                <div className="incident-info">
                  <span className="incident-type">{r.type?.toUpperCase()}</span>
                  <span className="incident-desc">{r.description?.slice(0, 60)}...</span>
                </div>
                <span className={`badge badge-${r.status === "verified" ? "green" : r.status === "dispatched" ? "blue" : "yellow"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Emergency Numbers */}
      <section className="section emergency-numbers">
        <h2 className="section-title">Emergency Numbers</h2>
        <div className="numbers-grid">
          {[
            { label: "National Emergency", number: "112", icon: "🆘" },
            { label: "Fire Department", number: "101", icon: "🔥" },
            { label: "Ambulance", number: "108", icon: "🚑" },
            { label: "Police", number: "100", icon: "👮" },
            { label: "Disaster Mgmt", number: "1070", icon: "🌪" },
            { label: "Women Helpline", number: "1091", icon: "🛡️" },
          ].map((n) => (
            <a key={n.number} href={`tel:${n.number}`} className="number-card">
              <span className="number-icon">{n.icon}</span>
              <span className="number-digit">{n.number}</span>
              <span className="number-label">{n.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
