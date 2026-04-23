const API_URL = import.meta.env.VITE_API_URL || "";
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

export async function sendMessage({ message, mode, code }) {
  const body = { message, mode };
  if (code && code.trim()) body.code = code;

  const res = await fetch(`${API_URL}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.detail || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Run the Python agent and stream steps back via SSE.
 * onEvent(event) is called for each parsed SSE event object.
 */
export async function runAgent({ message, code, onEvent }) {
  const body = { message };
  if (code && code.trim()) body.code = code;

  const res = await fetch(`${API_URL}/api/v1/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.detail || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let terminal = false;
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const event = JSON.parse(line.slice(6));
            onEvent(event);
            // "final" and "error" are the last events — no need to keep reading
            if (event.type === "final" || event.type === "error") {
              terminal = true;
            }
          } catch {
            // skip malformed events
          }
        }
      }
      if (terminal) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}
