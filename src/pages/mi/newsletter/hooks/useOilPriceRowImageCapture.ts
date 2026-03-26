import html2canvas from 'html2canvas'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import type { INewsletterIssueSnapshotData } from '@/service/mi/newsletter'

import { getTitleProps } from '@/pages/mi/newsletter/utils/snapshotUtils'

export const useOilPriceRowImageCapture = (
  snapshot: INewsletterIssueSnapshotData | null,
  onOilPriceRowImageReady?: (image: string) => void,
) => {
  const oilPriceRowRef = useRef<HTMLDivElement>(null)
  const titleProps = getTitleProps(snapshot)

  const showOilRow = useMemo(() => {
    const { priceChangeFrom: from, priceChangeTo: to } = titleProps
    return from !== undefined && to !== undefined && Number.isFinite(from) && Number.isFinite(to)
  }, [titleProps.priceChangeFrom, titleProps.priceChangeTo])

  const captureOilPriceRow = useCallback(async () => {
    if (!oilPriceRowRef.current || !onOilPriceRowImageReady || !showOilRow) return
    try {
      const canvas = await html2canvas(oilPriceRowRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      })
      onOilPriceRowImageReady(canvas.toDataURL('image/png'))
    } catch {
      // 캡처 실패: SKIP
    }
  }, [oilPriceRowRef, onOilPriceRowImageReady, showOilRow])

  useEffect(() => {
    if (!onOilPriceRowImageReady) return () => {}
    if (!showOilRow) {
      onOilPriceRowImageReady('')
      return () => {}
    }
    const timer = setTimeout(captureOilPriceRow, 500)
    return () => clearTimeout(timer)
  }, [showOilRow, titleProps.priceChangeFrom, titleProps.priceChangeTo, captureOilPriceRow, onOilPriceRowImageReady])

  return { oilPriceRowRef, showOilRowForCapture: showOilRow, titleProps }
}
