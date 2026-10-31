import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { codeService, errorMessage } from "../services/codeService.js";

export default function Home() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [duration, setDuration] = useState(60);
  const [aiPolicy, setAiPolicy] = useState("limited");
  const [maxAiHints, setMaxAiHints] = useState(3);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    codeService.listChallenges().then(setChallenges).catch((err) => setError(errorMessage(err)));
    codeService.listAssessments().then(setHistory).catch(() => {});
  }, []);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function start(payload) {
    setStarting(true);
    setError("");
    try {
      const { id } = await codeService.createAssessment(payload);
      navigate(`/assessment/${id}`);
    } catch (err) {
      setError(errorMessage(err));
      setStarting(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>⌘ CodeAssess</h1>
        <p className="muted">Practice a challenge, or pick several and start a timed assessment.</p>
      </header>

      {error && <p className="error-text">{error}</p>}

      <section className="card">
        <h2>Challenges</h2>
        {challenges.length === 0 && !error && (
          <p className="muted">No challenges yet. Run <code>npm run seed</code> in the backend.</p>
        )}
        <ul className="challenge-list">
          {challenges.map((c) => (
            <li key={c._id}>
              <label className="checkbox">
                <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggle(c._id)} />
                <span>
                  <strong>{c.title}</strong>{" "}
                  <span className={`badge badge-${c.difficulty.toLowerCase()}`}>{c.difficulty}</span>{" "}
                  {c.category === "debugging" && <span className="badge badge-debug">Debugging</span>}{" "}
                  {c.source === "ai" && <span className="badge">AI-generated</span>}
                  <br />
                  <span className="muted small">{c.supportedLanguages.join(" · ")}</span>
                </span>
              </label>
              <button
                className="btn btn-secondary"
                disabled={starting}
                onClick={() => start({ challengeIds: [c._id], mode: "practice", title: `Practice: ${c.title}` })}
              >
                Practice
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Timed assessment</h2>
        <div className="form-row">
          <label>
            Duration (minutes)
            <input type="number" min={5} max={240} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </label>
          <label>
            AI assistance
            <select value={aiPolicy} onChange={(e) => setAiPolicy(e.target.value)}>
              <option value="limited">Limited hints</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          {aiPolicy === "limited" && (
            <label>
              Hint quota
              <input type="number" min={0} max={20} value={maxAiHints} onChange={(e) => setMaxAiHints(e.target.value)} />
            </label>
          )}
        </div>
        <button
          className="btn btn-primary"
          disabled={selected.size === 0 || starting}
          onClick={() =>
            start({
              challengeIds: [...selected],
              mode: "assessment",
              durationMinutes: Number(duration),
              aiPolicy,
              maxAiHints: Number(maxAiHints),
            })
          }
        >
          Start assessment with {selected.size} challenge{selected.size === 1 ? "" : "s"}
        </button>
      </section>

      {history.length > 0 && (
        <section className="card">
          <h2>Your sessions</h2>
          <ul className="history">
            {history.map((a) => (
              <li key={a._id}>
                <Link to={a.completed ? `/results/${a._id}` : `/assessment/${a._id}`}>{a.title}</Link>
                <span className="muted small">
                  {new Date(a.startedAt).toLocaleString()} ·{" "}
                  {a.completed ? `score ${a.totalScore ?? 0}` : "in progress"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
