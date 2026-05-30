#!/usr/bin/env node
/**
 * server/ai_proxy.js
 * Multi-provider AI backend for Securra AI Assistant
 * Supports: Grok API (X.AI - recommended), Google Gemini API, or HuggingFace API
 * 
 * Run with: node server/ai_proxy.js
 */

const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.AI_PROXY_PORT || 3001;

// Determine which provider to use
const PROVIDER = process.env.AI_PROVIDER || "grok";

let config = {};
if (PROVIDER === "grok") {
  config = {
    provider: "grok",
    apiKey: process.env.GROK_API_KEY,
    model: process.env.GROK_MODEL || "grok-4.20-reasoning",
    apiUrl: "https://api.x.ai/v1",
  };
} else if (PROVIDER === "gemini") {
  config = {
    provider: "gemini",
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-flash-latest",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta",
  };
} else {
  config = {
    provider: "huggingface",
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: process.env.HUGGINGFACE_MODEL || "google/flan-t5-base",
    apiUrl: "https://api-inference.huggingface.co",
  };
}

if (!config.apiKey) {
  console.error(`❌ Error: ${config.provider.toUpperCase()}_API_KEY not found in .env`);
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

console.log("\n" + "=".repeat(60));
console.log(`✓ AI Backend initialized`);
console.log(`✓ Provider: ${config.provider.toUpperCase()}`);
console.log(`✓ Model: ${config.model}`);
console.log(`✓ API Key: ${config.apiKey.substring(0, 10)}...`);
console.log("=".repeat(60));

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    model: config.model,
    provider: config.provider,
  });
});

/**
 * Grok API call (X.AI)
 */
async function callGrok(userMessage) {
  const url = `${config.apiUrl}/responses`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: userMessage,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Grok] API Error:", errorText);
    throw new Error(`Grok API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract text from Grok response
  let reply = "";
  if (data.result || data.output || data.text) {
    reply = data.result || data.output || data.text;
  }

  if (!reply) {
    console.error("[Grok] Empty response:", data);
    throw new Error("Empty response from Grok");
  }

  return reply.trim();
}

/**
 * Gemini API call
 */
async function callGemini(userMessage) {
  const url = `${config.apiUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: userMessage,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Gemini] API Error:", errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract text from Gemini response
  let reply = "";
  if (data.candidates && data.candidates[0]) {
    const content = data.candidates[0].content;
    if (content.parts && content.parts[0]) {
      reply = content.parts[0].text;
    }
  }

  if (!reply) {
    console.error("[Gemini] Empty response:", data);
    throw new Error("Empty response from Gemini");
  }

  return reply.trim();
}

/**
 * HuggingFace API call
 */
async function callHuggingFace(userMessage) {
  const url = `${config.apiUrl}/models/${config.model}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: userMessage,
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[HF] API Error:", errorText);
    throw new Error(`HuggingFace API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract reply from HuggingFace response
  let reply = "";
  if (Array.isArray(data) && data.length > 0) {
    reply = data[0].generated_text || "";
  } else if (data.generated_text) {
    reply = data.generated_text;
  }

  if (!reply) {
    console.error("[HF] Empty response:", data);
    throw new Error("Empty response from HuggingFace");
  }

  return reply.trim();
}

// Rate limiting: Track requests to avoid 429 errors
const requestQueue = [];
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between Gemini requests to avoid rate limit
const requestCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

async function callWithRateLimit(apiCall, cacheKey) {
  // Check cache first
  if (cacheKey && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache] Hit for: "${cacheKey.substring(0, 30)}..."`);
      return cached.result;
    }
  }

  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await apiCall();
        
        // Cache the result
        if (cacheKey) {
          requestCache.set(cacheKey, {
            result,
            timestamp: Date.now(),
          });
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    if (requestQueue.length === 1) {
      processQueue();
    }
  });
}

async function processQueue() {
  while (requestQueue.length > 0) {
    const apiCall = requestQueue.shift();
    try {
      await apiCall();
    } catch (error) {
      console.error("Queue processing error:", error.message);
    }
    
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL));
    }
  }
}

/**
 * Main chat endpoint that accepts messages array
 */
app.post("/api/ai", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Request must include a non-empty messages array",
      });
    }

    // Extract the last user message
    let userMessage = "";
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userMessage = messages[i].content;
        break;
      }
    }

    if (!userMessage) {
      return res.status(400).json({ error: "No user message found" });
    }

    const prefix = config.provider === "grok" ? "[Grok]" : config.provider === "gemini" ? "[Gemini]" : "[HF]";
    console.log(`${prefix} Processing: "${userMessage.substring(0, 50)}..."`);

    // Create cache key for Gemini (shorter messages are more likely to repeat)
    const cacheKey = config.provider === "gemini" ? userMessage : null;

    // Call appropriate API with rate limiting
    let reply;
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
      try {
        if (config.provider === "grok") {
          reply = await callWithRateLimit(() => callGrok(userMessage), null);
        } else if (config.provider === "gemini") {
          reply = await callWithRateLimit(() => callGemini(userMessage), cacheKey);
        } else {
          reply = await callWithRateLimit(() => callHuggingFace(userMessage), null);
        }
        break; // Success, exit retry loop
      } catch (error) {
        if (error.message.includes("429") && retries < maxRetries) {
          const waitTime = (retries + 1) * 3000; // 3s, 6s
          console.warn(`${prefix} Rate limited (attempt ${retries + 1}/${maxRetries}) - waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
        } else {
          throw error;
        }
      }
    }

    console.log(`${prefix} Response: "${reply.substring(0, 50)}..."`);

    res.json({
      reply: reply,
      model: config.model,
      provider: config.provider,
    });
  } catch (error) {
    console.error(`[${config.provider}] Error:`, error.message);
    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

/**
 * Alternative endpoint for direct text input
 */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const prefix = config.provider === "grok" ? "[Grok]" : config.provider === "gemini" ? "[Gemini]" : "[HF]";
    console.log(`${prefix} Processing: "${message.substring(0, 50)}..."`);

    // Call appropriate API
    let reply;
    if (config.provider === "grok") {
      reply = await callGrok(message);
    } else if (config.provider === "gemini") {
      reply = await callGemini(message);
    } else {
      reply = await callHuggingFace(message);
    }

    console.log(`${prefix} Response: "${reply.substring(0, 50)}..."`);

    res.json({
      reply: reply,
      model: config.model,
      provider: config.provider,
    });
  } catch (error) {
    console.error(`[${config.provider}] Error:`, error.message);
    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

/**
 * CORS preflight
 */
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 AI Proxy running on http://localhost:${PORT}`);
  console.log(`📍 Endpoints:`);
  console.log(`   POST /api/ai    - Main endpoint (messages array)`);
  console.log(`   POST /chat      - Simple text endpoint`);
  console.log(`   GET  /health    - Health check`);
  console.log(`📦 Model: ${config.model}`);
  console.log(`🔗 Provider: ${config.provider.toUpperCase()}`);
  console.log(`${"=".repeat(60)}\n`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n✋ Stopping proxy...");
  process.exit(0);
});
