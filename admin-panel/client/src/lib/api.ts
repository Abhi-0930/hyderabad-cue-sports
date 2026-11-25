/**
 * Dynamic Fastify API base URL resolver.
 * Supports:
 * - import.meta.env.VITE_API_URL or VITE_BACKEND_URL (if provided)
 * - Dynamic browser hostname: http://${window.location.hostname}:5000 (preserves localhost, 127.0.0.1, or LAN IPs)
 * - Fallback: http://localhost:5000
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const envUrl =
      (import.meta as any).env?.VITE_API_URL ||
      (import.meta as any).env?.VITE_BACKEND_URL;
    if (envUrl) return envUrl;

    const hostname = window.location.hostname || "localhost";
    return `http://${hostname}:5000`;
  }
  return "http://localhost:5000";
}

export const API_BASE = getApiBaseUrl();
