import { useEffect, useState } from "react";
import { friendlyError, useSetFavoriteNote, useToggleFavorite, type IdeaView } from "../data/ideate";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function IdeaCard({ idea, showNote = false }: { idea: IdeaView; showNote?: boolean }) {
  const toggle = useToggleFavorite();
  const saveNote = useSetFavoriteNote();
  const [note, setNote] = useState(idea.favorite?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setNote(idea.favorite?.note ?? ""), [idea.favorite?.note]);

  const starred = Boolean(idea.favorite);
  return (
    <article className={"ideate-card" + (starred ? " is-starred" : "")}>
      <header className="ideate-card-head">
        <div className="ideate-card-meta">
          <span className="ideate-chip">{idea.format}</span>
          <span className="ideate-conf" title="How likely this performs for you this month">{idea.confidence}%</span>
        </div>
        <button
          type="button"
          className={"ideate-star" + (starred ? " is-on" : "")}
          aria-pressed={starred}
          aria-label={starred ? "Remove from favorites" : "Add to favorites"}
          onClick={() => toggle({ ideaId: idea._id }).catch((e) => setError(friendlyError(e)))}
        >
          {starred ? "★" : "☆"}
        </button>
      </header>
      <h3>{idea.title}</h3>
      <p className="ideate-hook">{idea.hook}</p>
      {idea.whyNow && (
        <p className="ideate-whynow">
          <b>Why now:</b> {idea.whyNow}
        </p>
      )}
      <details className="ideate-details">
        <summary>Full package</summary>
        {idea.angle && (
          <p>
            <b>Angle:</b> {idea.angle}
          </p>
        )}
        {idea.altTitles.length > 0 && (
          <>
            <b>Alternate titles</b>
            <ul>
              {idea.altTitles.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </>
        )}
        {idea.outline.length > 0 && (
          <>
            <b>Outline</b>
            <ol>
              {idea.outline.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </>
        )}
        {idea.thumbnailConcept && (
          <p>
            <b>Thumbnail:</b> {idea.thumbnailConcept}
          </p>
        )}
        {idea.tags.length > 0 && (
          <p className="ideate-tags">
            {idea.tags.map((t) => (
              <span className="ideate-tag" key={t}>
                #{t.replace(/^#/, "")}
              </span>
            ))}
          </p>
        )}
      </details>
      {idea.evidence.length > 0 && (
        <footer className="ideate-evidence">
          <b>Evidence</b>
          <ul>
            {idea.evidence.map((e) => (
              <li key={e._id}>
                <a href={e.url} target="_blank" rel="noopener noreferrer">
                  {e.title || hostname(e.url)}
                </a>
                {e.snippet && <span className="ideate-snippet"> — {e.snippet}</span>}
              </li>
            ))}
          </ul>
        </footer>
      )}
      {showNote && starred && (
        <label className="ideate-note">
          <span>Your note</span>
          <textarea
            rows={2}
            value={note}
            placeholder="Why you saved it, what to change, when to film…"
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note !== (idea.favorite?.note ?? "")) saveNote({ ideaId: idea._id, note }).catch((e) => setError(friendlyError(e)));
            }}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="ideate-error">
          {error}
        </p>
      )}
    </article>
  );
}
