// Declared enums feed the validators (convex/lib/validators.ts), the tests, and
// the future relational CHECK constraints. Add values; never reuse or rename.
export const RUN_STATUS = ["queued", "running", "done", "failed"] as const;
export type RunStatus = (typeof RUN_STATUS)[number];

export const SOURCE_KIND = ["mine", "followed"] as const;
export type SourceKind = (typeof SOURCE_KIND)[number];

export const IDEA_FORMAT = ["long-form", "short", "tutorial", "review", "listicle", "vlog", "live", "essay", "other"] as const;
export type IdeaFormat = (typeof IDEA_FORMAT)[number];

export function isIdeaFormat(x: string): x is IdeaFormat {
  return (IDEA_FORMAT as readonly string[]).includes(x);
}
