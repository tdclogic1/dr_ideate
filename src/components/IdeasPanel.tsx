import { useState } from "react";
import { friendlyError, useApiKey, useIdeas, useProfile, useRuns, useStartRun, type Run } from "../data/ideate";
import { IdeaCard } from "./IdeaCard";

function when(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function RunStatus({ run }: { run: Run }) {
  const active = run.status === "queued" || run.status === "running";
  return (
    <div className={"ideate-run ideate-run-" + run.status} aria-live="polite">
      {active && <span className="ideate-pulse" aria-hidden="true" />}
      {run.status === "queued" && <span>Queued…</span>}
      {run.status === "running" && <span>Researching the web and reading your sources — usually one to three minutes.</span>}
      {run.status === "done" && (
        <span>
          Last run {when(run.finishedAt ?? run.updatedAt)}: {run.ideaCount} idea{run.ideaCount === 1 ? "" : "s"}
          {run.model ? ` via ${run.model}` : ""}.{run.warning ? ` Notes: ${run.warning}` : ""}
        </span>
      )}
      {run.status === "failed" && (
        <span>
          Run {when(run.finishedAt ?? run.updatedAt)} failed: {run.error ?? "unknown error"}
        </span>
      )}
      {run.focus && <span className="ideate-focus">Focus: {run.focus}</span>}
    </div>
  );
}

export function IdeasPanel({ onGoToPreferences }: { onGoToPreferences: () => void }) {
  const profile = useProfile();
  const ideas = useIdeas();
  const runs = useRuns();
  const start = useStartRun();
  const [apiKey, setApiKey] = useApiKey();
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = runs?.[0];
  const inProgress = latest ? latest.status === "queued" || latest.status === "running" : false;

  function run() {
    setError(null);
    setBusy(true);
    // The action runs the whole research (minutes); progress shows through the run row,
    // so the button is released as soon as the request is accepted.
    start({ apiKey, focus: focus.trim() || undefined }).catch((e: unknown) => setError(friendlyError(e)));
    setFocus("");
    setTimeout(() => setBusy(false), 800);
  }

  return (
    <section aria-labelledby="ideas-h">
      <h2 id="ideas-h" className="visually-hidden">
        Ideas
      </h2>
      <label className="ideate-keyrow">
        <span>Your Anthropic API key</span>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-…"
          autoComplete="off"
          spellCheck={false}
        />
        <small className="ideate-muted">Stays in this browser. Sent only with each run; never saved to the database.</small>
      </label>
      <form
        className="ideate-runbar"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <input
          type="text"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="Optional focus for this run — e.g. “shorts only” or “AI tools for teachers”"
          aria-label="Focus for this research run"
        />
        <button type="submit" className="ideate-primary" disabled={busy || inProgress || !apiKey.trim() || profile === null || profile === undefined}>
          {inProgress ? "Researching…" : "Research now"}
        </button>
      </form>
      {profile === null && (
        <p className="ideate-note-line">
          Set your{" "}
          <button type="button" className="ideate-link" onClick={onGoToPreferences}>
            preferences
          </button>{" "}
          first so the research knows your niche.
        </p>
      )}
      {error && (
        <p role="alert" className="ideate-error">
          {error}
        </p>
      )}
      {latest && <RunStatus run={latest} />}
      {ideas === undefined ? (
        <p className="ideate-muted">Loading…</p>
      ) : ideas.length === 0 ? (
        <p className="ideate-empty">No ideas yet. Fill in your preferences, add a blog or two, then press “Research now”.</p>
      ) : (
        <div className="ideate-grid">
          {ideas.map((i) => (
            <IdeaCard key={i._id} idea={i} />
          ))}
        </div>
      )}
    </section>
  );
}
