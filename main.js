document.getElementById('start-btn').onclick = async function() {
  const container = document.getElementById('session-container');
  container.innerHTML = "Starting session...";
  // Call the Vercel API route to get a Hyperbeam session URL
  const resp = await fetch('/api/hyperbeam');
  const data = await resp.json();
  if (data.url) {
    container.innerHTML = `<iframe src="${data.url}" allow="camera; microphone; clipboard-write; display-capture"></iframe>`;
  } else {
    container.innerHTML = `Failed to start session. ${data.error ? data.error : ""}`;
  }
};
