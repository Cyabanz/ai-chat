import crypto from "crypto";

// --- In-memory Rate Limit Store (per lambda instance) ---
const RATE_LIMITS = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per window

function rateLimit(req, res) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  if (!RATE_LIMITS[ip]) RATE_LIMITS[ip] = [];
  // Remove timestamps outside the window
  RATE_LIMITS[ip] = RATE_LIMITS[ip].filter(ts => now - ts < RATE_LIMIT_WINDOW);
  if (RATE_LIMITS[ip].length >= RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Too many requests, slow down." });
    return false;
  }
  RATE_LIMITS[ip].push(now);
  return true;
}

// --- Minimal CSRF (Double Submit Cookie pattern) ---
function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

function setCsrfCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `csrfToken=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`
  );
}

function getCsrfFromCookie(req) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/csrfToken=([A-Za-z0-9]+)/);
  return match ? match[1] : "";
}
function verifyCsrf(req) {
  const csrfCookie = getCsrfFromCookie(req);
  const csrfHeader = req.headers["x-csrf-token"];
  return csrfCookie && csrfHeader && csrfCookie === csrfHeader;
}

// --- Main handler ---
export default async function handler(req, res) {
  // Rate limit all requests
  if (!rateLimit(req, res)) return;

  if (req.method === "GET") {
    // Issue CSRF token
    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);
    return res.status(200).json({ csrfToken });
  }

  if (req.method === "POST") {
    if (!verifyCsrf(req)) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }

    const API_KEY = process.env.HYPERBEAM_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "Missing Hyperbeam API key in environment variables." });
    }

    try {
      const payload = { expires_in: 300 };
      const response = await fetch("https://engine.hyperbeam.com/v0/vm", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(500).json({ error: data.error || JSON.stringify(data) });
      }

      // Return session_id and admin_token for session termination
      if (data && data.embed_url && data.session_id && data.admin_token) {
        return res.status(200).json({
          url: data.embed_url,
          session_id: data.session_id,
          admin_token: data.admin_token // (move this server-side for best security)
        });
      } else {
        return res.status(500).json({ error: "No embed_url/session_id/admin_token in Hyperbeam response: " + JSON.stringify(data) });
      }
    } catch (err) {
      return res.status(500).json({ error: "Server error: " + err.message });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
