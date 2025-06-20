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
      // Log and return the real error from Hyperbeam
      console.error("Hyperbeam error:", data);
      return res.status(500).json({ error: data.error || JSON.stringify(data) });
    }

    res.status(200).json({ url: data.url });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
}
