import { useCallback, useEffect, useState } from 'react'

/**
 * 차트 내용이 변경되는 즉시 이미지가 생성되고 저장됨
 * -> 메일 발송/렌더링 시 별도의 캡처 작업 없이 저장된 이미지 사용
 *
 * 1. 각 차트 컴포넌트는 렌더 완료 시 onChartImageReady(image) 콜백 호출
 * 2. 해당 이미지를 상태에 반영
 * 3. 메일 발송 시 chartImages 상태를 그대로 사용
 */
export const useChartImageStore = (referenceCount: number) => {
  const [mainChartImage, setMainChartImage] = useState<string>('')
  const [coverImage, setCoverImage] = useState<string>('')
  const [oilPriceRowImage, setOilPriceRowImage] = useState<string>('')
  const [referenceChartImages, setReferenceChartImages] = useState<(string | undefined)[]>(() => new Array(referenceCount).fill(undefined))

  // referenceCount 변경 시 배열 길이 동기화
  useEffect(() => {
    setReferenceChartImages((prev) => {
      if (prev.length === referenceCount) return prev
      const next = [...prev]
      while (next.length < referenceCount) next.push(undefined)
      while (next.length > referenceCount) next.pop()
      return next
    })
  }, [referenceCount])

  const onMainChartImageReady = useCallback((image: string) => {
    setMainChartImage(image)
  }, [])

  const onCoverImageReady = useCallback((image: string) => {
    setCoverImage(image)
  }, [])

  const onOilPriceRowImageReady = useCallback((image: string) => {
    setOilPriceRowImage(image)
  }, [])

  const onReferenceChartImageReady = useCallback((index: number, image: string) => {
    setReferenceChartImages((prev) => {
      const next = [...prev]
      next[index] = image
      return next
    })
  }, [])

  const resetImages = useCallback(() => {
    setMainChartImage('')
    setCoverImage('')
    setOilPriceRowImage('')
    setReferenceChartImages((prev) => new Array(prev.length).fill(undefined))
  }, [])

  return {
    mainChartImage,
    coverImage,
    oilPriceRowImage,
    referenceChartImages,
    onMainChartImageReady,
    onCoverImageReady,
    onOilPriceRowImageReady,
    onReferenceChartImageReady,
    resetImages,
  }
}
