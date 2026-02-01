
export type ProcessParams = {
  w?: number
  h?: number
  q?: number
  format?: string
}

export function areParamsEqual(a: ProcessParams, b: ProcessParams) {
  return (
    a.w === b.w &&
    a.h === b.h &&
    a.q === b.q &&
    a.format === b.format
  )
}


/**
 * Parse URLSearchParams → typed params
 */
export function parseProcessParams(
  searchParams: URLSearchParams
): ProcessParams {
  const getInt = (key: string) => {
    const v = searchParams.get(key)
    if (!v) return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }

  const format = searchParams.get("format")

  return {
    w: getInt("w"),
    h: getInt("h"),
    q: getInt("q"),
    format:
      format === "jpeg" || format === "png"
        ? format
        : undefined,
  }
}

/**
 * Serialize params → query string
 * Removes empty values automatically
 */
export function serializeProcessParams(
  params: ProcessParams
): string {
  const sp = new URLSearchParams()

  if (params.w) sp.set("w", String(params.w))
  if (params.h) sp.set("h", String(params.h))
  if (params.q) sp.set("q", String(params.q))
  if (params.format) sp.set("format", params.format)

  return sp.toString()
}
