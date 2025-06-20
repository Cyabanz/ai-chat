export default async function handler(req, res) {
  const API_KEY = process.env.HYPERBEAM_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "Missing Hyperbeam API key in environment variables." });
  }

  // Set session to expire after 5 minutes (300 seconds)
  const payload = {
    expires_in: 300
  };

  // Create the Hyperbeam session
  const response = await fetch("https://engine.hyperbeam.com/v0/vm", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    return res.status(500).json({ error: error.error || "Failed to create Hyperbeam session." });
  }

  const data = await response.json();
  // data.url is the embed URL for the session
  res.status(200).json({ url: data.url });
}
