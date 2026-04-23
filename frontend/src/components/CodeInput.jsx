import "./CodeInput.css";

function ClipboardIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  );
}

export default function CodeInput({ value, onChange }) {
  return (
    <div className="code-input">
      <label className="code-input__label" htmlFor="code-paste">
        <span className="code-input__label-icon"><ClipboardIcon /></span>
        Paste your code
        <span className="code-input__label-hint">Shift+Enter for new line in message</span>
      </label>
      <textarea
        id="code-paste"
        className="code-input__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"// Paste the code you want reviewed here.\n// Leave blank to describe the issue in words only."}
        rows={8}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}
