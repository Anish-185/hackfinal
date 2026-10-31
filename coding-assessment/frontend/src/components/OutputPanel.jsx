import TestCases from "./TestCases.jsx";

function GroupSummary({ groups }) {
  const order = ["public", "hidden", "performance"];
  const label = { public: "Sample tests", hidden: "Hidden tests", performance: "Performance tests" };
  return (
    <div className="group-summary">
      {order
        .filter((g) => groups?.[g]?.total)
        .map((g) => (
          <div key={g} className="group-chip">
            <span className="muted small">{label[g]}</span>
            <strong>
              {groups[g].passed}/{groups[g].total}
            </strong>
          </div>
        ))}
    </div>
  );
}

function CustomResult({ result }) {
  return (
    <div className="output-section">
      <div className="status-line">
        <span className={result.statusId === 3 ? "ok" : "bad"}>{result.status}</span>
        {result.time != null && <span className="muted small">{(result.time * 1000).toFixed(0)} ms</span>}
        {result.memory != null && <span className="muted small">{(result.memory / 1024).toFixed(1)} MB</span>}
      </div>
      {result.compileOutput && (
        <>
          <div className="sample-label">Compiler output</div>
          <pre className="error-text">{result.compileOutput}</pre>
        </>
      )}
      <div className="sample-label">stdout</div>
      <pre>{result.stdout || "(no output)"}</pre>
      {(result.stderr || result.message) && (
        <>
          <div className="sample-label">stderr</div>
          <pre className="error-text">{result.stderr || result.message}</pre>
        </>
      )}
    </div>
  );
}

export default function OutputPanel({
  tab,
  onTabChange,
  customInput,
  onCustomInputChange,
  useCustomInput,
  onUseCustomInputChange,
  runResult,
  submission,
  busy,
  error,
}) {
  return (
    <div className="output-panel">
      <div className="tabs" role="tablist">
        {[
          ["result", "Result"],
          ["input", "Custom input"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "tab active" : "tab"}
            onClick={() => onTabChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="panel-body">
        {tab === "input" ? (
          <div className="custom-input">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={useCustomInput}
                onChange={(e) => onUseCustomInputChange(e.target.checked)}
              />
              Run with this input instead of the sample tests
            </label>
            <textarea
              value={customInput}
              onChange={(e) => onCustomInputChange(e.target.value)}
              placeholder="Type stdin for your program…"
              spellCheck={false}
            />
          </div>
        ) : busy ? (
          <div className="muted">{busy}</div>
        ) : error ? (
          <pre className="error-text">{error}</pre>
        ) : submission ? (
          <div className="output-section">
            <div className="score-line">
              <span className="score">{submission.score}</span>
              <span className="muted">/ 100</span>
              <span className="muted small">
                {submission.passedTests}/{submission.totalTests} tests passed
              </span>
            </div>
            <GroupSummary groups={submission.groups} />
            {submission.compileError && <pre className="error-text">{submission.compileError}</pre>}
            <TestCases key={submission._id} results={submission.results} />
          </div>
        ) : runResult?.mode === "custom" ? (
          <CustomResult result={runResult} />
        ) : runResult?.mode === "tests" ? (
          <div className="output-section">
            <div className="status-line">
              <strong>
                {runResult.passedTests}/{runResult.totalTests} sample tests passed
              </strong>
              <span className="muted small">Run doesn't affect your score. Submit to be graded.</span>
            </div>
            {runResult.compileError && <pre className="error-text">{runResult.compileError}</pre>}
            <TestCases key={runResult.runId} results={runResult.results} />
          </div>
        ) : (
          <div className="muted">Run your code to see output here.</div>
        )}
      </div>
    </div>
  );
}
