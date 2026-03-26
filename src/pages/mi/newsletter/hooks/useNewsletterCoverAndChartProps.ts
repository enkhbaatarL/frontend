import html2canvas from 'html2canvas'
import { useCallback, useEffect, useRef } from 'react'

import type { INewsletterIssueSnapshotData } from '@/service/mi/newsletter'

import { getCoverProps, getMarketTimes, getNewsFlowProps } from '@/pages/mi/newsletter/utils/snapshotUtils'

export const useNewsletterCoverAndChartProps = (
  snapshot: INewsletterIssueSnapshotData | null,
  onCoverImageReady?: (image: string) => void,
) => {
  const coverRef = useRef<HTMLDivElement>(null)
  const coverProps = getCoverProps(snapshot)
  const newsFlowProps = getNewsFlowProps(snapshot)
  const { marketOpenTime, marketCloseTime } = getMarketTimes(snapshot)

  const captureCover = useCallback(async () => {
    if (!coverRef.current || !onCoverImageReady) return
    try {
      const canvas = await html2canvas(coverRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      })
      onCoverImageReady(canvas.toDataURL('image/png'))
    } catch {
      // 캡처 실패: SKIP
    }
  }, [onCoverImageReady])

  useEffect(() => {
    if (coverProps.imageBase64) {
      const timer = setTimeout(captureCover, 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [coverProps.imageBase64, captureCover])

  return { coverRef, coverProps, newsFlowProps, marketOpenTime, marketCloseTime }
}
