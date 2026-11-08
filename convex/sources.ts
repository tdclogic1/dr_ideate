import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { OWNER_KEY } from "./lib/owner";
import { sourceKind } from "./lib/validators";

export const list = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("sources").withIndex("by_owner", (q) => q.eq("ownerKey", OWNER_KEY)).take(100),
});

export const add = mutation({
  args: { url: v.string(), title: v.optional(v.string()), kind: sourceKind, notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const url = args.url.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) throw new Error("Enter a full URL starting with http:// or https://");
    const now = Date.now();
    return ctx.db.insert("sources", {
      ownerKey: OWNER_KEY,
      url,
      title: args.title?.trim() || undefined,
      kind: args.kind,
      notes: args.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("sources") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (row && row.ownerKey === OWNER_KEY) await ctx.db.delete(id);
  },
});
