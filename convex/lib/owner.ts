// Single-owner test build: there is no sign-in yet, so every row carries this
// constant tenant key. A multi-user cut swaps the constant for the signed-in
// person's id — additive, no schema change (tenant column is already first).
export const OWNER_KEY = "local";
