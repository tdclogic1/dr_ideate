import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { ideaFormat, runStatus, sourceKind } from "./lib/validators";

// Relational-portable: tenant column (ownerKey) first on every table and index,
// own timestamps, children as rows (ideaEvidence, favorites), no v.any().
export default defineSchema({
  profiles: defineTable({
    ownerKey: v.string(),
    channelName: v.optional(v.string()),
    niche: v.string(),
    audience: v.optional(v.string()),
    tone: v.optional(v.string()),
    formats: v.array(v.string()),
    avoidTopics: v.array(v.string()),
    goals: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerKey"]),

  sources: defineTable({
    ownerKey: v.string(),
    url: v.string(),
    title: v.optional(v.string()),
    kind: sourceKind,
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerKey"]),

  researchRuns: defineTable({
    ownerKey: v.string(),
    status: runStatus,
    focus: v.optional(v.string()),
    ideaCount: v.number(),
    attempts: v.number(),
    agentKey: v.optional(v.string()),
    model: v.optional(v.string()),
    error: v.optional(v.string()),
    warning: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_createdAt", ["ownerKey", "createdAt"])
    .index("by_owner_status", ["ownerKey", "status"]),

  ideas: defineTable({
    ownerKey: v.string(),
    runId: v.id("researchRuns"),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_createdAt", ["ownerKey", "createdAt"])
    .index("by_run", ["runId"]),

  ideaEvidence: defineTable({
    ownerKey: v.string(),
    ideaId: v.id("ideas"),
    url: v.string(),
    title: v.optional(v.string()),
    snippet: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_idea", ["ideaId"]),

  favorites: defineTable({
    ownerKey: v.string(),
    ideaId: v.id("ideas"),
    note: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_idea", ["ownerKey", "ideaId"])
    .index("by_owner_createdAt", ["ownerKey", "createdAt"]),
});
