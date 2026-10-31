const POLICY_TEXT = {
  full: "Practice mode: the assistant can explain errors in detail.",
  limited: "Assessment mode: short conceptual hints only.",
  disabled: "AI hints are disabled for this assessment.",
};

export default function DebugAssistant({ policy, hintsRemaining, failure, hints, loading, error, onAsk }) {
  const disabled = policy === "disabled" || hintsRemaining === 0;

  return (
    <div className="panel-body debug">
      <p className="muted small">{POLICY_TEXT[policy]}</p>
      {policy === "limited" && hintsRemaining != null && (
        <p className="small">
          Hints remaining: <strong>{hintsRemaining}</strong>
        </p>
      )}

      <button
        type="button"
        className="btn btn-secondary full"
        onClick={onAsk}
        disabled={disabled || !failure || loading}
        title={failure ? "" : "Run or submit your code first. Hints are available after a failure."}
      >
        {loading ? "Thinking…" : "Explain my error"}
      </button>
      {!failure && policy !== "disabled" && (
        <p className="muted small">Hints become available after a failed run or submission.</p>
      )}
      {error && <p className="error-text small">{error}</p>}

      <div className="hint-list">
        {hints.map((hint, i) => (
          <article key={i} className={`hint severity-${hint.severity}`}>
            <header>
              <strong>{hint.errorType}</strong>
              <span className="badge">{hint.severity}</span>
            </header>
            <p>{hint.explanation}</p>
            <p className="hint-next">
              <span className="muted small">Hint</span>
              <br />
              {hint.hint}
            </p>
            {hint.lineNumbers?.length > 0 && (
              <p className="muted small">Look at line {hint.lineNumbers.join(", ")}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
