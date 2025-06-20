const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

let chatHistory = []; // Each item: {role: 'user'|'bot', text: string}

// Render all chat history
function renderChat() {
  chatBox.innerHTML = '';
  for (const msg of chatHistory) {
    const div = document.createElement('div');
    div.classList.add('message', msg.role);
    div.innerText = msg.text;
    chatBox.appendChild(div);
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Add message to history and re-render
function addMessage(role, text) {
  chatHistory.push({ role, text });
  renderChat();
}

// Replace last bot message (used for '...') with actual response
function replaceLastBotMessage(text) {
  // Find last bot message index
  for (let i = chatHistory.length - 1; i >= 0; i--) {
    if (chatHistory[i].role === 'bot') {
      chatHistory[i].text = text;
      break;
    }
  }
  renderChat();
}

// Get formatted history for API (Google Gemini expects contents with parts)
function getApiHistory(message) {
  // Google expects full history as array of {role: 'user'|'model', parts: [{text}]}
  // We'll map 'bot' to 'model'
  const history = [];
  for (const item of chatHistory) {
    history.push({
      role: item.role === 'bot' ? 'model' : 'user',
      parts: [{ text: item.text }]
    });
  }
  // Add the latest user message
  history.push({ role: 'user', parts: [{ text: message }] });
  return history;
}

// Send message to backend
async function getBotResponse(message) {
  const res = await fetch('/api/googleai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history: getApiHistory(message) })
  });
  const data = await res.json();
  return data.text || "Sorry, I couldn't understand.";
}

chatForm.onsubmit = async function(e) {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;
  addMessage('user', message);
  userInput.value = '';
  addMessage('bot', '...'); // Show loading
  try {
    const response = await getBotResponse(message);
    replaceLastBotMessage(response);
  } catch (err) {
    replaceLastBotMessage("Sorry, there was a server error.");
  }
};
