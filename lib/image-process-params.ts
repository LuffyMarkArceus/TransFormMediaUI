
export type ProcessParams = {
  w?: number
  h?: number
  q?: number
  format?: string
  blur?: number
  grayscale?: boolean
  cw?: number
  ch?: number
  gravity?: string
}

export function areParamsEqual(a: ProcessParams, b: ProcessParams) {
  return (
    a.w === b.w &&
    a.h === b.h &&
    a.q === b.q &&
    a.format === b.format &&
    a.blur === b.blur &&
    a.grayscale === b.grayscale &&
    a.cw === b.cw &&
    a.ch === b.ch &&
    a.gravity === b.gravity
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

  const blur = searchParams.get("blur")
  const grayscale = searchParams.get("grayscale")
  const gravity = searchParams.get("gravity")

  return {
    w: getInt("w"),
    h: getInt("h"),
    q: getInt("q"),
    format:
      format === "jpeg" || format === "png" || format === "webp"
        ? format
        : undefined,
    blur: blur ? Number(blur) : undefined,
    grayscale: grayscale === "true" || grayscale === "1" ? true : undefined,
    cw: getInt("cw"),
    ch: getInt("ch"),
    gravity: gravity || undefined,
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
  if (params.blur) sp.set("blur", String(params.blur))
  if (params.grayscale) sp.set("grayscale", "true")
  if (params.cw) sp.set("cw", String(params.cw))
  if (params.ch) sp.set("ch", String(params.ch))
  if (params.gravity) sp.set("gravity", params.gravity)

  return sp.toString()
}
