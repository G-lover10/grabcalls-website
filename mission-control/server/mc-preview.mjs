import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../mission-control");
const STATUS_URL =
  "https://n8n.grabcalls.com/webhook/ops-status-92cfbede15b161c850df0601";
const MODEL = "grok-4.3";
const MAX_MESSAGE = 2000;
const MAX_TOKENS = 400;
const PORT = 8080;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

export function originAllowed(origin) {
  if (!origin) return true;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase();
  if (host === "grabcalls.com" || host === "www.grabcalls.com") return true;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  if (host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com")) return true;
  if (host === "grok.com" || host.endsWith(".grok.com")) return true;
  if (host === "x.ai" || host.endsWith(".x.ai")) return true;
  if (host === "grokusercontent.com" || host.endsWith(".grokusercontent.com")) return true;
  return false;
}

export function summarizeItems(payload) {
  const items = Array.isArray(payload) ? payload : payload?.items || [];
  return items
    .map((it) => {
      const title = String(it.title || "").slice(0, 180);
      const next = String(it.next_step || "none").slice(0, 240);
      return `- [${it.type || "?"}/${it.status || "?"}] ${title} | next: ${next} | updated: ${it.last_updated || "?"}`;
    })
    .join("\n");
}

export function buildMessages(summary, message, history) {
  const system = [
    "You are the manager for Eric at Glover Enterprise. Eric is the boss. You are not.",
    "Answer only from the items summary and the conversation.",
    "If the summary does not contain it, say you do not have it in the items list.",
    "Do not invent clients, revenue, or statuses.",
    "Do not claim you edited the repo, sent email, or changed any server.",
    "Never ask for or repeat API keys, tokens, or passwords.",
    "BFRS is hands-off. GoHighLevel is outdated. The Grok voice agent replaced it.",
    "The model list Fable 5, Sonnet, Laguna, Ling-1T is outdated.",
    "When work should go to someone, name one worker: Claude, Claude Code, or Kimi.",
    "Claude and Claude Code build and write. Kimi is for a second opinion. You only propose. Eric decides.",
    "Keep the spoken part to 2 sentences.",
    "End with one line, exactly: ASSIGN: Worker | the task",
    "Use ASSIGN: none when there is nothing to hand out.",
    "",
    "ITEMS:",
    summary || "(no items loaded)",
  ].join("\n");
  const turns = (Array.isArray(history) ? history : []).slice(-10).map((h) => ({
    role: h && h.role === "assistant" ? "assistant" : "user",
    content: String((h && h.content) || "").slice(0, MAX_MESSAGE),
  })).filter((h) => h.content);
  return [
    { role: "system", content: system },
    ...turns,
    { role: "user", content: message },
  ];
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 64_000) {
        reject(new Error("too_long"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res, code, body, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
  if (origin && originAllowed(origin)) headers["Access-Control-Allow-Origin"] = origin;
  res.writeHead(code, headers);
  res.end(JSON.stringify(body));
}

let statusCache = { at: 0, body: null, code: 0 };

async function proxyStatus() {
  if (statusCache.body && Date.now() - statusCache.at < 15_000) {
    return statusCache;
  }
  const upstream = await fetch(STATUS_URL, { cache: "no-store" });
  const text = await upstream.text();
  statusCache = { at: Date.now(), body: text, code: upstream.status };
  return statusCache;
}

async function askGrok(message, history) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { status: 503, body: { error: "upstream" } };
  const raw = fs.readFileSync(path.join(ROOT, "items.json"), "utf8");
  const summary = summarizeItems(JSON.parse(raw));
  const messages = buildMessages(summary, message, history);
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: MAX_TOKENS,
      messages,
    }),
  });
  if (!res.ok) return { status: 502, body: { error: "upstream" } };
  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) return { status: 502, body: { error: "upstream" } };
  return { status: 200, body: { reply } };
}

async function mintVoiceSecret() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { status: 503, body: { error: "upstream" } };
  const res = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ expires_after: { seconds: 300 } }),
  });
  if (!res.ok) return { status: 502, body: { error: "upstream" } };
  const data = await res.json();
  if (!data || typeof data.value !== "string" || !data.value) {
    return { status: 502, body: { error: "upstream" } };
  }
  return { status: 200, body: { value: data.value, expires_at: data.expires_at } };
}

function staticPath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const rel = clean === "/" ? "/index.html" : clean;
  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT + path.sep) && full !== ROOT) return null;
  return full;
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const origin = req.headers.origin || "";
    const url = new URL(req.url || "/", "http://127.0.0.1");

    if (req.method === "OPTIONS") {
      if (!originAllowed(origin)) {
        res.writeHead(403);
        res.end();
        return;
      }
      res.writeHead(204, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
      });
      res.end();
      return;
    }

    if (url.pathname === "/api/ops-status" && req.method === "GET") {
      try {
        const proxied = await proxyStatus();
        res.writeHead(proxied.code || 502, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(proxied.body);
      } catch {
        sendJson(res, 502, { error: "unavailable" }, origin);
      }
      return;
    }

    if (url.pathname === "/api/voice-secret" && req.method === "GET") {
      if (origin && !originAllowed(origin)) {
        sendJson(res, 403, { error: "origin" }, "");
        return;
      }
      try {
        const result = await mintVoiceSecret();
        sendJson(res, result.status, result.body, origin);
      } catch (err) {
        console.error("voice secret failed", err && err.message ? err.message : err);
        sendJson(res, 502, { error: "upstream" }, origin);
      }
      return;
    }

    if (url.pathname === "/api/chat" && (req.method === "GET" || req.method === "POST")) {
      if (origin && !originAllowed(origin)) {
        sendJson(res, 403, { error: "origin" }, "");
        return;
      }
      try {
        let message = "";
        let history = [];
        if (req.method === "GET") {
          message = (url.searchParams.get("message") || "").trim();
          const rawHistory = url.searchParams.get("history") || "";
          if (rawHistory) {
            const parsed = JSON.parse(rawHistory);
            history = Array.isArray(parsed) ? parsed : [];
          }
        } else {
          const text = await readBody(req);
          const body = JSON.parse(text || "{}");
          message = typeof body.message === "string" ? body.message.trim() : "";
          history = body.history;
        }
        if (!message) {
          sendJson(res, 400, { error: "empty" }, origin);
          return;
        }
        if (message.length > MAX_MESSAGE) {
          sendJson(res, 400, { error: "too_long" }, origin);
          return;
        }
        const result = await askGrok(message, history);
        sendJson(res, result.status, result.body, origin);
      } catch (err) {
        console.error("chat failed", err && err.message ? err.message : err);
        sendJson(res, 400, { error: "empty" }, origin);
      }
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }

    const file = staticPath(url.pathname);
    if (!file) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const type = TYPES[path.extname(file)] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      fs.createReadStream(file).pipe(res);
    });
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const server = createServer();
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Mission Control preview on 0.0.0.0:${PORT}`);
  });
}

