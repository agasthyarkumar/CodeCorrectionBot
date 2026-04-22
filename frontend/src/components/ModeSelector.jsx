import "./ModeSelector.css";

const MODES = [
  { value: "explain",  label: "Explain",     icon: "💡" },
  { value: "generate", label: "Generate",    icon: "🎯" },
  { value: "fix",      label: "Fix Code",    icon: "🔧" },
  { value: "hint",     label: "Hint",        icon: "🧭" },
];

export default function ModeSelector({ mode, onChange }) {
  return (
    <div className="mode-selector" role="group" aria-label="Chat mode">
      {MODES.map((m) => (
        <button
          key={m.value}
          className={`mode-selector__btn${mode === m.value ? " mode-selector__btn--active" : ""}`}
          onClick={() => onChange(m.value)}
          aria-pressed={mode === m.value}
          type="button"
        >
          <span className="mode-selector__icon">{m.icon}</span>
          <span className="mode-selector__label">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
