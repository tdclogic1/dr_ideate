import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { installErrorReporter } from "./lib/errorReporter";

installErrorReporter();

// Without VITE_CONVEX_URL (written to .env.local by `npx convex dev`) the app
// shows a clear "not configured" page instead of a broken UI.
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {convex ? (
      // ConvexProvider mounts inside the boundary so a failing query renders a
      // sentence instead of a blank page.
      <ErrorBoundary>
        <ConvexProvider client={convex}>
          <App />
        </ConvexProvider>
      </ErrorBoundary>
    ) : (
      <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1>dr_ideate — not configured</h1>
        <p>
          No Convex deployment yet. Run <code>npx convex dev</code> once in this
          repo; it creates the deployment and writes <code>.env.local</code>.
        </p>
      </main>
    )}
  </StrictMode>,
);
