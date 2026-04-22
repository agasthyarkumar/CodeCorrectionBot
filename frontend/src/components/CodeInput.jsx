import "./CodeInput.css";

export default function CodeInput({ value, onChange }) {
  return (
    <div className="code-input">
      <label className="code-input__label" htmlFor="code-paste">
        <span className="code-input__label-icon">📋</span>
        Paste your code
        <span className="code-input__label-hint">Shift+Enter for new line</span>
      </label>
      <textarea
        id="code-paste"
        className="code-input__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"// Paste the code you want reviewed or fixed here...\n// Leave blank if you want to describe the problem in words only."}
        rows={10}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}
