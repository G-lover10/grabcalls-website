// station-12 — serves the grabcalls-website repo as static assets.
// Special case: gloverhvac.grabcalls.com is scoped to the /glover-heating-air
// folder so the Glover HVAC site lives at that subdomain's root with a clean URL.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "gloverhvac.grabcalls.com" && !url.pathname.startsWith("/glover-heating-air")) {
      url.pathname = "/glover-heating-air" + (url.pathname === "/" ? "/" : url.pathname);
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }
    return env.ASSETS.fetch(request);
  }
};
