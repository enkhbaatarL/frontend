import { Box, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { INewsletterIssueSnapshotData } from '@/service/mi/newsletter'

import NewsletterView from '@/pages/mi/newsletter/components/view/NewsletterView'
import { useRenderEmailContent } from '@/pages/mi/newsletter/components/view/useRenderEmailContent'
import { useChartImageStore } from '@/pages/mi/newsletter/hooks/useChartImageStore'
import {
  getBlockFields,
  getNewsFlowProps,
  getOrderedReferenceSections,
  getReferenceContentBlocks,
  getTitleProps,
  isReferenceBlockRemoved,
  isReferenceSectionRemoved,
  shouldSuppressNewsFlowChartUi,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import { fetchInternalNewsletterRenderData } from '@/service/mi/newsletter'
import { convertBase64ImagesToMailCapturePayload, prepareNewsletterEmailHtml } from '@/utils/email'

/**
 * 백엔드(헤드리스 브라우저)용 뉴스레터 HTML 생성 엔드포인트.
 *
 * URL: `/newsletter-render?token=<JWT>`
 * 완료 시 `globalThis.__mailContents`에 템플릿+이미지 지정, `document.body.dataset.captureReady === 'true'` 플래그 설정
 */
const NewsletterRenderPage = () => {
  const [searchParams] = useSearchParams()
  const [snapshot, setSnapshot] = useState<INewsletterIssueSnapshotData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const captureDoneRef = useRef(false)

  const { render: renderEmailContent } = useRenderEmailContent()

  const referenceChartCount = useMemo(() => {
    if (!snapshot) return 0
    const refs = getOrderedReferenceSections(snapshot)
    return refs.reduce((sum, sec) => {
      if (isReferenceSectionRemoved(sec)) return sum
      return sum + getReferenceContentBlocks(sec).filter((b) => b.type === 'CHART' && !isReferenceBlockRemoved(b)).length
    }, 0)
  }, [snapshot])

  const {
    mainChartImage,
    coverImage,
    oilPriceRowImage,
    referenceChartImages,
    onMainChartImageReady,
    onCoverImageReady,
    onOilPriceRowImageReady,
    onReferenceChartImageReady,
    resetImages,
  } = useChartImageStore(referenceChartCount)

  const newsFlowProps = getNewsFlowProps(snapshot)
  const suppressNewsFlowChartUi = useMemo(() => shouldSuppressNewsFlowChartUi(snapshot), [snapshot])
  const hasMainChartData =
    (newsFlowProps.chartData.timestamps?.length ?? 0) > 0 ||
    newsFlowProps.chartData.series?.some((s) => (s.values?.length ?? 0) > 0) ||
    false
  const refsForReady = snapshot ? getOrderedReferenceSections(snapshot) : []
  const hasReferenceChartData = refsForReady.some((sec) => {
    if (isReferenceSectionRemoved(sec)) return false
    return getReferenceContentBlocks(sec).some((b) => {
      if (b.type !== 'CHART' || isReferenceBlockRemoved(b)) return false
      const c = getBlockFields<{
        timestamps?: number[]
        series?: { values?: number[] }[]
      }>(b)
      const hasTs = (c?.timestamps?.length ?? 0) > 0
      const hasSeries = c?.series?.some((s) => (s.values?.length ?? 0) > 0) ?? false
      return hasTs || hasSeries
    })
  })
  const hasChartsToRender = hasReferenceChartData || hasMainChartData
  const titleProps = getTitleProps(snapshot)
  const hasTitleOilPriceRow =
    titleProps.priceChangeFrom !== undefined &&
    titleProps.priceChangeTo !== undefined &&
    Number.isFinite(titleProps.priceChangeFrom) &&
    Number.isFinite(titleProps.priceChangeTo)

  const isReadyForEmail =
    !!snapshot &&
    (!hasChartsToRender || !hasMainChartData || mainChartImage.length > 0) &&
    (!hasTitleOilPriceRow || oilPriceRowImage.length > 0)

  useEffect(() => {
    delete document.body.dataset.captureReady
    delete document.body.dataset.captureError
    captureDoneRef.current = false
    globalThis.__mailContents = undefined

    const rawToken = searchParams.get('token')?.trim()
    if (!rawToken) {
      setLoadError('token 쿼리가 필요합니다.')
      document.body.dataset.captureError = 'missing_token'
      return undefined
    }

    let cancelled = false
    ;(async () => {
      try {
        const snap = await fetchInternalNewsletterRenderData(rawToken)
        if (cancelled) return
        if (!snap?.sections) {
          setLoadError('스냅샷 데이터가 없습니다.')
          document.body.dataset.captureError = 'no_snapshot'
          return
        }
        setSnapshot(snap)
        setLoadError(null)
        resetImages()
      } catch {
        if (cancelled) return
        setLoadError('데이터를 불러오지 못했습니다.')
        document.body.dataset.captureError = 'fetch_failed'
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, resetImages])

  const runCapture = useCallback(async () => {
    if (!snapshot || !isReadyForEmail || captureDoneRef.current) return
    captureDoneRef.current = true
    try {
      const chartImage = suppressNewsFlowChartUi ? null : (
        <img src={mainChartImage} alt="flow chart" width={800} style={{ display: 'block', width: '800px', border: 0 }} />
      )
      const htmlWithBase64 = await renderEmailContent(
        snapshot,
        chartImage,
        referenceChartImages,
        coverImage || undefined,
        oilPriceRowImage || undefined,
      )
      const { htmlContent, images } = convertBase64ImagesToMailCapturePayload(htmlWithBase64)
      globalThis.__mailContents = {
        htmlBody: prepareNewsletterEmailHtml(htmlContent),
        images,
      }
      document.body.dataset.captureReady = 'true'
    } catch {
      document.body.dataset.captureError = 'render_failed'
    }
  }, [
    snapshot,
    isReadyForEmail,
    mainChartImage,
    referenceChartImages,
    coverImage,
    oilPriceRowImage,
    renderEmailContent,
    suppressNewsFlowChartUi,
  ])

  useEffect(() => {
    if (isReadyForEmail) void runCapture()
  }, [isReadyForEmail, runCapture])

  if (loadError) {
    return (
      <Box p={4}>
        <Typography color="error">{loadError}</Typography>
      </Box>
    )
  }

  if (!snapshot) {
    return (
      <Box p={4}>
        <Typography>로딩 중…</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'absolute', left: -9999, top: 0, width: 800 }}>
      <NewsletterView
        snapshot={snapshot}
        onMainChartImageReady={onMainChartImageReady}
        referenceChartImages={referenceChartImages}
        onReferenceChartImageReady={onReferenceChartImageReady}
        onCoverImageReady={onCoverImageReady}
        onOilPriceRowImageReady={onOilPriceRowImageReady}
      />
    </Box>
  )
}

export default NewsletterRenderPage
