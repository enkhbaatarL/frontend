import { DIAMOND_SVG, HOVER_POINT_DIAMOND_SVG, SVG_DIMENSIONS } from '../constants'

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

export const createHoverPointDiamonSVG = (color: string): string => {
  // Create the SVG content as a string
  const svgContent = `<svg width="${SVG_DIMENSIONS.WIDTH}" height="${SVG_DIMENSIONS.HEIGHT}" viewBox="${SVG_DIMENSIONS.VIEW_BOX}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#${HOVER_POINT_DIAMOND_SVG.FILTER_ID})">
      <circle opacity="${HOVER_POINT_DIAMOND_SVG.CIRCLE_OPACITY}" cx="${SVG_DIMENSIONS.WIDTH / 2}" cy="${SVG_DIMENSIONS.HEIGHT / 2}" r="${SVG_DIMENSIONS.OUTER_CIRCLE_RADIUS}" fill="${color}"/>
      <path d="${HOVER_POINT_DIAMOND_SVG.WHITE_PATH}" fill="white"/>
      <path d="${HOVER_POINT_DIAMOND_SVG.COLORED_PATH}" fill="${color}"/>
    </g>
    <defs>
      <filter x="${SVG_DIMENSIONS.WIDTH / 2 - HOVER_POINT_DIAMOND_SVG.CIRCLE_RADIUS - 4}" y="${SVG_DIMENSIONS.HEIGHT / 2 - HOVER_POINT_DIAMOND_SVG.CIRCLE_RADIUS - 4}" width="${HOVER_POINT_DIAMOND_SVG.CIRCLE_RADIUS * 2 + 8}" height="${HOVER_POINT_DIAMOND_SVG.CIRCLE_RADIUS * 2 + 8}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_${HOVER_POINT_DIAMOND_SVG.FILTER_ID.split('_')[1]}"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_${HOVER_POINT_DIAMOND_SVG.FILTER_ID.split('_')[1]}" result="shape"/>
      </filter>
    </defs>
  </svg>`

  // Proper encoding for data URL
  const encodedSvg = svgContent
    .replace(/"/g, '\'')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\s+/g, ' ')
    .replace(/"/g, '\'')

  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`
}

export const createMakerSVG = (color: string) => {
  const encodedColor = encodeURIComponent(color)

  return `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8" fill="none">
  <path d="M7.27611 7.04478C6.87592 7.53733 6.12408 7.53733 5.72389 7.04478L1.32486 1.63059C0.793874 0.977076 1.25894 -7.27664e-09 2.10097 9.58373e-08L10.899 1.17323e-06C11.7411 1.27634e-06 12.2061 0.977079 11.6751 1.63059L7.27611 7.04478Z" fill="${encodedColor}"/>
</svg>`
}

export const createActiveDiamonSVG = (color: string): string => {
  const svgContent = `<svg width="${SVG_DIMENSIONS.WIDTH}" height="${SVG_DIMENSIONS.HEIGHT}" viewBox="${SVG_DIMENSIONS.VIEW_BOX}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_4415_16989)">
      <circle cx="${SVG_DIMENSIONS.WIDTH / 2}" cy="${SVG_DIMENSIONS.HEIGHT / 2}" r="${SVG_DIMENSIONS.OUTER_CIRCLE_RADIUS}" fill="${color}"/>
    </g>
    <path d="M${SVG_DIMENSIONS.WIDTH / 2} ${SVG_DIMENSIONS.HEIGHT / 2 + 6.5}C${SVG_DIMENSIONS.WIDTH / 2 + 0.35} ${SVG_DIMENSIONS.HEIGHT / 2 + 6.5} ${SVG_DIMENSIONS.WIDTH / 2 + 0.52} ${SVG_DIMENSIONS.HEIGHT / 2 + 6.27} ${SVG_DIMENSIONS.WIDTH / 2 + 0.87} ${SVG_DIMENSIONS.HEIGHT / 2 + 5.79}L${SVG_DIMENSIONS.WIDTH / 2 + 4.62} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.79}C${SVG_DIMENSIONS.WIDTH / 2 + 4.79} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.55} ${SVG_DIMENSIONS.WIDTH / 2 + 4.89} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.33} ${SVG_DIMENSIONS.WIDTH / 2 + 4.89} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.08}C${SVG_DIMENSIONS.WIDTH / 2 + 4.89} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.18} ${SVG_DIMENSIONS.WIDTH / 2 + 4.79} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.4} ${SVG_DIMENSIONS.WIDTH / 2 + 4.62} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.63}L${SVG_DIMENSIONS.WIDTH / 2 + 0.87} ${SVG_DIMENSIONS.HEIGHT / 2 - 5.63}C${SVG_DIMENSIONS.WIDTH / 2 + 0.52} ${SVG_DIMENSIONS.HEIGHT / 2 - 6.1} ${SVG_DIMENSIONS.WIDTH / 2 + 0.35} ${SVG_DIMENSIONS.HEIGHT / 2 - 6.33} ${SVG_DIMENSIONS.WIDTH / 2} ${SVG_DIMENSIONS.HEIGHT / 2 - 6.33}C${SVG_DIMENSIONS.WIDTH / 2 - 0.34} ${SVG_DIMENSIONS.HEIGHT / 2 - 6.33} ${SVG_DIMENSIONS.WIDTH / 2 - 0.51} ${SVG_DIMENSIONS.HEIGHT / 2 - 6.1} ${SVG_DIMENSIONS.WIDTH / 2 - 0.87} ${SVG_DIMENSIONS.HEIGHT / 2 - 5.63}L${SVG_DIMENSIONS.WIDTH / 2 - 4.62} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.63}C${SVG_DIMENSIONS.WIDTH / 2 - 4.79} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.4} ${SVG_DIMENSIONS.WIDTH / 2 - 4.89} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.18} ${SVG_DIMENSIONS.WIDTH / 2 - 4.89} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.08}C${SVG_DIMENSIONS.WIDTH / 2 - 4.89} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.33} ${SVG_DIMENSIONS.WIDTH / 2 - 4.79} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.55} ${SVG_DIMENSIONS.WIDTH / 2 - 4.62} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.79}L${SVG_DIMENSIONS.WIDTH / 2 - 0.87} ${SVG_DIMENSIONS.HEIGHT / 2 + 5.79}C${SVG_DIMENSIONS.WIDTH / 2 - 0.51} ${SVG_DIMENSIONS.HEIGHT / 2 + 6.27} ${SVG_DIMENSIONS.WIDTH / 2 - 0.34} ${SVG_DIMENSIONS.HEIGHT / 2 + 6.5} ${SVG_DIMENSIONS.WIDTH / 2} ${SVG_DIMENSIONS.HEIGHT / 2 + 6.5}Z" fill="white"/>
    <path d="M${SVG_DIMENSIONS.WIDTH / 2} ${SVG_DIMENSIONS.HEIGHT / 2 + 5.5}C${SVG_DIMENSIONS.WIDTH / 2 + 0.29} ${SVG_DIMENSIONS.HEIGHT / 2 + 5.5} ${SVG_DIMENSIONS.WIDTH / 2 + 0.44} ${SVG_DIMENSIONS.HEIGHT / 2 + 5.3} ${SVG_DIMENSIONS.WIDTH / 2 + 0.74} ${SVG_DIMENSIONS.HEIGHT / 2 + 4.9}L${SVG_DIMENSIONS.WIDTH / 2 + 3.91} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.66}C${SVG_DIMENSIONS.WIDTH / 2 + 4.05} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.46} ${SVG_DIMENSIONS.WIDTH / 2 + 4.14} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.27} ${SVG_DIMENSIONS.WIDTH / 2 + 4.14} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.05}C${SVG_DIMENSIONS.WIDTH / 2 + 4.14} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.16} ${SVG_DIMENSIONS.WIDTH / 2 + 4.05} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.35} ${SVG_DIMENSIONS.WIDTH / 2 + 3.91} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.55}L${SVG_DIMENSIONS.WIDTH / 2 + 0.74} ${SVG_DIMENSIONS.HEIGHT / 2 - 4.78}C${SVG_DIMENSIONS.WIDTH / 2 + 0.44} ${SVG_DIMENSIONS.HEIGHT / 2 - 5.18} ${SVG_DIMENSIONS.WIDTH / 2 + 0.29} ${SVG_DIMENSIONS.HEIGHT / 2 - 5.38} ${SVG_DIMENSIONS.WIDTH / 2} ${SVG_DIMENSIONS.HEIGHT / 2 - 5.38}C${SVG_DIMENSIONS.WIDTH / 2 - 0.29} ${SVG_DIMENSIONS.HEIGHT / 2 - 5.38} ${SVG_DIMENSIONS.WIDTH / 2 - 0.44} ${SVG_DIMENSIONS.HEIGHT / 2 - 5.18} ${SVG_DIMENSIONS.WIDTH / 2 - 0.73} ${SVG_DIMENSIONS.HEIGHT / 2 - 4.78}L${SVG_DIMENSIONS.WIDTH / 2 - 3.91} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.55}C${SVG_DIMENSIONS.WIDTH / 2 - 4.05} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.35} ${SVG_DIMENSIONS.WIDTH / 2 - 4.14} ${SVG_DIMENSIONS.HEIGHT / 2 - 0.16} ${SVG_DIMENSIONS.WIDTH / 2 - 4.14} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.05}C${SVG_DIMENSIONS.WIDTH / 2 - 4.14} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.27} ${SVG_DIMENSIONS.WIDTH / 2 - 4.05} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.46} ${SVG_DIMENSIONS.WIDTH / 2 - 3.91} ${SVG_DIMENSIONS.HEIGHT / 2 + 0.66}L${SVG_DIMENSIONS.WIDTH / 2 - 0.73} ${SVG_DIMENSIONS.HEIGHT / 2 + 4.9}C${SVG_DIMENSIONS.WIDTH / 2 - 0.44} ${SVG_DIMENSIONS.HEIGHT / 2 + 5.3} ${SVG_DIMENSIONS.WIDTH / 2 - 0.29} ${SVG_DIMENSIONS.HEIGHT / 2 + 5.5} ${SVG_DIMENSIONS.WIDTH / 2} ${SVG_DIMENSIONS.HEIGHT / 2 + 5.5}Z" fill="white"/>
    <defs>
      <filter id="filter0_d_4415_16989" x="${SVG_DIMENSIONS.WIDTH / 2 - SVG_DIMENSIONS.OUTER_CIRCLE_RADIUS - 4}" y="${SVG_DIMENSIONS.HEIGHT / 2 - SVG_DIMENSIONS.OUTER_CIRCLE_RADIUS - 4}" width="${SVG_DIMENSIONS.OUTER_CIRCLE_RADIUS * 2 + 8}" height="${SVG_DIMENSIONS.OUTER_CIRCLE_RADIUS * 2 + 8}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_4415_16989"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_4415_16989" result="shape"/>
      </filter>
    </defs>
  </svg>`

  // Proper encoding for data URL
  const encodedSvg = svgContent
    .replace(/"/g, '\'')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\s+/g, ' ')
    .replace(/"/g, '\'')

  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`
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
      image.onerror = (e) => {
        console.error(e)
        resolve([key, null]) // Resolve anyway to not block other images
      }
    })

    image.src = imgSrc

    return imagePromise
  })

  const imageEntries = await Promise.all(imageLoadingProcess)

  return Object.fromEntries(imageEntries)
}
