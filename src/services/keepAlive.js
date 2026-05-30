/**
 * Keep-alive service to prevent model timeout
 * Sends a ping to the backend every 2 minutes to keep the model loaded
 */

let keepAliveInterval = null;
const PING_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

const AI_API_ENDPOINT =
  process.env.REACT_APP_AI_ENDPOINT || "http://localhost:3001/api/ai";

/**
 * Start keep-alive pings
 */
export const startKeepAlive = () => {
  if (keepAliveInterval) {
    console.log("Keep-alive already running");
    return;
  }

  console.log("🔄 Starting keep-alive pings...");

  // Ping immediately on start
  sendPing();

  // Then ping every 2 minutes
  keepAliveInterval = setInterval(sendPing, PING_INTERVAL);
};

/**
 * Stop keep-alive pings
 */
export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log("⏹️  Keep-alive stopped");
  }
};

/**
 * Send a ping to keep the model loaded
 */
const sendPing = async () => {
  try {
    const response = await fetch(AI_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (response.ok) {
      console.log("✅ Keep-alive ping sent at", new Date().toLocaleTimeString());
    } else {
      console.warn("⚠️  Keep-alive ping failed:", response.status);
    }
  } catch (error) {
    console.warn("⚠️  Keep-alive error:", error.message);
  }
};
