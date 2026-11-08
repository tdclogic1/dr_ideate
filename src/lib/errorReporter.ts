// Error trapping from birth (platform backlog: "bake error trapping into the
// scaffold so it can't be skipped"). Console-only until the platform rail is
// provisioned; then forward to the platform signal stream via a Convex action
// (see convex/platform.ts) — never directly from the browser.
export function installErrorReporter(report?: (kind: string, detail: string) => void) {
  const emit = (kind: string, detail: string) => {
    console.error(`[ideate:${kind}]`, detail);
    report?.(kind, detail);
  };
  window.addEventListener("error", (e) => emit("error", String(e.error ?? e.message)));
  window.addEventListener("unhandledrejection", (e) => emit("unhandledrejection", String(e.reason)));
}
