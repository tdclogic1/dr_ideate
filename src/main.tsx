import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { installErrorReporter } from "./lib/errorReporter";

installErrorReporter();

// Honest degradation: without VITE_CONVEX_URL (set by `npx convex dev` once,
// from the canonical checkout) the app shows a clear gate, never a broken UI.
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {convex ? (
      // A failing query anywhere below must render a sentence, never a blank page.
      // ConvexProvider mounts INSIDE the boundary so a client-side failure is caught
      // (property 2026-09-19: the first useQuery threw "Could not find Convex client").
      <ErrorBoundary>
        <ConvexProvider client={convex}>
          <App />
        </ConvexProvider>
      </ErrorBoundary>
    ) : (
      <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1>dr_ideate — not configured</h1>
        <p>
          No Convex deployment yet. A HUMAN runs <code>npx convex dev</code>{" "}
          once from this repo's canonical checkout (LIFECYCLE.md, HUMAN item 3).
        </p>
      </main>
    )}
  </StrictMode>,
);
