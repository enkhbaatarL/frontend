import { useCallback, useEffect, useRef, useState } from 'react'

import { applyRoundedCornersToCanvas } from '@/utils/image'

/**
 * 차트 Canvas를 이미지(Base64)로 변환하는 로직을 담당하는 훅
 * - 메인 차트, 볼륨 차트 캔버스를 저장하고 합쳐서 Base64 이미지 생성
 * - waitForChartImage를 위한 Promise resolver 관리
 * - 이메일용: 흰 배경 + borderRadius 적용 (다크모드 무관 일관된 렌더링)
 */
export const useChartImageCapture = (hasVolume: boolean) => {
  const [mainChartImage, setMainChartImage] = useState<HTMLCanvasElement | null>(null)
  const [volumeChartImage, setVolumeChartImage] = useState<HTMLCanvasElement | null>(null)
  const [base64ChartImage, setBase64ChartImage] = useState<string>('')
  const chartImageResolversRef = useRef<((image: string) => void)[]>([])

  const mergeCanvasOverlay = useCallback((canvas: HTMLCanvasElement, overlayCanvas?: HTMLCanvasElement | null) => {
    if (!overlayCanvas || !overlayCanvas.width || !overlayCanvas.height) return canvas

    const mergedCanvas = document.createElement('canvas')
    const mergedCtx = mergedCanvas.getContext('2d')
    if (!mergedCtx) return canvas

    mergedCanvas.width = canvas.width
    mergedCanvas.height = canvas.height
    mergedCtx.drawImage(canvas, 0, 0)
    mergedCtx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height)
    return mergedCanvas
  }, [])

  const saveChartCanvas = useCallback((canvas: HTMLCanvasElement, setCanvasState: (canvas: HTMLCanvasElement) => void) => {
    if (!canvas.width || !canvas.height) return

    const tempCanvas = applyRoundedCornersToCanvas(canvas)
    setCanvasState(tempCanvas)
  }, [])

  const saveMainChartCanvas = useCallback(
    (canvas: HTMLCanvasElement, overlayCanvas?: HTMLCanvasElement | null) =>
      saveChartCanvas(mergeCanvasOverlay(canvas, overlayCanvas), setMainChartImage),
    [mergeCanvasOverlay, saveChartCanvas],
  )

  const saveVolumeChartCanvas = useCallback((canvas: HTMLCanvasElement) => saveChartCanvas(canvas, setVolumeChartImage), [saveChartCanvas])

  // 메인/볼륨 차트 이미지를 합쳐 Base64 생성 (동일 이미지 시 setState 스킵하여 무한 루프 방지)
  useEffect(() => {
    if (mainChartImage && volumeChartImage) {
      const combinedCanvas = document.createElement('canvas')
      const combinedCtx = combinedCanvas.getContext('2d')

      if (combinedCtx) {
        combinedCanvas.width = mainChartImage.width
        combinedCanvas.height = mainChartImage.height + volumeChartImage.height

        combinedCtx.fillStyle = '#FFFFFF'
        combinedCtx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)

        combinedCtx.drawImage(mainChartImage, 0, 0)
        combinedCtx.drawImage(volumeChartImage, 0, mainChartImage.height)

        const withRoundedCorners = applyRoundedCornersToCanvas(combinedCanvas)
        const dataURL = withRoundedCorners.toDataURL('image/png')
        setBase64ChartImage((prev) => (prev === dataURL ? prev : dataURL))
      }
    } else if (mainChartImage && !hasVolume) {
      const dataURL = mainChartImage.toDataURL('image/png')
      setBase64ChartImage((prev) => (prev === dataURL ? prev : dataURL))
    }
  }, [mainChartImage, volumeChartImage, hasVolume])

  // Base64 이미지 준비 시 waitForChartImage Promise resolve
  useEffect(() => {
    if (!base64ChartImage || chartImageResolversRef.current.length === 0) return
    chartImageResolversRef.current.forEach((resolve) => resolve(base64ChartImage))
    chartImageResolversRef.current = []
  }, [base64ChartImage])

  return {
    base64ChartImage,
    saveMainChartCanvas,
    saveVolumeChartCanvas,
    chartImageResolversRef,
  }
}
