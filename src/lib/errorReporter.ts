// Window-level error trapping: logs to the console, with an optional reporter hook.
export function installErrorReporter(report?: (kind: string, detail: string) => void) {
  const emit = (kind: string, detail: string) => {
    console.error(`[ideate:${kind}]`, detail);
    report?.(kind, detail);
  };
  window.addEventListener("error", (e) => emit("error", String(e.error ?? e.message)));
  window.addEventListener("unhandledrejection", (e) => emit("unhandledrejection", String(e.reason)));
}
