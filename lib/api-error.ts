import axios from "axios"

/** Extract a user-facing message from an Axios/API error response. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      return data.error
    }
  }
  return fallback
}
