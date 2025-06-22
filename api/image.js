export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const API_KEY = process.env.OPENROUTER_API_KEY;
  if (!API_KEY) {
    res.status(500).json({ error: "API key not set" });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid 'prompt' in request body." });
    return;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        model: "openai/dall-e-3",
        n: 1,
        size: "1024x1024"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(500).json({ error: data.error?.message || data.error || "Image API error" });
      return;
    }

    const url = data?.data?.[0]?.url;
    if (!url) {
      res.status(500).json({ error: "No image URL returned from API" });
      return;
    }

    res.status(200).json({ url });
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: "Image API error" });
  }
}