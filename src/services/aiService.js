// src/services/aiService.js
// Gemini API integration via local backend proxy
// Backend proxy at localhost:3001/api/ai
// GEMINI_API_KEY must be set in .env

const AI_API_ENDPOINT =
  process.env.REACT_APP_AI_ENDPOINT ||
  "http://localhost:3001/api/ai";

const SYSTEM_PROMPT = `You are Securra's AI Assistant - an emergency safety expert for India. You are powered by Google Gemini.

CORE RULES:
1. Answer DIRECTLY without intro phrases. Jump straight to the answer.
2. BE CONCISE - use 2-3 short paragraphs max, or bullet points for steps.
3. NO REPETITION - Never repeat what you said in previous messages. Always give NEW, different information.
4. CONTEXT-AWARE - Remember what was discussed earlier but don't repeats facts.
5. PRACTICAL - Focus on immediate, actionable steps people can take RIGHT NOW.

FOR EMERGENCY QUESTIONS:
- Give numbered step-by-step instructions
- Include what NOT to do  
- Mention when to call 112 (National Emergency)

FOR SAFETY QUESTIONS:
- Explain threats clearly
- Give prevention tips
- Mention legal resources

FOR GENERAL QUESTIONS:
- Still answer helpfully and constructively
- Keep it relevant to safety/security

TONE: Professional, calm, encouraging, NEVER repetitive.
LENGTH: Keep answers short and focused (2-3 paragraphs max).
LANGUAGE: Clear simple English for all literacy levels.`;

/**
 * Ask the assistant a question using Gemini (via backend proxy)
 * @param {string} userMessage - The user's question
 * @param {Array} history - Previous messages [{role, content}] to provide context
 * @returns {Promise<string>}
 */
export const askAssistant = async (userMessage, history = []) => {
  try {
    // Build messages array: system prompt + last 4 conversation pairs + current message
    // Keep history short to prevent context bloat and repetition
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-8), // Keep only last 8 messages (4 exchanges) for context
      { role: "user", content: userMessage },
    ];

    // Call backend API
    const response = await fetch(AI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.reply?.trim();
    return reply || "I'm unable to respond right now.";
  } catch (error) {
    console.error("Assistant error:", error);
    if (error instanceof TypeError && String(error.message).includes("Failed to fetch")) {
      throw new Error("AI proxy is not reachable. Make sure to run: npm run start (which starts both the React app and Python proxy)");
    }
    throw error;
  }
};

/** Get contextual safety tips based on emergency type */
export const getEmergencyTips = async (type) => {
  const prompts = {
    fire: "Give me 5 immediate steps to take during a building fire right now.",
    accident: "Give me 5 immediate steps to help someone in a road accident right now.",
    cyclone: "Give me 5 immediate steps to stay safe during a cyclone right now.",
  };
  const prompt = prompts[type] || `What to do during a ${type} emergency?`;
  return askAssistant(prompt);
};
