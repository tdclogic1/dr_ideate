// The ONE UI data-access layer: components import hooks from here, never api.* directly.
import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
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
export const useStartRun = () => useAction(api.research.start);
export const useIdeas = (runId?: RunId) => useQuery(api.ideas.list, { runId });
export const useFavorites = () => useQuery(api.ideas.favorites);
export const useToggleFavorite = () => useMutation(api.ideas.toggleFavorite);
export const useSetFavoriteNote = () => useMutation(api.ideas.setFavoriteNote);

const API_KEY_STORAGE = "ideate.apiKey";

/** Bring your own key: kept in this browser only, sent with each run, never stored in Convex. */
export function useApiKey(): [string, (next: string) => void] {
  const [key, setKeyState] = useState(() => {
    try {
      return localStorage.getItem(API_KEY_STORAGE) ?? "";
    } catch {
      return "";
    }
  });
  const setKey = useCallback((next: string) => {
    setKeyState(next);
    try {
      if (next) localStorage.setItem(API_KEY_STORAGE, next);
      else localStorage.removeItem(API_KEY_STORAGE);
    } catch {
      // Private window or blocked storage: the key still works for this page load.
    }
  }, []);
  return [key, setKey];
}

/** Convex wraps thrown errors as "[CONVEX A(research:start)] … Uncaught Error: <message>"; show only the message. */
export function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const m = /Uncaught (?:Error|ConvexError): ([^\n]+)/.exec(raw);
  return (m ? m[1] : raw).replace(/\s+at .*$/s, "").trim();
}
