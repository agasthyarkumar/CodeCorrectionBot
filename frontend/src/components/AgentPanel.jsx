import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import "./AgentPanel.css";

function CodeBlock({ children, className }) {
  const language = /language-(\w+)/.exec(className || "")?.[1];
  if (!language) return <code className="agent__inline-code">{children}</code>;
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      PreTag="div"
      customStyle={{
        margin: "8px 0",
        borderRadius: "6px",
        fontSize: "12.5px",
        border: "1px solid var(--border)",
      }}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
}

function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          return <CodeBlock className={className}>{children}</CodeBlock>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function ThinkingStep({ content }) {
  return (
    <div className="agent__step agent__step--thinking">
      <span className="agent__spinner" />
      <span>{content}</span>
    </div>
  );
}

function CodeStep({ content, iteration }) {
  // Extract only the code block to display; hide the surrounding prose
  const match = content.match(/```python[\s\S]*?```/);
  const codeSnippet = match ? match[0] : content;
  return (
    <div className="agent__step agent__step--code">
      <div className="agent__step-header">
        <span className="agent__attempt-badge">Attempt {iteration}</span>
        <span className="agent__step-label">Writing code...</span>
      </div>
      <MarkdownContent content={codeSnippet} />
    </div>
  );
}

function RunningStep({ iteration }) {
  return (
    <div className="agent__step agent__step--running">
      <span className="agent__run-icon">▶</span>
      <span>Running attempt {iteration}...</span>
    </div>
  );
}

function OutputStep({ content, success, iteration }) {
  return (
    <div className={`agent__step agent__step--output${success ? " agent__step--success" : " agent__step--error"}`}>
      <div className="agent__step-header">
        <span className="agent__output-icon">{success ? "✓" : "✗"}</span>
        <span className="agent__step-label">
          {success ? `Output (attempt ${iteration})` : `Error (attempt ${iteration})`}
        </span>
      </div>
      <pre className="agent__output-pre">{content}</pre>
    </div>
  );
}

function FinalStep({ content }) {
  // Strip the "FINAL:" prefix the LLM adds before rendering markdown
  const cleaned = content.replace(/^FINAL:\s*/i, "").trim();
  return (
    <div className="agent__step agent__step--final">
      <div className="agent__final-header">
        <span className="agent__final-icon">✦</span>
        <span>Solution</span>
      </div>
      <div className="agent__final-content">
        <MarkdownContent content={cleaned} />
      </div>
    </div>
  );
}

function ErrorStep({ content }) {
  return (
    <div className="agent__step agent__step--agent-error">
      <span className="agent__error-icon">⚠</span>
      <span>{content}</span>
    </div>
  );
}

export default function AgentPanel({ steps, done }) {
  return (
    <div className={`agent__panel${done ? " agent__panel--done" : ""}`}>
      <div className="agent__panel-header">
        <span className="agent__panel-icon">◈</span>
        <span>Python Agent</span>
        {!done && <span className="agent__panel-spinner" />}
      </div>

      <div className="agent__steps">
        {steps.map((step, i) => {
          switch (step.type) {
            case "thinking":
              return <ThinkingStep key={i} content={step.content} />;
            case "code":
              return <CodeStep key={i} content={step.content} iteration={step.iteration} />;
            case "running":
              return <RunningStep key={i} iteration={step.iteration} />;
            case "output":
              return (
                <OutputStep
                  key={i}
                  content={step.content}
                  success={step.success}
                  iteration={step.iteration}
                />
              );
            case "final":
              return <FinalStep key={i} content={step.content} />;
            case "error":
              return <ErrorStep key={i} content={step.content} />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
