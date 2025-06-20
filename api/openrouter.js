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
  const { history } = req.body;

  // Convert your chatHistory to OpenAI format
  const messages = history.map(item => ({
    role: item.role === "user" ? "user" : "assistant",
    content: item.text
  }));

  try {
    const apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", // Change this to any OpenRouter-supported model!
        messages
      })
    });
    const data = await apiRes.json();
    const responseText =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't understand.";
    res.status(200).json({ text: responseText });
  } catch (err) {
    res.status(500).json({ error: "OpenRouter API error" });
  }
}
