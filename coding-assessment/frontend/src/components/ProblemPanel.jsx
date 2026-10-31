import Markdown from "react-markdown";

export default function ProblemPanel({ challenge }) {
  if (!challenge) return <div className="panel-body muted">Loading challenge…</div>;

  return (
    <div className="panel-body problem">
      <div className="problem-header">
        <h2>{challenge.title}</h2>
        <div className="badges">
          <span className={`badge badge-${challenge.difficulty.toLowerCase()}`}>{challenge.difficulty}</span>
          {challenge.category === "debugging" && <span className="badge badge-debug">Debugging</span>}
          <span className="badge">
            {challenge.timeLimit}s · {challenge.memoryLimit} MB
          </span>
        </div>
      </div>

      <div className="markdown">
        <Markdown>{challenge.description}</Markdown>
      </div>

      {challenge.publicTests?.length > 0 && (
        <>
          <h3>Sample tests</h3>
          {challenge.publicTests.map((test, i) => (
            <div key={i} className="sample">
              <div className="sample-label">Input</div>
              <pre>{test.input}</pre>
              <div className="sample-label">Expected output</div>
              <pre>{test.expectedOutput}</pre>
              {test.explanation && <p className="muted small">{test.explanation}</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
