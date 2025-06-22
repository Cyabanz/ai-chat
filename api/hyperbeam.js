const API_KEY = process.env.HYPERBEAM_API_KEY;
if (!API_KEY) {
  throw new Error("Missing Hyperbeam API key in environment variables.");
}

// In-memory store for rate limiting
const rateLimitStore = new Map();

function isValidIP(ip) {
  const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

function rateLimiter(ip, maxRequests, windowMs) {
  const now = Date.now();
  const rateLimitEntry = rateLimitStore.get(ip);

  if (!rateLimitEntry) {
    rateLimitStore.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }

  const { count, firstRequestTime } = rateLimitEntry;

  if (now - firstRequestTime > windowMs) {
    rateLimitStore.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }

  if (count < maxRequests) {
    rateLimitStore.set(ip, { count: count + 1, firstRequestTime });
    return true;
  }

  return false;
}

export default async function handler(req, res) {
  const MAX_REQUESTS = 100; // Maximum requests allowed per IP
  const WINDOW_MS = 15 * 60 * 1000; // 15-minute window
  const PAYLOAD_SIZE_LIMIT = 1024; // Limit payload to 1 KB to prevent abuse

  const IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Validate IP
  if (!isValidIP(IP)) {
    return res.status(400).json({ error: "Invalid IP address." });
  }

  // Implement rate limiting
  if (!rateLimiter(IP, MAX_REQUESTS, WINDOW_MS)) {
    return res.status(429).json({ error: "Too many requests, please try again later." });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Validate payload size
  const contentLength = parseInt(req.headers['content-length'], 10);
  if (contentLength > PAYLOAD_SIZE_LIMIT) {
    return res.status(413).json({ error: "Payload too large." });
  }

  try {
    const payload = { expires_in: 300 }; // 5-minute expiration time
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
      return res.status(response.status).json({ error: data.error || JSON.stringify(data) });
    }

    if (data && data.embed_url && data.session_id && data.admin_token) {
      // Schedule session termination after 5 minutes
      setTimeout(async () => {
        try {
          await fetch(`https://engine.hyperbeam.com/v0/vm/${data.session_id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${API_KEY}`
            }
          });
          console.log(`Session ${data.session_id} terminated.`);
        } catch (err) {
          console.error(`Failed to terminate session ${data.session_id}:`, err.message);
        }
      }, 300000); // 5 minutes in milliseconds

      return res.status(200).json({
        url: data.embed_url,
        session_id: data.session_id,
        admin_token: data.admin_token
      });
    }

    return res.status(500).json({ error: "No embed_url/session_id/admin_token in Hyperbeam response: " + JSON.stringify(data) });
  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
