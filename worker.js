// station-12 - serves the grabcalls-website repo as static assets,
// plus a secure server-side WebSocket relay to the xAI Realtime voice agent.
//
// SECURITY: the xAI API key lives ONLY here, as a Cloudflare Worker secret
// (env.XAI_API_KEY). It is never sent to the browser. The browser connects to
// this Worker at /api/voice-relay; the Worker opens the upstream WebSocket to
// xAI using the secret and pipes frames both directions.
//
// Set the secret once (not committed to git):
//   wrangler secret put XAI_API_KEY

const XAI_REALTIME_URL =
  "https://api.x.ai/v1/realtime?agent_id=agent_o9AASYIPgv15rppb";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Secure voice relay: browser <-> this Worker <-> xAI Realtime API.
    if (url.pathname === "/api/voice-relay") {
      return handleVoiceRelay(request, env);
    }

    // gloverhvac.grabcalls.com is scoped to the /glover-heating-air folder.
    if (
      url.hostname === "gloverhvac.grabcalls.com" &&
      !url.pathname.startsWith("/glover-heating-air")
    ) {
      url.pathname =
        "/glover-heating-air" + (url.pathname === "/" ? "/" : url.pathname);
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleVoiceRelay(request, env) {
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected a WebSocket upgrade request.", {
      status: 426
    });
  }

  // Fail closed if the secret has not been set yet. The static site is
  // unaffected; only the live demo returns this until the secret is added.
  if (!env.XAI_API_KEY) {
    return new Response(
      "voice_relay_unconfigured: XAI_API_KEY secret is not set on the Worker.",
      { status: 503 }
    );
  }

  // Open the upstream WebSocket to xAI with the secret key.
  let upstreamResp;
  try {
    upstreamResp = await fetch(XAI_REALTIME_URL, {
      headers: {
        Upgrade: "websocket",
        Authorization: "Bearer " + env.XAI_API_KEY
      }
    });
  } catch (err) {
    return new Response("upstream_connect_failed: " + err, { status: 502 });
  }

  const upstream = upstreamResp.webSocket;
  if (!upstream) {
    return new Response(
      "upstream_no_websocket: xAI returned HTTP " + upstreamResp.status,
      { status: 502 }
    );
  }

  // Browser-facing socket pair.
  const pair = new WebSocketPair();
  const client = pair[0];
  const server = pair[1];

  server.accept();
  upstream.accept();

  // Pipe browser -> xAI.
  server.addEventListener("message", (e) => {
    try {
      upstream.send(e.data);
    } catch (_) {}
  });

  // Pipe xAI -> browser.
  upstream.addEventListener("message", (e) => {
    try {
      server.send(e.data);
    } catch (_) {}
  });

  // Mirror closes/errors on both sides (no codes passed; some are invalid
  // to forward and would throw).
  server.addEventListener("close", () => {
    try {
      upstream.close();
    } catch (_) {}
  });
  upstream.addEventListener("close", () => {
    try {
      server.close();
    } catch (_) {}
  });
  server.addEventListener("error", () => {
    try {
      upstream.close();
    } catch (_) {}
  });
  upstream.addEventListener("error", () => {
    try {
      server.close();
    } catch (_) {}
  });

  return new Response(null, { status: 101, webSocket: client });
}
