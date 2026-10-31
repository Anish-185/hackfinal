import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { codeService, errorMessage } from "../services/codeService.js";

function ScoreTile({ label, value }) {
  return (
    <div className="score-tile">
      <span className="muted small">{label}</span>
      <strong>{value == null ? "—" : value}</strong>
    </div>
  );
}

export default function Results() {
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    codeService.getAssessment(assessmentId).then(setAssessment).catch((err) => setError(errorMessage(err)));
  }, [assessmentId]);

  if (error) return <div className="centered error-text">{error}</div>;
  if (!assessment) return <div className="centered muted">Loading results…</div>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>{assessment.title}</h1>
        <p className="muted">
          {assessment.completed ? "Completed" : "In progress"}
          {assessment.completedAt && ` · ${new Date(assessment.completedAt).toLocaleString()}`}
          {assessment.mode === "assessment" && ` · AI hints used: ${assessment.aiHintsUsed}`}
        </p>
      </header>

      <section className="score-tiles">
        <ScoreTile label="Total score" value={assessment.totalScore} />
        <ScoreTile label="Coding" value={assessment.codingScore} />
        <ScoreTile label="Debugging" value={assessment.debuggingScore} />
      </section>

      <section className="card">
        <h2>Challenges</h2>
        <table className="results-table">
          <thead>
            <tr>
              <th>Challenge</th>
              <th>Type</th>
              <th>Attempts</th>
              <th>Best score</th>
            </tr>
          </thead>
          <tbody>
            {assessment.challenges.map((c) => (
              <tr key={c.challengeId._id}>
                <td>{c.challengeId.title}</td>
                <td>{c.category}</td>
                <td>{c.attempts}</td>
                <td>
                  <strong>{c.bestScore}</strong> / 100
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="actions">
        {!assessment.completed && (
          <Link className="btn btn-secondary" to={`/assessment/${assessmentId}`}>
            Back to the editor
          </Link>
        )}
        <Link className="btn btn-primary" to="/">
          All challenges
        </Link>
      </div>
    </div>
  );
}
