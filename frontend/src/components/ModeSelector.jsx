import "./ModeSelector.css";

function BookOpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  );
}
function WrenchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  );
}

const MODES = [
  { value: "explain",  label: "Explain",  Icon: BookOpenIcon },
  { value: "generate", label: "Generate", Icon: LayersIcon   },
  { value: "fix",      label: "Fix Code", Icon: WrenchIcon   },
  { value: "hint",     label: "Hint",     Icon: CompassIcon  },
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
          <span className="mode-selector__icon"><m.Icon /></span>
          <span className="mode-selector__label">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
