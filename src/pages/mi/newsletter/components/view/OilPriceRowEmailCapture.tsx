import type { INewsletterIssueSnapshotData } from '@/service/mi/newsletter'

import { TitleOilPriceRowEmailTable } from '@/pages/mi/newsletter/components/emailTemplate/TitleAndOilPrice'
import { useOilPriceRowImageCapture } from '@/pages/mi/newsletter/hooks/useOilPriceRowImageCapture'

type OilPriceRowEmailCaptureProps = {
  snapshot: INewsletterIssueSnapshotData | null
  onOilPriceRowImageReady?: (image: string) => void
}

/** VIEW/REVISION/EDIT 공통 — 화면 밖에서 유가 행을 렌더한 뒤 html2canvas로 캡처 */
const OilPriceRowEmailCapture = ({ snapshot, onOilPriceRowImageReady }: OilPriceRowEmailCaptureProps) => {
  const { oilPriceRowRef, showOilRowForCapture, titleProps } = useOilPriceRowImageCapture(snapshot, onOilPriceRowImageReady)

  if (!showOilRowForCapture || titleProps.priceChangeFrom === undefined || titleProps.priceChangeTo === undefined) {
    return null
  }

  return (
    <div
      ref={oilPriceRowRef}
      aria-hidden
      style={{
        position: 'fixed',
        left: -10000,
        top: 0,
        zIndex: -1,
        backgroundColor: 'transparent',
      }}
    >
      <TitleOilPriceRowEmailTable priceChangeFrom={titleProps.priceChangeFrom} priceChangeTo={titleProps.priceChangeTo} />
    </div>
  )
}

export default OilPriceRowEmailCapture
