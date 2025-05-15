export const SVG_DIMENSIONS = {
  WIDTH: 34,
  HEIGHT: 34,
  VIEW_BOX: '0 0 34 34',
  OUTER_CIRCLE_RADIUS: 9,
  INNER_WHITE_CIRCLE_RADIUS: 5.5,
  INNER_COLORED_CIRCLE_RADIUS: 4,
  OUTER_CIRCLE_OPACITY: 0.3,
}

export const createHoverDotSVG = (color: string): string => {
  // Encode the color for use in a data URL
  const encodedColor = encodeURIComponent(color)

  // Create an SVG data URL with the specified color
  return `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" fill="none">
  <circle opacity="0.12" cx="17" cy="17" r="9" fill="${encodedColor}"/>
  <circle cx="17" cy="17" r="4" fill="white" stroke="${encodedColor}" stroke-width="2"/>
</svg>`
}

export default async function loadImages(payload: Record<string, string>) {
  const listImages = Object.entries(payload)

  const imageLoadingProcess = listImages.map(async ([key, imgSrc]) => {
    const image = new Image()

    image.crossOrigin = 'anonymous' // Avoid CORS issues

    const imagePromise = new Promise<[string, HTMLImageElement | null]>((resolve) => {
      image.onload = () => {
        resolve([key, image])
      }
      image.onerror = () => {
        resolve([key, null]) // Resolve anyway to not block other images
      }
    })

    image.src = imgSrc

    return imagePromise
  })

  const imageEntries = await Promise.all(imageLoadingProcess)

  return Object.fromEntries(imageEntries)
}
