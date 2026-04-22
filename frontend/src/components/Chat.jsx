import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import "./Chat.css";

function CodeBlock({ children, className }) {
  const language = /language-(\w+)/.exec(className || "")?.[1];
  if (!language) {
    return <code className="chat__inline-code">{children}</code>;
  }
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      PreTag="div"
      customStyle={{
        margin: "10px 0",
        borderRadius: "8px",
        fontSize: "13px",
        border: "1px solid var(--border)",
      }}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
}

function UserMessage({ content, code }) {
  return (
    <div className="chat__message chat__message--user">
      {code && (
        <pre className="chat__user-code">
          <code>{code}</code>
        </pre>
      )}
      <p className="chat__user-text">{content}</p>
    </div>
  );
}

function AssistantMessage({ content }) {
  return (
    <div className="chat__message chat__message--assistant">
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
      <span className="chat__dot" />
      <span className="chat__dot" />
      <span className="chat__dot" />
    </div>
  );
}

export default function Chat({ messages, loading }) {
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
            <li><strong>Explain</strong> — "How does a segment tree work?"</li>
            <li><strong>Generate</strong> — "Give me a medium graph problem"</li>
            <li><strong>Fix</strong> — Paste broken code + describe the bug</li>
            <li><strong>Hint</strong> — "I'm stuck on the sliding window approach"</li>
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
          <AssistantMessage key={i} content={msg.content} />
        )
      )}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
