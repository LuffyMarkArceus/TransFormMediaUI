const base = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_URL) || ""
export const API_V1 = `${base}/api/v1`

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export function mediaPath(suffix = ""): string {
  return `${API_V1}/media${suffix}`
}

export function mediaProcessPath(mediaId: string, query: URLSearchParams): string {
  const qs = query.toString()
  return `${mediaPath(`/${mediaId}/process`)}${qs ? `?${qs}` : ""}`
}

export function mediaListPath(params: {
  type?: string
  status?: string
  search?: string
  sortBy?: string
  sortDir?: string
  limit?: number
  offset?: number
}): string {
  const sp = new URLSearchParams()
  if (params.type) sp.set("type", params.type)
  if (params.status) sp.set("status", params.status)
  if (params.search) sp.set("search", params.search)
  if (params.sortBy) sp.set("sortBy", params.sortBy)
  if (params.sortDir) sp.set("sortDir", params.sortDir)
  if (params.limit) sp.set("limit", String(params.limit))
  if (params.offset) sp.set("offset", String(params.offset))
  const qs = sp.toString()
  return `${mediaPath()}${qs ? `?${qs}` : ""}`
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
