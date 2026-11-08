import { Component, type ErrorInfo, type ReactNode } from "react";

// Error boundary at the top of the tree. A browser bundle can be newer than its
// Convex deployment; the first query for a missing function would otherwise
// unmount everything. This names the function and says what to do.
type Props = { children: ReactNode; fallback?: (error: Error, reset: () => void) => ReactNode; onError?: (error: Error) => void };
type State = { error: Error | null };

export function explainError(e: Error): { title: string; detail: string; fix: string | null } {
  const m = /Could not find public function for '([^']+)'/.exec(e.message);
  if (m) {
    return {
      title: `The app is newer than its deployment: ${m[1]} is not on the server yet.`,
      detail: "The browser bundle was built from code that has not been pushed to this Convex deployment.",
      fix: "Run `npx convex dev` (dev) or `npx convex deploy` (prod), then reload.",
    };
  }
  if (/not signed in/.test(e.message)) return { title: "Your session ended.", detail: e.message, fix: "Sign in again." };
  return { title: "Something failed while drawing this page.", detail: e.message, fix: null };
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error);
    console.error("[ideate:boundary]", error.message, info.componentStack);
  }
  reset = () => this.setState({ error: null });
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    const x = explainError(error);
    return (
      <main className="ideate-shell" style={{ padding: "1.5rem", maxWidth: "48rem", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.4rem" }}>{x.title}</h1>
        <p>{x.detail}</p>
        {x.fix && <p><b>What to do:</b> {x.fix}</p>}
        <details><summary>error</summary><pre style={{ whiteSpace: "pre-wrap" }}>{error.message}</pre></details>
        <button type="button" onClick={this.reset}>try again</button>
      </main>
    );
  }
}
