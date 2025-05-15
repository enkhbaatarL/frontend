import { DIAMOND_SVG, SVG_DIMENSIONS } from '../constants'

export const createHoverDotSVG = (color: string): string => {
  // Encode the color for use in a data URL
  const encodedColor = encodeURIComponent(color)

  // Create an SVG data URL with the specified color
  return `data:image/svg+xml;charset=utf-8,<svg width="${SVG_DIMENSIONS.WIDTH}" height="${SVG_DIMENSIONS.HEIGHT}" viewBox="${SVG_DIMENSIONS.VIEW_BOX}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle opacity="${SVG_DIMENSIONS.OUTER_CIRCLE_OPACITY}" cx="${SVG_DIMENSIONS.WIDTH / 2}" cy="${SVG_DIMENSIONS.HEIGHT / 2}" r="${SVG_DIMENSIONS.OUTER_CIRCLE_RADIUS}" fill="${encodedColor}" />
      <circle cx="${SVG_DIMENSIONS.WIDTH / 2}" cy="${SVG_DIMENSIONS.HEIGHT / 2}" r="${SVG_DIMENSIONS.INNER_WHITE_CIRCLE_RADIUS}" fill="white" />
      <circle cx="${SVG_DIMENSIONS.WIDTH / 2}" cy="${SVG_DIMENSIONS.HEIGHT / 2}" r="${SVG_DIMENSIONS.INNER_COLORED_CIRCLE_RADIUS}" fill="${encodedColor}" />
    </svg>`
}

export const createHoverDiamonSVG = (color: string): string => {
  // Encode the color for use in a data URL
  const encodedColor = encodeURIComponent(color)

  // Create an SVG data URL with the specified color
  return `data:image/svg+xml;charset=utf-8,<svg width="${SVG_DIMENSIONS.WIDTH}" height="${SVG_DIMENSIONS.HEIGHT}" viewBox="${SVG_DIMENSIONS.VIEW_BOX}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle opacity="${DIAMOND_SVG.OUTER_CIRCLE_OPACITY}" cx="${SVG_DIMENSIONS.WIDTH / 2}" cy="${SVG_DIMENSIONS.HEIGHT / 2}" r="${DIAMOND_SVG.OUTER_CIRCLE_RADIUS}" fill="${encodedColor}" />
        <path d="${DIAMOND_SVG.WHITE_PATH}" fill="white"/>
        <path d="${DIAMOND_SVG.COLORED_PATH}" fill="${encodedColor}"/>
      </svg>`
}

export const createMakerSVG = (color: string) => {
  const encodedColor = encodeURIComponent(color)

  return `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8" fill="none">
  <path d="M7.27611 7.04478C6.87592 7.53733 6.12408 7.53733 5.72389 7.04478L1.32486 1.63059C0.793874 0.977076 1.25894 -7.27664e-09 2.10097 9.58373e-08L10.899 1.17323e-06C11.7411 1.27634e-06 12.2061 0.977079 11.6751 1.63059L7.27611 7.04478Z" fill="${encodedColor}"/>
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
