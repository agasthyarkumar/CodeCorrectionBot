import "./InputBox.css";

const PLACEHOLDERS = {
  explain:  'Ask about any DSA concept — e.g. "How does a segment tree work?"',
  generate: 'Describe a problem to generate — e.g. "Medium graph problem with BFS"',
  fix:      "Describe the bug or what's wrong with your code above…",
  hint:     'Describe where you\'re stuck — e.g. "I can\'t figure out the recurrence"',
};

export default function InputBox({ value, onChange, onSubmit, loading, mode }) {
  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form className="input-box" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <textarea
        className="input-box__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDERS[mode] ?? "Ask anything about DSA…"}
        disabled={loading}
        rows={2}
        aria-label="Message input"
      />
      <button
        className="input-box__submit"
        type="submit"
        disabled={loading || !value.trim()}
        aria-label="Send message"
      >
        {loading ? (
          <span className="input-box__spinner" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
      </button>
    </form>
  );
}
