export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const API_KEY = process.env.GOOGLE_API_KEY;
  if (!API_KEY) {
    res.status(500).json({ error: "API key not set" });
    return;
  }
  const { history } = req.body;
  const payload = { contents: history };
  try {
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await apiRes.json();
    const responseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't understand.";
    res.status(200).json({ text: responseText });
  } catch (err) {
    res.status(500).json({ error: "Gemini API error" });
  }
}
