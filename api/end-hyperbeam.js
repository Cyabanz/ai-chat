export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { session_id, admin_token } = req.body;

  if (!session_id || !admin_token) {
    return res.status(400).json({ error: "Missing session_id or admin_token" });
  }

  try {
    const response = await fetch(`https://engine.hyperbeam.com/v0/vm/${session_id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${admin_token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const data = await response.json();
      return res.status(500).json({ error: data.error || JSON.stringify(data) });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
