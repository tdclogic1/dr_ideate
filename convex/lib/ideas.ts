// Pure parser for the model's reply — defensive, because a 200 from the
// model reply can still be prose, fenced JSON, or a partial object.
import { isIdeaFormat, type IdeaFormat } from "./enums";

export type ParsedEvidence = { url: string; title?: string; snippet?: string };
export type ParsedIdea = {
  title: string;
  altTitles: string[];
  hook: string;
  angle: string;
  format: IdeaFormat;
  outline: string[];
  thumbnailConcept?: string;
  tags: string[];
  whyNow: string;
  confidence: number;
  evidence: ParsedEvidence[];
};
export type ParseResult = { ideas: ParsedIdea[]; problems: string[] };

/** Strip markdown fences and return the outermost {...} or [...] span, or null. */
export function extractJson(text: string): string | null {
  const unfenced = text.replace(/```(?:json)?\s*([\s\S]*?)```/gi, "$1");
  const obj = unfenced.indexOf("{");
  const arr = unfenced.indexOf("[");
  const startsWithArray = arr !== -1 && (obj === -1 || arr < obj);
  const start = startsWithArray ? arr : obj;
  const end = unfenced.lastIndexOf(startsWithArray ? "]" : "}");
  if (start === -1 || end === -1 || end <= start) return null;
  return unfenced.slice(start, end + 1);
}

const str = (x: unknown): string => (typeof x === "string" ? x.trim() : "");
const strList = (x: unknown): string[] => (Array.isArray(x) ? x.map(str).filter(Boolean) : []);
const isHttp = (u: string) => /^https?:\/\//i.test(u);

export function normalizeFormat(x: unknown): IdeaFormat {
  const f = str(x).toLowerCase().replace(/\s+/g, "-").replace(/^longform$/, "long-form").replace(/^shorts?$/, "short");
  return isIdeaFormat(f) ? f : "other";
}

export function clampConfidence(x: unknown): number {
  const n = typeof x === "number" ? x : Number(x);
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function parseIdeas(text: string): ParseResult {
  const problems: string[] = [];
  const json = extractJson(text);
  if (!json) return { ideas: [], problems: ["reply contained no JSON object"] };
  let root: unknown;
  try {
    root = JSON.parse(json);
  } catch (e) {
    return { ideas: [], problems: [`reply JSON did not parse: ${e instanceof Error ? e.message : String(e)}`] };
  }
  const raw = Array.isArray(root) ? root : Array.isArray((root as { ideas?: unknown })?.ideas) ? (root as { ideas: unknown[] }).ideas : null;
  if (!raw) return { ideas: [], problems: ["reply had no `ideas` array"] };

  const ideas: ParsedIdea[] = [];
  raw.forEach((item, i) => {
    const o = (item ?? {}) as Record<string, unknown>;
    const title = str(o.title);
    const hook = str(o.hook);
    if (!title || !hook) {
      problems.push(`idea ${i + 1} dropped: missing ${!title ? "title" : "hook"}`);
      return;
    }
    const evidence: ParsedEvidence[] = (Array.isArray(o.evidence) ? o.evidence : [])
      .map((e) => {
        const ev = (e ?? {}) as Record<string, unknown>;
        const url = str(ev.url);
        return { url, title: str(ev.title) || undefined, snippet: str(ev.snippet) || undefined };
      })
      .filter((e) => isHttp(e.url));
    if (evidence.length === 0) problems.push(`idea ${i + 1} ("${title}") has no usable evidence URL`);
    ideas.push({
      title,
      altTitles: strList(o.altTitles),
      hook,
      angle: str(o.angle),
      format: normalizeFormat(o.format),
      outline: strList(o.outline),
      thumbnailConcept: str(o.thumbnailConcept) || undefined,
      tags: strList(o.tags),
      whyNow: str(o.whyNow),
      confidence: clampConfidence(o.confidence),
      evidence,
    });
  });
  return { ideas, problems };
}
