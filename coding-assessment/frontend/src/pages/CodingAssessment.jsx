import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CodeEditor from "../components/CodeEditor.jsx";
import ProblemPanel from "../components/ProblemPanel.jsx";
import OutputPanel from "../components/OutputPanel.jsx";
import DebugAssistant from "../components/DebugAssistant.jsx";
import Timer from "../components/Timer.jsx";
import { codeService, errorMessage } from "../services/codeService.js";

const LANGUAGE_LABEL = { python: "Python 3", javascript: "JavaScript", java: "Java", cpp: "C++" };

const draftKey = (assessmentId, challengeId, language) => `draft:${assessmentId}:${challengeId}:${language}`;

function readDraft(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeDraft(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Drafts are a convenience; ignore storage failures.
  }
}

/** Describes the most recent failure so the AI debugger has something concrete to explain. */
function describeFailure(output) {
  const { runResult, submission } = output ?? {};
  const source = submission ?? runResult;
  if (!source) return null;

  if (source.compileError) return `Compilation error:\n${source.compileError}`;

  if (runResult && !submission && runResult.mode === "custom") {
    if (runResult.statusId === 3) return null;
    return [
      `Status: ${runResult.status}`,
      runResult.compileOutput && `Compiler output:\n${runResult.compileOutput}`,
      (runResult.stderr || runResult.message) && `stderr:\n${runResult.stderr || runResult.message}`,
      `stdin:\n${runResult.stdin || "(empty)"}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const results = source.results ?? [];
  const failedVisible = results.find((r) => !r.passed && r.group === "public");
  if (failedVisible) {
    return [
      `Verdict on a sample test: ${failedVisible.verdict}`,
      `Input:\n${failedVisible.input}`,
      `Expected output:\n${failedVisible.expectedOutput}`,
      `Actual output:\n${failedVisible.actualOutput || "(no output)"}`,
      failedVisible.stderr && `stderr:\n${failedVisible.stderr}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const failedHidden = results.filter((r) => !r.passed);
  if (failedHidden.length) {
    const verdicts = [...new Set(failedHidden.map((r) => r.verdict))].join(", ");
    const groups = [...new Set(failedHidden.map((r) => r.group))].join(" and ");
    return `All sample tests pass, but ${failedHidden.length} ${groups} test(s) fail with: ${verdicts}. The inputs of those tests are not visible to the candidate.`;
  }
  return null;
}

export default function CodingAssessment() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [clockOffset, setClockOffset] = useState(0);
  const [loadError, setLoadError] = useState("");

  const [activeId, setActiveId] = useState(null);
  const [challenges, setChallenges] = useState({});
  const [languageByChallenge, setLanguageByChallenge] = useState({});
  const [codes, setCodes] = useState({});

  const [outputs, setOutputs] = useState({}); // challengeId -> { runResult, submission, error }
  const [busy, setBusy] = useState("");
  const [tab, setTab] = useState("result");
  const [customInput, setCustomInput] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);

  const [hints, setHints] = useState({}); // challengeId -> hint[]
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState("");
  const [hintsRemaining, setHintsRemaining] = useState(null);

  const refreshAssessment = useCallback(async () => {
    const data = await codeService.getAssessment(assessmentId);
    setClockOffset(new Date(data.serverTime).getTime() - Date.now());
    setAssessment(data);
    return data;
  }, [assessmentId]);

  useEffect(() => {
    refreshAssessment()
      .then((data) => {
        if (data.completed) return navigate(`/results/${assessmentId}`, { replace: true });
        setActiveId(data.challenges[0]?.challengeId?._id ?? null);
        if (data.aiPolicy === "limited") setHintsRemaining(Math.max(data.maxAiHints - data.aiHintsUsed, 0));
      })
      .catch((err) => setLoadError(errorMessage(err)));
  }, [assessmentId, navigate, refreshAssessment]);

  // Load each challenge the first time it is opened.
  useEffect(() => {
    if (!activeId || challenges[activeId]) return;
    codeService
      .getChallenge(activeId)
      .then((challenge) => {
        setChallenges((prev) => ({ ...prev, [activeId]: challenge }));
        setLanguageByChallenge((prev) => ({ ...prev, [activeId]: prev[activeId] ?? challenge.supportedLanguages[0] }));
      })
      .catch((err) => setLoadError(errorMessage(err)));
  }, [activeId, challenges]);

  const challenge = challenges[activeId];
  const language = languageByChallenge[activeId];
  const codeKey = `${activeId}:${language}`;

  // Starter code comes from the challenge, per language; a saved draft wins over it.
  useEffect(() => {
    if (!challenge || !language || codes[codeKey] !== undefined) return;
    const draft = readDraft(draftKey(assessmentId, activeId, language));
    setCodes((prev) => ({ ...prev, [codeKey]: draft ?? challenge.starterCode?.[language] ?? "" }));
  }, [challenge, language, codeKey, codes, assessmentId, activeId]);

  const code = codes[codeKey] ?? "";
  const output = outputs[activeId] ?? {};
  const failure = useMemo(() => describeFailure(output), [output]);
  const isTimed = Boolean(assessment?.endsAt);
  const locked = Boolean(busy) || !challenge || !language;

  function updateCode(next) {
    setCodes((prev) => ({ ...prev, [codeKey]: next }));
    writeDraft(draftKey(assessmentId, activeId, language), next);
  }

  function setOutput(patch) {
    setOutputs((prev) => ({ ...prev, [activeId]: { ...patch } }));
  }

  function resetCode() {
    if (!window.confirm("Replace your code with the original starter code?")) return;
    updateCode(challenge.starterCode?.[language] ?? "");
  }

  async function run() {
    setTab("result");
    setBusy(useCustomInput ? "Running with custom input…" : "Running sample tests…");
    try {
      const result = await codeService.runCode({
        challengeId: activeId,
        language,
        sourceCode: code,
        stdin: customInput,
        useCustomInput,
      });
      setOutput({ runResult: { ...result, runId: Date.now() } });
    } catch (err) {
      setOutput({ error: errorMessage(err) });
    } finally {
      setBusy("");
    }
  }

  async function submit() {
    setTab("result");
    setBusy("Evaluating against all tests…");
    try {
      const submission = await codeService.submitCode({
        challengeId: activeId,
        language,
        sourceCode: code,
        assessmentId,
      });
      setOutput({ submission });
      await refreshAssessment();
    } catch (err) {
      setOutput({ error: errorMessage(err) });
    } finally {
      setBusy("");
    }
  }

  const finish = useCallback(
    async (confirmFirst = true) => {
      if (confirmFirst && !window.confirm("Finish the assessment? You won't be able to submit again.")) return;
      try {
        await codeService.finishAssessment(assessmentId);
      } finally {
        navigate(`/results/${assessmentId}`);
      }
    },
    [assessmentId, navigate],
  );

  async function askForHint() {
    setHintLoading(true);
    setHintError("");
    try {
      const hint = await codeService.getDebugHint({
        language,
        sourceCode: code,
        error: failure,
        challengeId: activeId,
        assessmentId,
      });
      setHints((prev) => ({ ...prev, [activeId]: [hint, ...(prev[activeId] ?? [])] }));
      if (hint.hintsRemaining != null) setHintsRemaining(hint.hintsRemaining);
    } catch (err) {
      setHintError(errorMessage(err));
      if (assessment.aiPolicy === "limited") {
        // Re-sync the quota from the server (a 429 may mean it is used up).
        refreshAssessment()
          .then((data) => setHintsRemaining(Math.max(data.maxAiHints - data.aiHintsUsed, 0)))
          .catch(() => {});
      }
    } finally {
      setHintLoading(false);
    }
  }

  if (loadError) {
    return (
      <div className="centered">
        <p className="error-text">{loadError}</p>
        <Link to="/">Back to challenges</Link>
      </div>
    );
  }
  if (!assessment) return <div className="centered muted">Loading assessment…</div>;

  const activeHints = hints[activeId] ?? [];
  const highlightLines = activeHints[0]?.lineNumbers ?? [];

  return (
    <div className="workspace">
      <header className="topbar">
        <Link to="/" className="brand">
          ⌘ CodeAssess
        </Link>

        <nav className="challenge-tabs" aria-label="Challenges">
          {assessment.challenges.map((c, i) => {
            const id = c.challengeId._id;
            return (
              <button
                key={id}
                className={id === activeId ? "tab active" : "tab"}
                onClick={() => setActiveId(id)}
                disabled={Boolean(busy)}
              >
                {i + 1}. {c.challengeId.title}
                {c.attempts > 0 && <span className="tab-score">{c.bestScore}</span>}
              </button>
            );
          })}
        </nav>

        <div className="topbar-actions">
          <select
            value={language ?? ""}
            onChange={(e) => setLanguageByChallenge((prev) => ({ ...prev, [activeId]: e.target.value }))}
            disabled={locked}
            aria-label="Programming language"
          >
            {(challenge?.supportedLanguages ?? []).map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABEL[lang] ?? lang}
              </option>
            ))}
          </select>
          {isTimed && <Timer endsAt={assessment.endsAt} clockOffsetMs={clockOffset} onExpire={() => finish(false)} />}
          <button className="btn btn-ghost" onClick={resetCode} disabled={locked}>
            Reset
          </button>
          <button className="btn btn-secondary" onClick={run} disabled={locked}>
            ▶ Run
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={locked}>
            Submit
          </button>
          <button className="btn btn-ghost" onClick={() => finish(true)} disabled={Boolean(busy)}>
            Finish
          </button>
        </div>
      </header>

      <aside className="pane pane-left">
        <ProblemPanel challenge={challenge} />
      </aside>

      <main className="pane pane-center">
        <div className="editor-wrap">
          {challenge && language && (
            <CodeEditor
              path={`${activeId}/${language}`}
              language={language}
              value={code}
              onChange={updateCode}
              highlightLines={highlightLines}
            />
          )}
        </div>
        <OutputPanel
          tab={tab}
          onTabChange={setTab}
          customInput={customInput}
          onCustomInputChange={setCustomInput}
          useCustomInput={useCustomInput}
          onUseCustomInputChange={setUseCustomInput}
          runResult={output.runResult}
          submission={output.submission}
          busy={busy}
          error={output.error}
        />
      </main>

      <aside className="pane pane-right">
        <h3 className="pane-title">AI Debugger</h3>
        <DebugAssistant
          policy={assessment.aiPolicy}
          hintsRemaining={hintsRemaining}
          failure={failure}
          hints={activeHints}
          loading={hintLoading}
          error={hintError}
          onAsk={askForHint}
        />
      </aside>
    </div>
  );
}
