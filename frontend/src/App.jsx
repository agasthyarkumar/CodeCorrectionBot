import { useState } from "react";
import Chat from "./components/Chat";
import CodeInput from "./components/CodeInput";
import InputBox from "./components/InputBox";
import ModeSelector from "./components/ModeSelector";
import { sendMessage } from "./api";
import "./App.css";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("explain");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode !== "fix") setCode("");
    setError(null);
  };

  const handleSubmit = async (message) => {
    setError(null);
    const userMsg = { role: "user", content: message, code: mode === "fix" ? code : undefined };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await sendMessage({
        message,
        mode,
        code: mode === "fix" ? code : undefined,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
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
        <Chat messages={messages} loading={loading} />

        {error && (
          <div className="app__error" role="alert">
            <span className="app__error-icon">⚠</span>
            {error}
          </div>
        )}

        <div className="app__input-area">
          {mode === "fix" && (
            <CodeInput value={code} onChange={setCode} />
          )}
          <InputBox
            onSubmit={handleSubmit}
            loading={loading}
            mode={mode}
          />
        </div>
      </main>
    </div>
  );
}
