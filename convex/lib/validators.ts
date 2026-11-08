import { v } from "convex/values";

export const runStatus = v.union(v.literal("queued"), v.literal("running"), v.literal("done"), v.literal("failed"));
export const sourceKind = v.union(v.literal("mine"), v.literal("followed"));
export const ideaFormat = v.union(
  v.literal("long-form"), v.literal("short"), v.literal("tutorial"), v.literal("review"), v.literal("listicle"),
  v.literal("vlog"), v.literal("live"), v.literal("essay"), v.literal("other"),
);

export const evidenceInput = v.object({ url: v.string(), title: v.optional(v.string()), snippet: v.optional(v.string()) });

export const ideaInput = v.object({
  title: v.string(),
  altTitles: v.array(v.string()),
  hook: v.string(),
  angle: v.string(),
  format: ideaFormat,
  outline: v.array(v.string()),
  thumbnailConcept: v.optional(v.string()),
  tags: v.array(v.string()),
  whyNow: v.string(),
  confidence: v.number(),
  evidence: v.array(evidenceInput),
});
