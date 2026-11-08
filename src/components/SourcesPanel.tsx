import { useState } from "react";
import type { SourceKind } from "../../convex/lib/enums";
import { friendlyError, useAddSource, useRemoveSource, useSources, type Source } from "../data/ideate";

const KIND_LABEL: Record<SourceKind, string> = { mine: "My own blog", followed: "Blog I follow" };
const KIND_HELP: Record<SourceKind, string> = {
  mine: "Read to learn your voice and what you have already covered.",
  followed: "Read as research input for fresh angles and trends.",
};

export function SourcesPanel() {
  const sources = useSources();
  const add = useAddSource();
  const remove = useRemoveSource();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<SourceKind>("followed");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await add({ url, title: title || undefined, kind, notes: notes || undefined });
      setUrl("");
      setTitle("");
      setNotes("");
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const groups: SourceKind[] = ["mine", "followed"];
  return (
    <section aria-labelledby="src-h">
      <h2 id="src-h">Blogs & sources</h2>
      <p className="ideate-muted">The researcher reads these pages during every run. Add your own blogs and the ones you follow.</p>
      <form className="ideate-form ideate-form-inline" onSubmit={submit}>
        <label>
          <span>URL *</span>
          <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </label>
        <label>
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" />
        </label>
        <fieldset>
          <legend>Kind</legend>
          <div className="ideate-checks">
            {groups.map((k) => (
              <label key={k} className="ideate-check">
                <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} />
                <span>{KIND_LABEL[k]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          <span>Notes</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional — e.g. only the AI category" />
        </label>
        <div className="ideate-actions">
          <button type="submit" className="ideate-primary">
            Add source
          </button>
          {error && (
            <span role="alert" className="ideate-error">
              {error}
            </span>
          )}
        </div>
      </form>

      {sources === undefined ? (
        <p className="ideate-muted">Loading…</p>
      ) : (
        groups.map((k) => {
          const rows = sources.filter((s: Source) => s.kind === k);
          return (
            <div key={k} className="ideate-source-group">
              <h3>
                {KIND_LABEL[k]}s <span className="ideate-muted">· {KIND_HELP[k]}</span>
              </h3>
              {rows.length === 0 ? (
                <p className="ideate-empty">None yet.</p>
              ) : (
                <ul className="ideate-source-list">
                  {rows.map((s) => (
                    <li key={s._id}>
                      <div>
                        <a href={s.url} target="_blank" rel="noopener noreferrer">
                          {s.title || s.url}
                        </a>
                        {s.title && <span className="ideate-muted"> · {s.url}</span>}
                        {s.notes && <div className="ideate-muted">{s.notes}</div>}
                      </div>
                      <button type="button" className="ideate-ghost" onClick={() => remove({ id: s._id }).catch((e) => setError(friendlyError(e)))}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
