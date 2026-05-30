// src/pages/AssistantPage.jsx
import React from "react";
import AIAssistant from "../components/AIAssistant";
import { Bot, Zap, Shield } from "lucide-react";
import "./AssistantPage.css";

export default function AssistantPage() {
  return (
    <div className="assistant-page">
      <div className="assistant-inner">
        <div className="assistant-left">
          <div className="assistant-header">
            <div className="assistant-logo">
              <Bot size={28} />
            </div>
            <div>
              <h1>AI Safety Assistant</h1>
              <p>Powered by Ollama - Your emergency guide</p>
            </div>
          </div>

          <div className="assistant-features">
            {[
              { icon: <Zap size={16} />, title: "Instant Advice", desc: "Get immediate, actionable safety steps for any emergency." },
              { icon: <Shield size={16} />, title: "Expert Guidance", desc: "Trained on official NDMA and emergency response protocols." },
              { icon: <Bot size={16} />, title: "24/7 Available", desc: "Always accessible, even when phone lines are busy." },
            ].map((f) => (
              <div key={f.title} className="asst-feature">
                <div className="asst-feature-icon">{f.icon}</div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="emergency-quick card">
            <h3>Emergency Contacts</h3>
            <div className="eq-list">
              {[
                ["National Emergency", "112"],
                ["Fire", "101"],
                ["Ambulance", "108"],
                ["Police", "100"],
                ["Disaster Mgmt", "1070"],
              ].map(([label, num]) => (
                <a key={num} href={`tel:${num}`} className="eq-item">
                  <span>{label}</span>
                  <strong>{num}</strong>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="assistant-right">
          <AIAssistant />
        </div>
      </div>
    </div>
  );
}
