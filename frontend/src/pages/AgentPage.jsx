import { memo, useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { runAgent } from "../api";
import "./AgentPage.css";

// ── SVG icons ─────────────────────────────────────────────────────────────────
function ChevronLeftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function TerminalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"/>
      <line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
function XCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

// ── Shared markdown renderer ──────────────────────────────────────────────────
function CodeBlock({ className, children }) {
  const lang = /language-(\w+)/.exec(className || "")?.[1];
  if (!lang) return <code className="ap-inline-code">{children}</code>;
  return (
    <SyntaxHighlighter
      language={lang}
      style={vs}
      PreTag="div"
      customStyle={{
        margin: "8px 0",
        borderRadius: "6px",
        fontSize: "12.5px",
        border: "1px solid var(--border)",
        background: "var(--bg-code)",
      }}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
}

const MD_COMPONENTS = {
  code: CodeBlock,
  table({ children }) {
    return <div className="ap-table-wrap"><table>{children}</table></div>;
  },
};

function Markdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
      {children}
    </ReactMarkdown>
  );
}

// ── Step renderers ────────────────────────────────────────────────────────────
function StepThinking({ content }) {
  return (
    <div className="ap-step ap-step--thinking">
      <span className="ap-spinner" />
      <span>{content}</span>
    </div>
  );
}

function StepCode({ content, iteration }) {
  const match = content.match(/```python[\s\S]*?```/);
  const snippet = match ? match[0] : content;
  return (
    <div className="ap-step ap-step--code">
      <div className="ap-step__bar">
        <span className="ap-step__bar-icon"><CodeIcon /></span>
        <span className="ap-step__bar-label">Attempt {iteration}</span>
      </div>
      <Markdown>{snippet}</Markdown>
    </div>
  );
}

function StepRunning({ iteration }) {
  return (
    <div className="ap-step ap-step--running">
      <span className="ap-pulse" />
      <span className="ap-step__dim">Executing attempt {iteration}…</span>
    </div>
  );
}

function StepOutput({ content, success, iteration }) {
  return (
    <div className={`ap-step ap-step--output ${success ? "ap-step--ok" : "ap-step--fail"}`}>
      <div className="ap-step__bar">
        <span className="ap-step__bar-icon">
          {success ? <CheckCircleIcon /> : <XCircleIcon />}
        </span>
        <span className="ap-step__bar-label">
          {success ? `Output — attempt ${iteration}` : `Error — attempt ${iteration}`}
        </span>
      </div>
      <pre className="ap-output-pre">{content}</pre>
    </div>
  );
}

function StepFinal({ content }) {
  const cleaned = content.replace(/^FINAL:\s*/i, "").trim();
  return (
    <div className="ap-step ap-step--final">
      <div className="ap-step__bar ap-step__bar--final">
        <span className="ap-step__bar-icon"><SparkleIcon /></span>
        <span className="ap-step__bar-label">Solution</span>
      </div>
      <div className="ap-final-body">
        <Markdown>{cleaned}</Markdown>
      </div>
    </div>
  );
}

function StepError({ content }) {
  return (
    <div className="ap-step ap-step--error">
      <span className="ap-step__bar-icon"><AlertIcon /></span>
      <span>{content}</span>
    </div>
  );
}

function Step({ step }) {
  switch (step.type) {
    case "thinking": return <StepThinking content={step.content} />;
    case "code":     return <StepCode content={step.content} iteration={step.iteration} />;
    case "running":  return <StepRunning iteration={step.iteration} />;
    case "output":   return <StepOutput content={step.content} success={step.success} iteration={step.iteration} />;
    case "final":    return <StepFinal content={step.content} />;
    case "error":    return <StepError content={step.content} />;
    default:         return null;
  }
}

// ── Agent card (memoized — completed runs never re-render) ────────────────────
const AgentCard = memo(function AgentCard({ steps, done }) {
  const hasFinal = steps.some(s => s.type === "final");
  return (
    <div className={`ap-card${done ? " ap-card--done" : " ap-card--live"}`}>
      <div className="ap-card__header">
        <span className="ap-card__header-icon"><TerminalIcon /></span>
        <span className="ap-card__header-title">Python Agent</span>
        {!done && <span className="ap-card__spinner" />}
        {done && (
          <span className={`ap-card__status ${hasFinal ? "ap-card__status--ok" : "ap-card__status--stopped"}`}>
            {hasFinal ? "Complete" : "Stopped"}
          </span>
        )}
      </div>
      <div className="ap-card__body">
        {steps.map((step, i) => <Step key={i} step={step} />)}
      </div>
    </div>
  );
});

