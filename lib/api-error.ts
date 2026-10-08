import axios from "axios"

// Google's frontend rejects oversized request bodies before the backend runs
// and answers with an HTML/text 413 that carries no JSON error field.
const GFE_413_MESSAGE =
  "File is too large for this deployment (request limit ~32 MB). Use a file under 30 MB."

/** Extract a user-facing message from an Axios/API error response. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const data = err.response?.data
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      return data.error
    }
    if (status === 413 && !(data && typeof data === "object")) {
      return GFE_413_MESSAGE
    }
    if (typeof data === "string" && data.trimStart().startsWith("<")) {
      return `Request failed${status ? ` (HTTP ${status})` : ""}`
    }
  }
  return fallback
}

/** Message for a failed direct-to-storage PUT. Status 0 means the request
 * never got a response (network failure or a CORS rejection, which browsers
 * hide behind status 0) — those need wording that doesn't imply the server
 * rejected the file. */
export function presignPutErrorMessage(status: number, body: string, fallback: string): string {
  if (status === 0) {
    return "Could not reach storage to upload the file. Check your connection and retry."
  }
  const trimmed = body.trim()
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed?.message === "string" && parsed.message) return parsed.message
      if (typeof parsed?.error === "string" && parsed.error) return parsed.error
    } catch {
      /* fall through */
    }
  }
  if (trimmed.startsWith("<") || trimmed.startsWith("<?xml")) {
    return `Storage rejected the upload (HTTP ${status}).`
  }
  return fallback
}
