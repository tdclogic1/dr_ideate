// The ONE UI data-access layer: components import hooks from here, never api.* directly.
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { IdeaView } from "../../convex/ideas";

export type { IdeaView };
export type Profile = Doc<"profiles">;
export type Source = Doc<"sources">;
export type Run = Doc<"researchRuns">;
export type RunId = Id<"researchRuns">;

export const useProfile = () => useQuery(api.profiles.get);
export const useSaveProfile = () => useMutation(api.profiles.save);
export const useSources = () => useQuery(api.sources.list);
export const useAddSource = () => useMutation(api.sources.add);
export const useRemoveSource = () => useMutation(api.sources.remove);
export const useRuns = () => useQuery(api.runs.list);
export const useStartRun = () => useMutation(api.runs.start);
export const useIdeas = (runId?: RunId) => useQuery(api.ideas.list, { runId });
export const useFavorites = () => useQuery(api.ideas.favorites);
export const useToggleFavorite = () => useMutation(api.ideas.toggleFavorite);
export const useSetFavoriteNote = () => useMutation(api.ideas.setFavoriteNote);

/** Convex wraps thrown errors as "[CONVEX M(runs:start)] … Uncaught Error: <message>"; show only the message. */
export function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const m = /Uncaught (?:Error|ConvexError): ([^\n]+)/.exec(raw);
  return (m ? m[1] : raw).replace(/\s+at .*$/s, "").trim();
}
