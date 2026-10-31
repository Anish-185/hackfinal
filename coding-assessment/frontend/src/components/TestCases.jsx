import { useState } from "react";

const GROUP_LABEL = { public: "Sample", hidden: "Hidden", performance: "Performance" };

function formatStats(result) {
  const parts = [];
  if (result.time != null) parts.push(`${(result.time * 1000).toFixed(0)} ms`);
  if (result.memory != null) parts.push(`${(result.memory / 1024).toFixed(1)} MB`);
  return parts.join(" · ");
}

export default function TestCases({ results }) {
  const [open, setOpen] = useState(() => results.findIndex((r) => !r.passed));

  return (
    <ul className="test-list">
      {results.map((result, i) => {
        const visible = result.group === "public";
        const isOpen = open === i && visible;
        return (
          <li key={i} className={`test ${result.passed ? "pass" : "fail"}`}>
            <button
              type="button"
              className="test-row"
              onClick={() => setOpen(isOpen ? -1 : i)}
              disabled={!visible}
              aria-expanded={isOpen}
            >
              <span className="test-icon" aria-hidden>
                {result.passed ? "✓" : "✗"}
              </span>
              <span>
                {GROUP_LABEL[result.group] ?? result.group} test {i + 1}
              </span>
              <span className="test-verdict">{result.verdict}</span>
              <span className="muted small">{formatStats(result)}</span>
              {!visible && <span className="muted small">🔒</span>}
            </button>

            {isOpen && (
              <div className="test-detail">
                <div className="sample-label">Input</div>
                <pre>{result.input || "(empty)"}</pre>
                <div className="sample-label">Expected</div>
                <pre>{result.expectedOutput}</pre>
                <div className="sample-label">Your output</div>
                <pre>{result.actualOutput || "(no output)"}</pre>
                {result.stderr && (
                  <>
                    <div className="sample-label">Error output</div>
                    <pre className="error-text">{result.stderr}</pre>
                  </>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
