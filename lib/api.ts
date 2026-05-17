/**
 * API paths and auth headers for the Go backend.
 *
 * In the browser we use same-origin `/api/v1/...` so Next.js rewrites proxy to the backend
 * (see next.config.ts BACKEND_URL). This keeps cookies/CORS simple in development.
 */
export const API_V1 = "/api/v1"

export function mediaPath(suffix = ""): string {
  return `${API_V1}/media${suffix}`
}

export function mediaProcessPath(mediaId: string, query: URLSearchParams): string {
  const qs = query.toString()
  return `${mediaPath(`/${mediaId}/process`)}${qs ? `?${qs}` : ""}`
}

export async function authHeaders(
  getToken: () => Promise<string | null>
): Promise<Record<string, string>> {
  const token = await getToken()
  if (!token) {
    throw new Error("Not authenticated")
  }
  return { Authorization: `Bearer ${token}` }
}
