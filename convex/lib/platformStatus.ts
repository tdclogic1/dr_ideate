// Pure helper (unit-testable without a Convex runtime): is the platform rail
// provisioned? The honest-degradation message is part of the contract — a
// missing key must read as "not connected", never fail silently or fake data.
export function platformStatus(url: string | undefined, key: string | undefined) {
  const connected = Boolean(url && key);
  return {
    connected,
    message: connected
      ? "platform rail connected"
      : "the assistant is not connected yet — platform rail not provisioned (see docs/planning/LIFECYCLE.md HUMAN items)",
  };
}
