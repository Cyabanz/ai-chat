export default async function handler(req, res) {
  const HYPERBEAM_API_KEY = process.env.HYPERBEAM_API_KEY;
  if (!HYPERBEAM_API_KEY) {
    res.status(500).json({ error: "Missing Hyperbeam API key" });
    return;
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
      res.status(500).json({ error: data.error || "Unknown error" });
      return;
    }
    // For demo: return admin_token (for session termination)
    res.json({
      url: data.url,
      session_id: data.session_id,
      admin_token: data.admin_token,
    });
  } else if (req.method === "DELETE") {
    const { session_id, admin_token } = req.body;
    if (!session_id || !admin_token) {
      res.status(400).json({ error: "Missing session_id or admin_token" });
      return;
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
      res.status(500).json({ error: data.error || "Unknown error" });
      return;
    }
    res.json({ ok: true });
  } else if (req.method === "GET") {
    const { session_id, admin_token } = req.query;
    if (!session_id || !admin_token) {
      res.status(400).json({ error: "Missing session_id or admin_token" });
      return;
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
      res.status(404).json({ error: data.error || "Session not found" });
      return;
    }
    res.json({ status: data.status, expires_at: data.expires_at });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
