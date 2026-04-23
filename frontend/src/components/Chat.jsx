import { memo, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import "./Chat.css";

// ── SVG hint icons ────────────────────────────────────────────────────────────
function BookOpenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  );
}
function WrenchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  );
}

const HINTS = [
  { mode: "explain",  label: "Explain",  Icon: BookOpenIcon, text: "How does a segment tree work?" },
  { mode: "generate", label: "Generate", Icon: LayersIcon,   text: "Give me a medium graph problem" },
  { mode: "fix",      label: "Fix",      Icon: WrenchIcon,   text: "My binary search returns the wrong index" },
  { mode: "hint",     label: "Hint",     Icon: CompassIcon,  text: "I'm stuck on the sliding window approach" },
];

// ── Code block with syntax highlighting ──────────────────────────────────────
const CodeBlock = memo(function CodeBlock({ className, children }) {
  const language = /language-(\w+)/.exec(className || "")?.[1];
  if (!language) {
    return <code className="chat__inline-code">{children}</code>;
  }
  return (
    <SyntaxHighlighter
      language={language}
      style={vs}
      PreTag="div"
      customStyle={{
        margin: "10px 0",
        borderRadius: "6px",
        fontSize: "13px",
        border: "1px solid var(--border)",
        background: "var(--bg-code)",
      }}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
});

// ── Message components ────────────────────────────────────────────────────────
const UserMessage = memo(function UserMessage({ content, code }) {
  return (
    <div className="chat__message chat__message--user">
      {code && <pre className="chat__user-code"><code>{code}</code></pre>}
      <p className="chat__user-text">{content}</p>
    </div>
  );
});

const MD_COMPONENTS = {
  code({ className, children }) {
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
  table({ children }) {
    return <div className="chat__table-wrap"><table>{children}</table></div>;
  },
};

const AssistantMessage = memo(function AssistantMessage({ content, isError }) {
  return (
    <div className={`chat__message chat__message--assistant${isError ? " chat__message--error" : ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

function TypingIndicator() {
  return (
    <div className="chat__message chat__message--assistant chat__message--loading">
      <span className="chat__dot" />
      <span className="chat__dot" />
      <span className="chat__dot" />
    </div>
  );
}

// ── Main Chat component ───────────────────────────────────────────────────────
export default function Chat({ messages, loading, onHintClick }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="chat chat--empty">
        <div className="chat__empty-state">
          <p className="chat__empty-headline">What would you like to learn?</p>
          <ul className="chat__empty-hints">
            {HINTS.map((h) => (
              <li key={h.mode}>
                <button
                  className="chat__hint-btn"
                  onClick={() => onHintClick({ text: h.text, mode: h.mode })}
                  type="button"
                >
                  <span className="chat__hint-icon"><h.Icon /></span>
                  <span className="chat__hint-label">{h.label}</span>
                  <span className="chat__hint-text">{h.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="chat">
      {messages.map((msg, i) =>
        msg.role === "user" ? (
          <UserMessage key={i} content={msg.content} code={msg.code} />
        ) : (
          <AssistantMessage key={i} content={msg.content} isError={msg.isError} />
        )
      )}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
