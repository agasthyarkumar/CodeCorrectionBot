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
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}
