#!/usr/bin/env python3
"""server/ai_proxy.py
BYTEZ API proxy for Securra AI Assistant.
Run with: python server/ai_proxy.py

Requires: BYTEZ_API_KEY and BYTEZ_MODEL environment variables
"""

from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and ((value[0] == '"' and value[-1] == '"') or (value[0] == "'" and value[-1] == "'")):
            value = value[1:-1]
        os.environ[key] = value


def extract_error_message(error_text: str, status_code: int, status_text: str) -> str:
    """Extract error message from response."""
    if error_text:
        return error_text
    return f"{status_code} {status_text}"


def extract_reply(payload: dict[str, Any]) -> str:
    """Extract reply from BYTEZ response."""
    # BYTEZ API returns choices array with message object
    if isinstance(payload.get("choices"), list) and len(payload["choices"]) > 0:
        message = payload["choices"][0].get("message", {})
        if isinstance(message.get("content"), str):
            return message["content"].strip()
    return ""


def post_json(url: str, payload: dict[str, Any], headers: dict[str, str], timeout: int = 120) -> tuple[int, str, dict[str, Any]]:
    req = urlrequest.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urlrequest.urlopen(req, timeout=timeout) as response:
            body = response.read().decode("utf-8", errors="replace")
            data = json.loads(body) if body else {}
            return response.status, response.reason, data
    except urlerror.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            data = {"error": raw or exc.reason}
        return exc.code, exc.reason, data


ROOT_DIR = Path(__file__).resolve().parent.parent
load_env_file(ROOT_DIR / ".env")

PORT = int(os.getenv("AI_PROXY_PORT", "3001"))
BYTEZ_API_KEY = os.getenv("BYTEZ_API_KEY")
BYTEZ_MODEL = os.getenv("BYTEZ_MODEL") or "Qwen/Qwen3-4B"
BYTEZ_BASE_URL = "https://api.bytez.ai/v1"

if not BYTEZ_API_KEY:
    print("❌ Error: BYTEZ_API_KEY not found in .env")
    sys.exit(1)

print(f"✓ Using BYTEZ API")
print(f"✓ Model: {BYTEZ_MODEL}")
print(f"✓ API Endpoint: {BYTEZ_BASE_URL}/chat/completions")


def call_bytez(messages: list[dict[str, Any]]) -> tuple[str, str]:
    """Call BYTEZ API with conversation messages."""
    endpoint = f"{BYTEZ_BASE_URL}/chat/completions"
    payload: dict[str, Any] = {
        "model": BYTEZ_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 256,
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {BYTEZ_API_KEY}",
    }

    try:
        status_code, status_text, response_payload = post_json(endpoint, payload, headers, timeout=120)
    except Exception as exc:
        raise RuntimeError(f"Cannot connect to BYTEZ API at {BYTEZ_BASE_URL}. Check your internet connection and API key.") from exc

    if status_code < 200 or status_code >= 300:
        error_msg = response_payload.get("error", {}).get("message", status_text)
        raise RuntimeError(f"BYTEZ API error: {error_msg}")

    reply = extract_reply(response_payload)
    if not reply:
        raise RuntimeError(f"Empty response from {BYTEZ_MODEL}.")

    return reply, BYTEZ_MODEL


class AIProxyHandler(BaseHTTPRequestHandler):
    server_version = "SecurraBYTEZProxy/1.0"

    def _send_json(self, status_code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send_json(200, {"ok": True, "model": BYTEZ_MODEL, "backend": "bytez"})
            return
        self._send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path not in ("/api/ai", "/api/bytez"):
            self._send_json(404, {"error": "Not found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length).decode("utf-8", errors="replace")
            data = json.loads(raw_body or "{}")

            raw_messages = data.get("messages")
            if not isinstance(raw_messages, list) or not raw_messages:
                raise ValueError("Request must include a non-empty messages array.")

            reply, model_used = call_bytez(raw_messages)
            self._send_json(200, {"reply": reply, "model": model_used})
        except Exception as exc:  # noqa: BLE001
            message = str(exc) or "Internal server error"
            print(f"[BYTEZ] Proxy error: {message}")
            self._send_json(500, {"error": message})

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[HTTP] {self.address_string()} - {fmt % args}")


def main() -> None:
    server = ThreadingHTTPServer(("", PORT), AIProxyHandler)
    print(f"\n{'='*60}")
    print(f"🚀 BYTEZ Proxy running on http://localhost:{PORT}/api/ai")
    print(f"📦 Model: {BYTEZ_MODEL}")
    print(f"🔗 BYTEZ API: {BYTEZ_BASE_URL}")
    print(f"{'='*60}\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping proxy...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
