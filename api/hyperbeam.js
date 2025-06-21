// Place this in pages/api/hyperbeam.js

let sessionStore = {}; // In-memory store for session_id => admin_token

export default async function handler(req, res) {
  const HYPERBEAM_API_KEY = process.env.HYPERBEAM_API_KEY;
  if (!HYPERBEAM_API_KEY) {
    return res.status(500).json({ error: "Missing Hyperbeam API key" });
  }

  if (req.method === "POST") {
    const { url = "https://youtube.com", expires_in = 300 } = req.body || {};
    const hbRes = await fetch("https://engine.hyperbeam.com/v0/vm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HYPERBEAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, expires_in }),
    });
    const data = await hbRes.json();
    if (!hbRes.ok) {
      return res.status(500).json({ error: data.error || "Unknown error" });
    }
    // Save admin_token server-side for this session
    sessionStore[data.session_id] = data.admin_token;
    // Do NOT send admin_token to client in production!
    return res.status(200).json({
      url: data.url,
      session_id: data.session_id,
      // Uncomment line below ONLY for demo/testing purposes!
      // admin_token: data.admin_token,
    });
  }

  if (req.method === "DELETE") {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: "Missing session_id" });
    }
    const admin_token = sessionStore[session_id];
    if (!admin_token) {
      return res.status(400).json({ error: "Invalid session_id" });
    }
    const hbRes = await fetch(
      `https://engine.hyperbeam.com/v0/vm/${session_id}/terminate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HYPERBEAM_API_KEY}`,
          "X-Hyperbeam-Admin-Token": admin_token,
        },
      }
    );
    const data = await hbRes.json();
    if (!hbRes.ok) {
      return res.status(500).json({ error: data.error || "Unknown error" });
    }
    // Clean up store
    delete sessionStore[session_id];
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: "Missing session_id" });
    }
    const admin_token = sessionStore[session_id];
    if (!admin_token) {
      return res.status(400).json({ error: "Invalid session_id" });
    }
    const hbRes = await fetch(
      `https://engine.hyperbeam.com/v0/vm/${session_id}`,
      {
        headers: {
          Authorization: `Bearer ${HYPERBEAM_API_KEY}`,
          "X-Hyperbeam-Admin-Token": admin_token,
        },
      }
    );
    const data = await hbRes.json();
    if (!hbRes.ok) {
      return res.status(404).json({ error: data.error || "Session not found" });
    }
    return res.status(200).json({ status: data.status, expires_at: data.expires_at });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
