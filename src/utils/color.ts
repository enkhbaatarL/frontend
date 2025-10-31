export const convertToRgbaWithOpacity = (color: string, opacity: number) => {
  if (!color || typeof color !== 'string') {
    return color || ''
  }

  // If color is rgb, convert to rgba
  if (color.startsWith('rgb(') || color.startsWith('rgba')) {
    const rgbaRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i
    const match = color.match(rgbaRegex)

    if (!match) return color

    // Extract the RGB values
    const r = match[1]
    const g = match[2]
    const b = match[3]

    // Return the new RGBA string with updated opacity
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // For hex colors and named colors, use a canvas to convert
  const canvas = document.createElement('canvas')

  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')

  if (ctx === null) return color

  ctx.fillStyle = color
  const colorInCanvas = (ctx as CanvasRenderingContext2D).fillStyle as string

  const rgb = colorInCanvas
    .replace('#', '')
    ?.match(/.{2}/g)
    ?.map((hex) => parseInt(hex, 16))

  if (rgb) {
    const [r, g, b] = rgb

    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  return color
}

/**
 * Extracts opacity value from different color formats (rgba, hsla, hex)
 * @param {string} color - Color in rgba, hsla, or hex format
 * @returns {number} Opacity value between 0-1, or 1 if opacity cannot be determined
 */
export const getOpacityFromColor = (color: string): number => {
  if (!color || typeof color !== 'string') {
    return 1
  }

  // Handle rgba format
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/)

    if (match && match[1]) {
      return parseFloat(match[1])
    }
  }

  // Handle hsla format
  if (color.startsWith('hsla')) {
    const match = color.match(/hsla\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*,\s*([\d.]+)\s*\)/)

    if (match && match[1]) {
      return parseFloat(match[1])
    }
  }

  // Handle hex format with alpha (#RRGGBBAA)
  if (color.startsWith('#') && color.length === 9) {
    const alpha = color.slice(7, 9)

    return parseInt(alpha, 16) / 255
  }

  // Default for opaque colors (rgb, hsl, #RRGGBB)
  return 1
}
