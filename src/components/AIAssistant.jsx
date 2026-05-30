// src/components/AIAssistant.jsx
import React, { useState, useRef, useEffect } from "react";
import { askAssistant } from "../services/aiService";
import { startKeepAlive, stopKeepAlive } from "../services/keepAlive";
import { Bot, Send, User, Loader } from "lucide-react";
import "./AIAssistant.css";

const QUICK_PROMPTS = [
  "What to do during a fire?",
  "First aid for a road accident?",
  "Someone is unconscious. What should I do?",
  "How do I call emergency services in India?",
  "Explain phishing in simple words.",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Namaste! I am your Securra AI Assistant. Ask me any question, and I will give a direct answer. For emergencies, I will also share quick safety steps.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start keep-alive pings when component mounts
  useEffect(() => {
    startKeepAlive();
    return () => stopKeepAlive();
  }, []);

  const sendMessage = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;

    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build conversation history (excluding the initial greeting and current message)
      // The API will add the system prompt automatically
      const conversationHistory = newMessages
        .slice(1, -1) // Skip greeting at start, skip current user message at end
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const reply = await askAssistant(userMsg, conversationHistory);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error("Assistant error:", e);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please try again. In a real emergency, call 112 (Police/Fire/Ambulance).",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ai-chat">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-avatar">
          <Bot size={20} />
        </div>
        <div>
          <h3>Safety AI Assistant</h3>
          <p className="ai-status">
            <span className="status-dot" /> Powered by Gemini
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role}`}>
            <div className="msg-avatar">
              {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div
              className="msg-bubble"
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br/>"),
              }}
            />
          </div>
        ))}
        {loading && (
          <div className="msg assistant">
            <div className="msg-avatar">
              <Bot size={14} />
            </div>
            <div className="msg-bubble typing">
              <Loader size={14} className="spin" />
              <span>Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="quick-prompts">
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            className="quick-btn"
            onClick={() => sendMessage(p)}
            disabled={loading}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="ai-input-row">
        <input
          className="input ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask any question..."
          disabled={loading}
        />
        <button
          className="btn btn-primary send-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
