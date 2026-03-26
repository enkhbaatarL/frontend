import { Box, Collapse } from '@mui/material'

import type { INewsletterIssueSnapshotData } from '@/service/mi/newsletter'

import InflectionPointChart from '@/pages/mi/newsletter/components/chart/InflectionPointChart'
import Cover from '@/pages/mi/newsletter/components/emailTemplate/Cover'
import EmailContent from '@/pages/mi/newsletter/components/view/EmailContent'
import OilPriceRowEmailCapture from '@/pages/mi/newsletter/components/view/OilPriceRowEmailCapture'
import { useNewsletterCoverAndChartProps } from '@/pages/mi/newsletter/hooks/useNewsletterCoverAndChartProps'
import { filterVisibleNewsFlowItems, shouldSuppressNewsFlowChartUi } from '@/pages/mi/newsletter/utils/snapshotUtils'
import { NewsletterDetailPageMode } from '@/service/mi/newsletter'

type NewsletterViewProps = {
  snapshot: INewsletterIssueSnapshotData | null
  isScrolled?: boolean
  onMainChartImageReady?: (image: string) => void
  referenceChartImages?: (string | undefined)[]
  onReferenceChartImageReady?: (index: number, image: string) => void
  onCoverImageReady?: (image: string) => void
  onOilPriceRowImageReady?: (image: string) => void
}

const NewsletterView = ({
  snapshot,
  isScrolled,
  onMainChartImageReady,
  referenceChartImages,
  onReferenceChartImageReady,
  onCoverImageReady,
  onOilPriceRowImageReady,
}: NewsletterViewProps) => {
  const { coverRef, coverProps, newsFlowProps, marketOpenTime, marketCloseTime } = useNewsletterCoverAndChartProps(
    snapshot,
    onCoverImageReady,
  )

  const suppressNewsFlowChart = shouldSuppressNewsFlowChartUi(snapshot)

  return (
    <>
      <Box pb="38px">
        <Collapse
          in={!isScrolled}
          timeout={400}
          sx={{
            '& .MuiCollapse-wrapperInner': {
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <Box
            style={{
              transform: `translateY(${isScrolled ? -6 : 0}px)`,
              opacity: isScrolled ? 0 : 1,
              transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
              transitionDelay: isScrolled ? '0s' : '0.2s',
            }}
          >
            <div ref={coverRef} id="section-cover">
              <Cover
                image={coverProps.imageBase64}
                frequency={coverProps.frequency}
                name={coverProps.name}
                description={coverProps.description}
                showImage={coverProps.showImage}
              />
            </div>
          </Box>
        </Collapse>
      </Box>

      <OilPriceRowEmailCapture snapshot={snapshot} onOilPriceRowImageReady={onOilPriceRowImageReady} />

      <EmailContent
        snapshot={snapshot}
        chartNode={
          suppressNewsFlowChart ? null : (
            <InflectionPointChart
              chartData={{
                chartData: newsFlowProps.chartData,
                title: newsFlowProps.title,
                aggregationTime: newsFlowProps.aggregationTime,
              }}
              relatedNews={filterVisibleNewsFlowItems(newsFlowProps.newsEventItems).filter((n) => n.visibility !== false)}
              mode={NewsletterDetailPageMode.VIEW}
              marketOpenTime={marketOpenTime}
              marketCloseTime={marketCloseTime}
              onChartImageReady={onMainChartImageReady}
            />
          )
        }
        referenceChartImages={referenceChartImages}
        onReferenceChartImageReady={onReferenceChartImageReady}
        useLiveChart
        tempHideCover
      />
    </>
  )
}

export default NewsletterView
