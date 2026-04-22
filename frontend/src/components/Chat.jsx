import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import "./Chat.css";

const HINTS = [
  { mode: "explain",  label: "Explain",  text: "How does a segment tree work?" },
  { mode: "generate", label: "Generate", text: "Give me a medium graph problem" },
  { mode: "fix",      label: "Fix",      text: "My binary search returns the wrong index" },
  { mode: "hint",     label: "Hint",     text: "I'm stuck on the sliding window approach" },
];

function CodeBlock({ children, className }) {
  const language = /language-(\w+)/.exec(className || "")?.[1];
  if (!language) return <code className="chat__inline-code">{children}</code>;
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      PreTag="div"
      customStyle={{ margin: "10px 0", borderRadius: "8px", fontSize: "13px", border: "1px solid var(--border)" }}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
}

function UserMessage({ content, code }) {
  return (
    <div className="chat__message chat__message--user">
      {code && <pre className="chat__user-code"><code>{code}</code></pre>}
      <p className="chat__user-text">{content}</p>
    </div>
  );
}

function AssistantMessage({ content, isError }) {
  return (
    <div className={`chat__message chat__message--assistant${isError ? " chat__message--error" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          table({ children }) {
            return <div className="chat__table-wrap"><table>{children}</table></div>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chat__message chat__message--assistant chat__message--loading">
      <span className="chat__dot" /><span className="chat__dot" /><span className="chat__dot" />
    </div>
  );
}

export default function Chat({ messages, loading, onHintClick }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="chat chat--empty">
        <div className="chat__empty-state">
          <p className="chat__empty-headline">What do you want to learn today?</p>
          <ul className="chat__empty-hints">
            {HINTS.map((h) => (
              <li key={h.mode}>
                <button
                  className="chat__hint-btn"
                  onClick={() => onHintClick({ text: h.text, mode: h.mode })}
                  type="button"
                >
                  <strong>{h.label}</strong>
                  <span className="chat__hint-text">"{h.text}"</span>
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
