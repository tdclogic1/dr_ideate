import { useEffect, useState } from "react";
import { IDEA_FORMAT } from "../../convex/lib/enums";
import { friendlyError, useProfile, useSaveProfile } from "../data/ideate";

type Draft = {
  channelName: string;
  niche: string;
  audience: string;
  tone: string;
  formats: string[];
  avoidTopics: string;
  goals: string;
  notes: string;
};
const EMPTY: Draft = { channelName: "", niche: "", audience: "", tone: "", formats: [], avoidTopics: "", goals: "", notes: "" };
const FORMATS = IDEA_FORMAT.filter((f) => f !== "other");

export function PreferencesPanel() {
  const profile = useProfile();
  const save = useSaveProfile();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile && !dirty) {
      setDraft({
        channelName: profile.channelName ?? "",
        niche: profile.niche,
        audience: profile.audience ?? "",
        tone: profile.tone ?? "",
        formats: profile.formats,
        avoidTopics: profile.avoidTopics.join(", "),
        goals: profile.goals ?? "",
        notes: profile.notes ?? "",
      });
    }
  }, [profile, dirty]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDirty(true);
    setDraft((d) => ({ ...d, [k]: v }));
  };
  const opt = (s: string) => (s.trim() ? s.trim() : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      await save({
        channelName: opt(draft.channelName),
        niche: draft.niche.trim(),
        audience: opt(draft.audience),
        tone: opt(draft.tone),
        formats: draft.formats,
        avoidTopics: draft.avoidTopics.split(",").map((s) => s.trim()).filter(Boolean),
        goals: opt(draft.goals),
        notes: opt(draft.notes),
      });
      setDirty(false);
      setStatus({ kind: "ok", text: "Saved. The next research run uses these." });
    } catch (err) {
      setStatus({ kind: "error", text: friendlyError(err) });
    }
  }

  return (
    <section aria-labelledby="prefs-h">
      <h2 id="prefs-h">Preferences</h2>
      <p className="ideate-muted">This is what the researcher knows about you. Niche is required; everything else sharpens the ideas.</p>
      <form className="ideate-form" onSubmit={submit}>
        <label>
          <span>Channel name</span>
          <input value={draft.channelName} onChange={(e) => set("channelName", e.target.value)} placeholder="Optional" />
        </label>
        <label>
          <span>Niche / topics *</span>
          <textarea
            required
            rows={3}
            value={draft.niche}
            onChange={(e) => set("niche", e.target.value)}
            placeholder="e.g. Practical AI tools for small-business owners; no-code automation; weekly tool teardowns"
          />
        </label>
        <label>
          <span>Audience</span>
          <input value={draft.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Who watches, and what they want from you" />
        </label>
        <label>
          <span>Tone</span>
          <input value={draft.tone} onChange={(e) => set("tone", e.target.value)} placeholder="e.g. direct, practical, lightly funny, no hype" />
        </label>
        <fieldset>
          <legend>Preferred formats</legend>
          <div className="ideate-checks">
            {FORMATS.map((f) => (
              <label key={f} className="ideate-check">
                <input
                  type="checkbox"
                  checked={draft.formats.includes(f)}
                  onChange={(e) => set("formats", e.target.checked ? [...draft.formats, f] : draft.formats.filter((x) => x !== f))}
                />
                <span>{f}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          <span>Topics to avoid</span>
          <input value={draft.avoidTopics} onChange={(e) => set("avoidTopics", e.target.value)} placeholder="Comma-separated, e.g. crypto, politics, drama" />
        </label>
        <label>
          <span>Goals</span>
          <input value={draft.goals} onChange={(e) => set("goals", e.target.value)} placeholder="e.g. grow to 10k subs; convert viewers to newsletter" />
        </label>
        <label>
          <span>Anything else</span>
          <textarea rows={2} value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Gear, schedule, series you run, things you have already covered…" />
        </label>
        <div className="ideate-actions">
          <button type="submit" className="ideate-primary" disabled={!dirty && profile !== null}>
            {profile ? "Save changes" : "Save preferences"}
          </button>
          {status && (
            <span role={status.kind === "error" ? "alert" : "status"} className={status.kind === "error" ? "ideate-error" : "ideate-ok"}>
              {status.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
