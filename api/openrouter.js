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

  const { history, model } = req.body || {};
  if (!Array.isArray(history)) {
    res.status(400).json({ error: "Missing or invalid 'history' array in request body." });
    return;
  }

  const modelName = typeof model === "string" && model.length > 0
    ? model
    : "openai/gpt-3.5-turbo";

  const messages = history.map(item => ({
    role: item.role === "user" ? "user" : "assistant",
    content: item.text
  }));

  try {
    const apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      res.status(500).json({ error: data.error?.message || data.error || "OpenRouter API error" });
      return;
    }

    const responseText =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    res.status(200).json({ text: responseText });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "OpenRouter API error" });
  }
}