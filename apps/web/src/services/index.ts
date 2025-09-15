import { apiAdapter } from "./apiAdapter";
export * from "./types";

// In the future we can switch adapters via env/flag here.
export function getServices() {
  return apiAdapter;
}

