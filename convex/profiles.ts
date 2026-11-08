import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { OWNER_KEY } from "./lib/owner";

export const get = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("profiles").withIndex("by_owner", (q) => q.eq("ownerKey", OWNER_KEY)).first(),
});

export const save = mutation({
  args: {
    channelName: v.optional(v.string()),
    niche: v.string(),
    audience: v.optional(v.string()),
    tone: v.optional(v.string()),
    formats: v.array(v.string()),
    avoidTopics: v.array(v.string()),
    goals: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.niche.trim()) throw new Error("Niche is required — tell the researcher what your channel is about.");
    const now = Date.now();
    const existing = await ctx.db.query("profiles").withIndex("by_owner", (q) => q.eq("ownerKey", OWNER_KEY)).first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert("profiles", { ownerKey: OWNER_KEY, ...args, createdAt: now, updatedAt: now });
  },
});
