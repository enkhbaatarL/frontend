const GOLDEN_ANGLE_HUE_STEP = 137.508

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360
  const sat = Math.max(0, Math.min(1, s))
  const light = Math.max(0, Math.min(1, l))

  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = light - c / 2

  let rp = 0
  let gp = 0
  let bp = 0
  if (hue < 60) {
    rp = c
    gp = x
  } else if (hue < 120) {
    rp = x
    gp = c
  } else if (hue < 180) {
    gp = c
    bp = x
  } else if (hue < 240) {
    gp = x
    bp = c
  } else if (hue < 300) {
    rp = x
    bp = c
  } else {
    rp = c
    bp = x
  }

  const toByte = (v: number) =>
    Math.max(0, Math.min(255, Math.round((v + m) * 255)))
      .toString(16)
      .padStart(2, '0')

  return `#${toByte(rp)}${toByte(gp)}${toByte(bp)}`
}

export function buildDistinctSeriesColors(basePalette: readonly string[], count: number): string[] {
  if (count <= 0) return []

  const used = new Set<string>()
  const result: string[] = []

  const baseLen = basePalette.length

  for (let i = 0; i < count; i++) {
    if (i < baseLen) {
      const c = basePalette[i]!
      const key = c.trim().toLowerCase()
      used.add(key)
      result.push(c)
      continue
    }

    const n = i - baseLen
    let hue = (n * GOLDEN_ANGLE_HUE_STEP + 31.7) % 360
    const sat = 0.68 + (n % 5) * 0.024
    const lightness = 0.37 + ((n >> 2) % 5) * 0.028

    let hex = hslToHex(hue, sat, lightness)
    let guard = 0
    while (used.has(hex.toLowerCase()) && guard < 720) {
      hue = (hue + 1) % 360
      hex = hslToHex(hue, sat, lightness)
      guard++
    }

    used.add(hex.toLowerCase())
    result.push(hex)
  }

  return result
}
