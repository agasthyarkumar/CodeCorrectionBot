import { useState } from "react";
import Chat from "./components/Chat";
import CodeInput from "./components/CodeInput";
import InputBox from "./components/InputBox";
import ModeSelector from "./components/ModeSelector";
import { sendMessage } from "./api";
import "./App.css";

// ── Greeting detection (no API call needed) ───────────────────────────────────
const GREETING_WORDS = new Set([
  "hi", "hello", "hey", "hiya", "howdy", "yo", "sup",
  "greetings", "morning", "evening", "afternoon",
]);
const GREETING_REPLIES = [
  "Hey! What DSA topic can I help you with today?",
  "Hello! Ready to tackle some algorithms — what are you working on?",
  "Hi there! Ask me to explain a concept, generate a problem, fix your code, or give you a hint.",
];
let _greetIdx = 0;

function isGreeting(msg) {
  const words = msg.toLowerCase().replace(/[!.,?]/g, "").trim().split(/\s+/);
  return words.length <= 4 && words.some((w) => GREETING_WORDS.has(w));
}

// ── Error → friendly chat message ────────────────────────────────────────────
function getFriendlyError(err) {
  const status = err?.status;
  const msg = err?.message?.toLowerCase() ?? "";

  if (status === 429 || msg.includes("rate limit"))
    return "Slow down! You've hit the rate limit. Wait a minute and try again.";
  if (status === 401)
    return "Authentication failed. Check that the API token in your `.env` is correct.";
  if (msg.includes("token") && (msg.includes("quota") || msg.includes("limit") || msg.includes("exceed")))
    return "You've run out of API tokens. Check your usage limits on the provider dashboard.";
  if (status === 502 || msg.includes("unavailable"))
    return "Hmm, we're facing a technical issue on our end. Please try again in a moment.";

  return "Hmm, something went wrong. Please try again.";
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("explain");
  const [code, setCode] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode !== "fix") setCode("");
    setError(null);
  };

  // Called from Chat empty-state hints
  const handleHintClick = ({ text, mode: hintMode }) => {
    setMode(hintMode);
    setInputValue(text);
    setError(null);
  };

  const handleSubmit = async (message) => {
    setError(null);
    const userMsg = { role: "user", content: message, code: mode === "fix" ? code : undefined };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // Short-circuit greetings — no API call
    if (isGreeting(message)) {
      const reply = GREETING_REPLIES[_greetIdx % GREETING_REPLIES.length];
      _greetIdx++;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      return;
    }

    setLoading(true);
    try {
      const data = await sendMessage({
        message,
        mode,
        code: mode === "fix" ? code : undefined,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: getFriendlyError(err), isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-left">
          <span className="app__logo">⚡</span>
          <h1 className="app__title">DSA Chatbot</h1>
        </div>
        <ModeSelector mode={mode} onChange={handleModeChange} />
      </header>

      <main className="app__main">
        <Chat messages={messages} loading={loading} onHintClick={handleHintClick} />

        {error && (
          <div className="app__error" role="alert">
            <span className="app__error-icon">⚠</span>
            {error}
          </div>
        )}

        <div className="app__input-area">
          {mode === "fix" && <CodeInput value={code} onChange={setCode} />}
          <InputBox
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            loading={loading}
            mode={mode}
          />
        </div>
      </main>
    </div>
  );
}
