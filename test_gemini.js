#!/usr/bin/env node
/**
 * test_gemini.js
 * Direct test of Google Gemini API integration
 * 
 * Usage: node test_gemini.js
 */

const fetch = require("node-fetch");
require("dotenv").config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

console.log("\n🔍 Testing Google Gemini API\n");
console.log(`API Key: ${GEMINI_KEY?.substring(0, 15)}...`);
console.log(`Model: ${GEMINI_MODEL}`);
console.log(`Endpoint: https://generativelanguage.googleapis.com/v1beta\n`);

const TEST_QUERIES = [
  "What is the capital of India?",
  "Explain AI in 2 sentences",
  "What are the top 3 programming languages?",
];

async function testGemini(query) {
  try {
    console.log(`📤 Query: "${query}"`);
    console.log(`⏳ Waiting for response...\n`);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: query,
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

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Error:`, error);
      return false;
    }

    const data = await response.json();

    // Extract response
    if (data.candidates && data.candidates[0]) {
      const content = data.candidates[0].content;
      if (content.parts && content.parts[0]) {
        const reply = content.parts[0].text;
        console.log(`✅ Response:\n${reply}\n`);
        return true;
      }
    }

    console.error("❌ Unexpected response format:", data);
    return false;
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("Running Gemini API Tests");
  console.log("=".repeat(60) + "\n");

  let passed = 0;
  let failed = 0;

  for (const query of TEST_QUERIES) {
    const result = await testGemini(query);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log("-".repeat(60) + "\n");
  }

  console.log("=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60) + "\n");

  if (failed === 0) {
    console.log("✅ All tests passed! Gemini API is working perfectly.\n");
  }
}

runTests();
