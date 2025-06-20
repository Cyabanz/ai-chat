export default async function handler(req, res) {
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
      console.error("Hyperbeam error:", data);
      return res.status(500).json({ error: data.error || JSON.stringify(data) });
    }

    if (data && data.embed_url) {
      return res.status(200).json({ url: data.embed_url });
    } else {
      return res.status(500).json({ error: "No embed_url in Hyperbeam response: " + JSON.stringify(data) });
    }
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
