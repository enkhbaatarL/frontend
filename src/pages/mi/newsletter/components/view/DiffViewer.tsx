import { Box, CircularProgress, Collapse } from '@mui/material'
import { useMemo } from 'react'

import type { RevisionVersion } from '@/pages/mi/newsletter/components/view/RevisionToolbar'

import InflectionPointChart from '@/pages/mi/newsletter/components/chart/InflectionPointChart'
import Cover from '@/pages/mi/newsletter/components/emailTemplate/Cover'
import ChangedLabel from '@/pages/mi/newsletter/components/view/ChangedLabel'
import EmailContent from '@/pages/mi/newsletter/components/view/EmailContent'
import OilPriceRowEmailCapture from '@/pages/mi/newsletter/components/view/OilPriceRowEmailCapture'
import { type ComparisonTarget, useDocumentDiff } from '@/pages/mi/newsletter/hooks/useDocumentDiff'
import { useNewsletterCoverAndChartProps } from '@/pages/mi/newsletter/hooks/useNewsletterCoverAndChartProps'
import { useNewsletterOriginalSnapshot } from '@/pages/mi/newsletter/hooks/useNewsletterOriginalSnapshot'
import { useRevisionChangeDetail } from '@/pages/mi/newsletter/hooks/useRevisionChangeDetail'
import {
  enrichNewsFlowItemTimestamps,
  filterVisibleNewsFlowItems,
  findFirstSectionByCanonicalCode,
  getChartBoxPositions,
  isNewsletterCoverInRenderedSections,
  NEWSLETTER_SECTION_CODE,
  shouldSuppressNewsFlowChartUi,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import { NewsletterDetailPageMode, type INewsletterIssueSnapshotData } from '@/service/mi/newsletter'
import useAuthStore from '@/store/useAuthStore'

export type DiffViewerProps = {
  newsletterId: string | undefined
  issueNo: string | undefined
  revisionId: number | undefined
  revisionVersions?: RevisionVersion[]
  /** 선택된 버전 ID (versions[].id = seq 문자열). "initial"이면 baseSnapshot 표시 */
  selectedVersionId: string
  /** 비교대상: 직전버전(n vs n-1) | 최초버전(n vs 0) */
  comparisonTarget?: ComparisonTarget
  isScrolled?: boolean
  onMainChartImageReady?: (image: string) => void
  referenceChartImages?: (string | undefined)[]
  onReferenceChartImageReady?: (index: number, image: string) => void
  onCoverImageReady?: (image: string) => void
  onOilPriceRowImageReady?: (image: string) => void
  /** 리비전 API·델타가 비어 있을 때(이력 없음, revisionId 없음 등) 발행호 상세 스냅샷으로 대체 */
  fallbackSnapshot?: INewsletterIssueSnapshotData | null
}

const DiffViewer = ({
  newsletterId,
  issueNo,
  revisionId,
  selectedVersionId,
  comparisonTarget = 'previous',
  isScrolled = false,
  onMainChartImageReady,
  referenceChartImages,
  onReferenceChartImageReady,
  onCoverImageReady,
  onOilPriceRowImageReady,
  fallbackSnapshot = null,
}: DiffViewerProps) => {
  const customerCompanyNo = useAuthStore((s) => s.accessCompanyInfo?.customerCompanyNo ?? 0)

  const { data: originalPublishedBaseline, isLoading: isOriginalSnapshotLoading } = useNewsletterOriginalSnapshot(
    newsletterId,
    issueNo,
    customerCompanyNo,
  )

  const selectedSeq = selectedVersionId === 'initial' ? null : Number.parseInt(selectedVersionId, 10)

  /** 선택한 seq 기준으로 조회해야 checkpoint base가 있는 이력에서도 해당 시점을 정확히 복원할 수 있습니다. */
  const requestSeq = selectedSeq && !Number.isNaN(selectedSeq) ? selectedSeq : 0

  const { data: revisionDetail, isLoading } = useRevisionChangeDetail(requestSeq, newsletterId, issueNo, revisionId)

  const { currentData, diffOverrides } = useDocumentDiff(revisionDetail, selectedSeq, comparisonTarget, originalPublishedBaseline)

  const displaySnapshot = useMemo(
    () => currentData ?? originalPublishedBaseline ?? fallbackSnapshot ?? null,
    [currentData, originalPublishedBaseline, fallbackSnapshot],
  )

  const { coverRef, coverProps, newsFlowProps, marketOpenTime, marketCloseTime } = useNewsletterCoverAndChartProps(
    displaySnapshot,
    onCoverImageReady,
  )

  const suppressNewsFlowChart = shouldSuppressNewsFlowChartUi(displaySnapshot)
  const savedBoxPositions = getChartBoxPositions(displaySnapshot)

  if (isLoading && !displaySnapshot) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200} py={4}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  const needsOriginalOnly = !revisionDetail?.baseSnapshot?.data
  if (needsOriginalOnly && isOriginalSnapshotLoading && !displaySnapshot) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200} py={4}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (!displaySnapshot) {
    return null
  }

  const coverSection = findFirstSectionByCanonicalCode(displaySnapshot, NEWSLETTER_SECTION_CODE.COVER)
  const coverContentDiff = !!(diffOverrides?.name || diffOverrides?.description)
  const coverOrderOnly =
    !!coverSection?.id && !coverContentDiff && !!diffOverrides?.sectionOrderChangedSectionIds?.includes(coverSection.id)
  const showAnimatedCover = isNewsletterCoverInRenderedSections(displaySnapshot)

  return (
    <>
      {showAnimatedCover && (
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
              <div ref={coverRef} id="section-cover" style={{ position: 'relative' }}>
                {(diffOverrides?.name || diffOverrides?.description) && (
                  <ChangedLabel diffHtmls={[diffOverrides?.name, diffOverrides?.description]} />
                )}
                {coverOrderOnly && <ChangedLabel labelKind="reordered" />}
                <Cover
                  image={coverProps.imageBase64}
                  frequency={coverProps.frequency}
                  name={coverProps.name}
                  description={coverProps.description}
                  showImage={coverProps.showImage}
                  nameDiffHtml={diffOverrides?.name}
                  descriptionDiffHtml={diffOverrides?.description}
                />
              </div>
            </Box>
          </Collapse>
        </Box>
      )}

      <OilPriceRowEmailCapture snapshot={displaySnapshot} onOilPriceRowImageReady={onOilPriceRowImageReady} />

      <EmailContent
        snapshot={displaySnapshot}
        chartNode={
          suppressNewsFlowChart ? null : (
            <InflectionPointChart
              chartData={{
                chartData: newsFlowProps.chartData,
                title: newsFlowProps.title,
                aggregationTime: newsFlowProps.aggregationTime,
              }}
              relatedNews={enrichNewsFlowItemTimestamps(
                filterVisibleNewsFlowItems(newsFlowProps.newsEventItems).filter((n) => n.visibility),
              )}
              mode={NewsletterDetailPageMode.VIEW}
              marketOpenTime={marketOpenTime}
              marketCloseTime={marketCloseTime}
              onChartImageReady={onMainChartImageReady}
              boxPositions={Object.keys(savedBoxPositions).length > 0 ? savedBoxPositions : undefined}
            />
          )
        }
        referenceChartImages={referenceChartImages}
        onReferenceChartImageReady={onReferenceChartImageReady}
        useLiveChart
        tempHideCover
        diffOverrides={Object.keys(diffOverrides).length > 0 ? diffOverrides : undefined}
        includeRemovedNewsFlowItems
      />
    </>
  )
}

export default DiffViewer
