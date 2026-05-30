#!/usr/bin/env node
/**
 * Test script for AIAssistant and Gemini API
 * Tests:
 * 1. API Key validation
 * 2. Gemini API connectivity
 * 3. Local proxy server
 * 4. Full AIAssistant flow
 */

const fetch = require("node-fetch");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const AI_PROXY_PORT = process.env.AI_PROXY_PORT || 3001;

console.log("\n" + "=".repeat(70));
console.log("🧪 AI ASSISTANT DIAGNOSTIC TEST");
console.log("=".repeat(70) + "\n");

// Test 1: Check API Key
console.log("TEST 1: Checking Gemini API Key");
console.log("-".repeat(70));
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing from .env");
  process.exit(1);
}
console.log(`✓ API Key found: ${GEMINI_API_KEY.substring(0, 20)}...`);
console.log(`✓ Model: ${GEMINI_MODEL}`);
console.log();

// Test 2: Direct Gemini API Call
console.log("TEST 2: Testing Direct Gemini API Call");
console.log("-".repeat(70));

async function testGeminiAPI() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
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
                text: "Hello, what is 2+2?",
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

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Gemini API Error (${response.status})`);
      console.error("Response:", JSON.stringify(data, null, 2));
      return false;
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const reply = data.candidates[0].content.parts[0].text;
      console.log(`✓ Gemini API Working!`);
      console.log(`✓ Response: "${reply}"`);
      return true;
    } else {
      console.error("❌ Unexpected Gemini response format:");
      console.error(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    return false;
  }
}

// Test 3: Check Proxy Server Status
console.log("\nTEST 3: Checking Local Proxy Server");
console.log("-".repeat(70));

async function testProxyHealth() {
  try {
    const response = await fetch(`http://localhost:${AI_PROXY_PORT}/health`);
    const data = await response.json();
    console.log(`✓ Proxy Server is running on port ${AI_PROXY_PORT}`);
    console.log(`✓ Provider: ${data.provider}`);
    console.log(`✓ Model: ${data.model}`);
    return true;
  } catch (error) {
    console.warn(`⚠ Proxy Server not running on port ${AI_PROXY_PORT}`);
    console.warn("You need to start it with: node server/ai_proxy.js");
    return false;
  }
}

// Test 4: Test Proxy API Endpoint
console.log("\nTEST 4: Testing Proxy API Endpoint");
console.log("-".repeat(70));

async function testProxyAPI() {
  try {
    const response = await fetch(`http://localhost:${AI_PROXY_PORT}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "What is your name?",
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error(`❌ Proxy API Error:`, data.error || response.statusText);
      return false;
    }

    console.log(`✓ Proxy API Working!`);
    console.log(`✓ Response: "${data.reply}"`);
    return true;
  } catch (error) {
    console.warn(`⚠ Proxy API not available:`, error.message);
    return false;
  }
}

// Run Tests
async function runTests() {
  const geminiWorks = await testGeminiAPI();
  console.log();

  const proxyHealthOk = await testProxyHealth();
  console.log();

  let proxyApiOk = false;
  if (proxyHealthOk) {
    proxyApiOk = await testProxyAPI();
  }

  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(70));
  console.log(`✓ Gemini API Key: ${GEMINI_API_KEY ? "✓ Loaded" : "✗ Missing"}`);
  console.log(`${geminiWorks ? "✓" : "✗"} Gemini API: ${geminiWorks ? "Working" : "Failed"}`);
  console.log(`${proxyHealthOk ? "✓" : "✗"} Proxy Server: ${proxyHealthOk ? "Running" : "Not running"}`);
  console.log(`${proxyApiOk ? "✓" : "✗"} Proxy API: ${proxyApiOk ? "Working" : "Not available"}`);

  console.log("\n" + "=".repeat(70));
  if (geminiWorks && proxyHealthOk && proxyApiOk) {
    console.log("✅ ALL TESTS PASSED! AI Assistant should be working.");
  } else if (geminiWorks && !proxyHealthOk) {
    console.log("⚠️  Gemini API works but proxy server is not running.");
    console.log("   Start it with: node server/ai_proxy.js");
  } else if (!geminiWorks) {
    console.log("❌ Gemini API is not responding.");
    console.log("   Check your GEMINI_API_KEY in .env file.");
    console.log("   Make sure the key is valid and has not expired.");
  }
  console.log("=".repeat(70) + "\n");
}

runTests().catch(console.error);
