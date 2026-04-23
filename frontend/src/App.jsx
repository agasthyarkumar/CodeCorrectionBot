import { useCallback, useState } from "react";
import Chat from "./components/Chat";
import CodeInput from "./components/CodeInput";
import InputBox from "./components/InputBox";
import ModeSelector from "./components/ModeSelector";
import AgentPage from "./pages/AgentPage";
import { sendMessage } from "./api";
import "./App.css";

// ── SVG icons ─────────────────────────────────────────────────────────────────
function ZapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

// ── Greeting detection ────────────────────────────────────────────────────────
const GREETING_WORDS = new Set([
  "hi", "hello", "hey", "hiya", "howdy", "yo", "sup",
  "greetings", "morning", "evening", "afternoon",
]);
const GREETING_REPLIES = [
  "Hello — what DSA topic can I help you with today?",
  "Hi. Ready to work through some algorithms. What are you tackling?",
  "Hello. Ask me to explain a concept, generate a problem, review your code, or give a hint.",
];
let _greetIdx = 0;

function isGreeting(msg) {
  const words = msg.toLowerCase().replace(/[!.,?]/g, "").trim().split(/\s+/);
  return words.length <= 4 && words.some((w) => GREETING_WORDS.has(w));
}

function getFriendlyError(err) {
  const status = err?.status;
  const msg = err?.message?.toLowerCase() ?? "";
  if (status === 429 || msg.includes("rate limit"))
    return "Rate limit reached. Wait a moment and try again.";
  if (status === 401)
    return "Authentication failed. Check the API token in your .env file.";
  if (status === 502 || msg.includes("unavailable"))
    return "The LLM provider is temporarily unavailable. Try again shortly.";
  return "Something went wrong. Please try again.";
}

// ── DSA page ──────────────────────────────────────────────────────────────────
function DsaPage({ onGoToAgent }) {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("explain");
  const [code, setCode] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    if (newMode !== "fix") setCode("");
    setError(null);
  }, []);

  const handleHintClick = useCallback(({ text, mode: hintMode }) => {
    setMode(hintMode);
    setInputValue(text);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (message) => {
    setError(null);
    const userMsg = { role: "user", content: message, code: mode === "fix" ? code : undefined };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    if (isGreeting(message)) {
      const reply = GREETING_REPLIES[_greetIdx % GREETING_REPLIES.length];
      _greetIdx++;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      return;
    }

    setLoading(true);
    try {
      const data = await sendMessage({ message, mode, code: mode === "fix" ? code : undefined });
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
  }, [mode, code]);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-icon"><ZapIcon /></span>
          <span className="app__brand-name">DSA Tutor</span>
        </div>

        <ModeSelector mode={mode} onChange={handleModeChange} />

        <button className="app__agent-btn" onClick={onGoToAgent} type="button">
          <TerminalIcon />
          Python Agent
        </button>
      </header>

      <main className="app__main">
        <Chat messages={messages} loading={loading} onHintClick={handleHintClick} />

        {error && (
          <div className="app__error" role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
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

// ── Root router ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dsa");

  if (page === "agent") {
    return <AgentPage onBack={() => setPage("dsa")} />;
  }
  return <DsaPage onGoToAgent={() => setPage("agent")} />;
}
