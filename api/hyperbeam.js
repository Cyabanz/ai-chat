const fetch = require('node-fetch'); // If on Netlify, node-fetch is already available

exports.handler = async function(event, context) {
  const API_KEY = process.env.HYPERBEAM_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing Hyperbeam API key in environment variables." })
    };
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
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error || JSON.stringify(data) })
      };
    }

    if (data && data.embed_url) {
      return {
        statusCode: 200,
        body: JSON.stringify({ url: data.embed_url })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No embed_url in Hyperbeam response: " + JSON.stringify(data) })
      };
    }
  } catch (err) {
    console.error("Server error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error: " + err.message })
    };
  }
};