// ── User task bubble ──────────────────────────────────────────────────────────
const UserBubble = memo(function UserBubble({ task }) {
  return (
    <div className="ap-user-bubble">
      <pre className="ap-user-text">{task}</pre>
    </div>
  );
});

// ── Completed run (memoized — stable props, never re-renders during streaming) ─
const CompletedRun = memo(function CompletedRun({ task, steps }) {
  return (
    <div className="ap-run">
      <UserBubble task={task} />
      <AgentCard steps={steps} done />
    </div>
  );
});

// ── Empty state ───────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Write a Fibonacci generator using dynamic programming",
  "Parse a CSV string and compute per-column averages",
  "Find all primes up to 1000 using the Sieve of Eratosthenes",
  "Sort a list of dicts by multiple keys with custom priority",
  "Count word frequency in a block of text and show the top 10",
];

function EmptyState({ onSuggest }) {
  return (
    <div className="ap-empty">
      <div className="ap-empty__icon"><TerminalIcon /></div>
      <h2 className="ap-empty__title">Python Agent</h2>
      <p className="ap-empty__sub">
        Writes, runs, and iteratively fixes Python code until it works.
      </p>
      <ul className="ap-empty__list">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button className="ap-empty__chip" onClick={() => onSuggest(s)} type="button">
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Agent input ───────────────────────────────────────────────────────────────
function AgentInput({ onSubmit, loading }) {
  const [value, setValue] = useState("");

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setValue("");
  }, [value, loading, onSubmit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  }, [submit]);

  const handleChange = (e) => {
    setValue(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 260) + "px";
  };

  return (
    <form className="ap-input" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="ap-input__row">
        <textarea
          className="ap-input__textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={"Describe a Python task, or paste code directly here…\n(Ctrl+Enter to run)"}
          disabled={loading}
          rows={4}
          spellCheck={false}
        />
        <button className="ap-input__run" type="submit" disabled={loading || !value.trim()}>
          {loading ? (
            <span className="ap-input__spinner" />
          ) : (
            <>
              <PlayIcon />
              Run
            </>
          )}
        </button>
      </div>
      <p className="ap-input__hint">Ctrl+Enter to run · standard library only · paste code directly</p>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgentPage({ onBack }) {
  const [history, setHistory] = useState([]);
  const [streamingSteps, setStreamingSteps] = useState(null);
  const [currentTask, setCurrentTask] = useState("");
  const [loading, setLoading] = useState(false);
  const stepsRef = useRef([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, streamingSteps]);

  const handleSubmit = useCallback(async (task) => {
    setLoading(true);
    setCurrentTask(task);
    stepsRef.current = [];
    setStreamingSteps([]);

    try {
      await runAgent({
        message: task,
        onEvent: (event) => {
          stepsRef.current.push(event);
          setStreamingSteps([...stepsRef.current]);
        },
      });
    } catch (err) {
      stepsRef.current.push({ type: "error", content: err.message });
      setStreamingSteps([...stepsRef.current]);
    } finally {
      const doneSteps = [...stepsRef.current];
      setHistory((prev) => [...prev, { task, steps: doneSteps }]);
      setStreamingSteps(null);
      setCurrentTask("");
      setLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    if (!loading) setHistory([]);
  }, [loading]);

  const showEmpty = history.length === 0 && streamingSteps === null;

  return (
    <div className="ap-page">
      <header className="ap-header">
        <button className="ap-header__back" onClick={onBack} type="button" aria-label="Back">
          <ChevronLeftIcon />
          DSA Tutor
        </button>
        <div className="ap-header__title">
          <span className="ap-header__title-icon"><TerminalIcon /></span>
          Python Agent
        </div>
        <button
          className="ap-header__clear"
          onClick={handleClear}
          disabled={loading || history.length === 0}
          type="button"
        >
          <TrashIcon />
          Clear
        </button>
      </header>

      <main className="ap-main">
        {showEmpty && <EmptyState onSuggest={handleSubmit} />}

        {history.map((run, i) => (
          <CompletedRun key={i} task={run.task} steps={run.steps} />
        ))}

        {streamingSteps !== null && (
          <div className="ap-run">
            <UserBubble task={currentTask} />
            <AgentCard steps={streamingSteps} done={false} />
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <AgentInput onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
