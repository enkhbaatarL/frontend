import html2canvas from 'html2canvas'
import Pica from 'pica'

/** 이메일용 차트 이미지에 적용할 border radius (px) */
export const CHART_IMAGE_BORDER_RADIUS = 10

/**
 * 캔버스 이미지에 둥근 모서리를 적용하여 새 캔버스 반환.
 * 다크모드와 무관하게 흰 배경 + borderRadius로 이메일에서 일관된 렌더링 보장.
 */
export const applyRoundedCornersToCanvas = (
  source: HTMLCanvasElement,
  borderRadius: number = CHART_IMAGE_BORDER_RADIUS,
  backgroundColor: string = '#FFFFFF',
): HTMLCanvasElement => {
  const out = document.createElement('canvas')
  out.width = source.width
  out.height = source.height
  const ctx = out.getContext('2d')
  if (!ctx) return out

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, out.width, out.height)

  ctx.save()
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(0, 0, out.width, out.height, borderRadius)
  } else {
    const r = Math.min(borderRadius, out.width / 2, out.height / 2)
    ctx.moveTo(r, 0)
    ctx.lineTo(out.width - r, 0)
    ctx.quadraticCurveTo(out.width, 0, out.width, r)
    ctx.lineTo(out.width, out.height - r)
    ctx.quadraticCurveTo(out.width, out.height, out.width - r, out.height)
    ctx.lineTo(r, out.height)
    ctx.quadraticCurveTo(0, out.height, 0, out.height - r)
    ctx.lineTo(0, r)
    ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
  }
  ctx.clip()
  ctx.drawImage(source, 0, 0)
  ctx.restore()

  return out
}

interface ImageConversionOptions {
  target: HTMLElement
  remove?: string[]
  imageSize?: {
    width?: number
    height?: number
  }
  padding?: number
  captureScale?: number
}

/**
 * HTML 요소를 고해상도 이미지(캔버스)로 변환하는 함수
 * @param options 변환 옵션
 * @returns Promise<HTMLCanvasElement> 변환된 캔버스 요소
 */
export const convertElementToImageCanvas = async ({
  target,
  remove = [],
  imageSize = {},
  padding = 0,
  captureScale = 1,
}: ImageConversionOptions): Promise<HTMLCanvasElement> => {
  const targetElement = target
  const originalRect = targetElement.getBoundingClientRect()
  const scaleRatio = Math.max(1, captureScale)

  // DOM 복제 및 스타일 설정
  const clonedElement = targetElement.cloneNode(true) as HTMLElement
  clonedElement.style.position = 'absolute'
  clonedElement.style.left = '-9999px'
  clonedElement.style.width = `${originalRect.width}px`
  clonedElement.style.height = `${originalRect.height}px`
  clonedElement.style.transform = 'none'
  clonedElement.style.transformOrigin = '0 0'
  document.body.appendChild(clonedElement)

  // html2canvas 렌더링 보정 (클론과 실제 DOM은 구조가 동일하므로 인덱스로 매칭)
  const liveElements = targetElement.querySelectorAll<HTMLElement>('*')
  const clonedElements = clonedElement.querySelectorAll<HTMLElement>('*')

  liveElements.forEach((liveElement, index) => {
    const clonedChild = clonedElements[index]
    if (!clonedChild) return
    const computed = window.getComputedStyle(liveElement)

    // box-shadow는 html2canvas가 회색 얼룩으로 렌더하므로 제거한다. (예: 세그먼트 탭의 선택 pill)
    if (computed.boxShadow && computed.boxShadow !== 'none') {
      clonedChild.style.boxShadow = 'none'
    }
  })

  // 지정된 요소들 제거
  remove.forEach((selector) => {
    const elements = clonedElement.querySelectorAll(selector)
    elements.forEach((element) => element.remove())
  })

  // 캔버스 요소들을 고해상도로 변환
  const originalCanvases = targetElement.querySelectorAll('canvas')
  if (originalCanvases.length > 0) {
    originalCanvases.forEach((originalCanvas, index) => {
      const clonedCanvas = originalCanvas.cloneNode(true) as HTMLCanvasElement
      const clonedCanvasContext = clonedCanvas.getContext('2d')

      const scale = 4
      clonedCanvas.width = originalCanvas.width * scale
      clonedCanvas.height = originalCanvas.height * scale
      clonedCanvas.style.width = originalCanvas.style.width
      clonedCanvas.style.height = originalCanvas.style.height

      if (clonedCanvasContext) {
        clonedCanvasContext.scale(scale, scale)
        if (originalCanvas.width > 0 && originalCanvas.height > 0) {
          clonedCanvasContext.drawImage(originalCanvas, 0, 0)
        }
      }

      const clonedCanvasElements = clonedElement.querySelectorAll('canvas')
      if (clonedCanvasElements[index]) {
        clonedCanvasElements[index].parentNode?.replaceChild(clonedCanvas, clonedCanvasElements[index])
      }
    })
  }

  // html2canvas로 DOM을 캔버스로 변환
  const canvas = await html2canvas(clonedElement, {
    backgroundColor: '#FFFFFF',
    scale: scaleRatio,
    allowTaint: false,
    logging: false,
    useCORS: true,
    imageTimeout: 0,
    removeContainer: false,
    width: originalRect.width,
    height: originalRect.height,
  })

  // 복제된 요소 제거
  clonedElement.remove()

  // 최종 크기 계산
  let contentWidth: number
  let contentHeight: number

  if (!imageSize.width && !imageSize.height) {
    contentWidth = originalRect.width
    contentHeight = originalRect.height
  } else if (imageSize.width && !imageSize.height) {
    contentWidth = imageSize.width
    contentHeight = (canvas.height * contentWidth) / canvas.width
  } else if (!imageSize.width && imageSize.height) {
    contentHeight = imageSize.height
    contentWidth = (canvas.width * contentHeight) / canvas.height
  } else {
    contentWidth = imageSize.width!
    contentHeight = imageSize.height!
  }

  const outputContentWidth = Math.round(contentWidth)
  const outputContentHeight = Math.round(contentHeight)
  const outputPadding = Math.round(padding)
  const totalWidth = outputContentWidth + outputPadding * 2
  const totalHeight = outputContentHeight + outputPadding * 2

  // 최종 캔버스 생성
  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = totalWidth
  resizedCanvas.height = totalHeight

  const pica = new Pica({
    features: ['js', 'wasm', 'cib'],
  })

  const ctx = resizedCanvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, totalWidth, totalHeight)
  }

  const outputContentCanvas =
    canvas.width === outputContentWidth && canvas.height === outputContentHeight ? canvas : document.createElement('canvas')

  if (outputContentCanvas !== canvas) {
    outputContentCanvas.width = outputContentWidth
    outputContentCanvas.height = outputContentHeight

    // Pica를 사용한 고품질 리사이징
    await pica.resize(canvas, outputContentCanvas, {
      unsharpAmount: 102,
      unsharpRadius: 1.5,
      unsharpThreshold: 255,
    })
  }

  if (ctx) {
    if (outputContentCanvas.width > 0 && outputContentCanvas.height > 0) {
      ctx.drawImage(outputContentCanvas, outputPadding, outputPadding)
    }
  }

  return resizedCanvas
}
