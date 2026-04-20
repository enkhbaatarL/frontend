import React, { type CSSProperties, forwardRef, ReactNode } from 'react'

import type { DiffOverrides } from '@/pages/mi/newsletter/hooks/useDocumentDiff'
import type { INewsletterIssueSnapshotData, INewsletterSnapshotSection } from '@/service/mi/newsletter'

import Cover from '@/pages/mi/newsletter/components/emailTemplate/Cover'
import DateAndIssue from '@/pages/mi/newsletter/components/emailTemplate/DateAndIssue'
import Footer from '@/pages/mi/newsletter/components/emailTemplate/Footer'
import ItemTitle from '@/pages/mi/newsletter/components/emailTemplate/ItemTitle'
import Reference from '@/pages/mi/newsletter/components/emailTemplate/Reference'
import RelatedNews from '@/pages/mi/newsletter/components/emailTemplate/RelatedNews'
import Summary from '@/pages/mi/newsletter/components/emailTemplate/Summary'
import TitleAndOilPrice from '@/pages/mi/newsletter/components/emailTemplate/TitleAndOilPrice'
import UserCustom from '@/pages/mi/newsletter/components/emailTemplate/UserCustom'
import ChangedLabel, { type ChangedLabelFixedKind } from '@/pages/mi/newsletter/components/view/ChangedLabel'
import {
  filterVisibleNewsFlowItems,
  getCoverProps,
  getDateIssueProps,
  getFooterProps,
  getMarketTimes,
  getNewsFlowProps,
  getOrderedReferenceSections,
  getReferenceContentBlocks,
  getSectionsInOrder,
  isReferenceBlockRemoved,
  getSummaryProps,
  getTitleProps,
  newsletterSectionToEmailTemplateKind,
  newsFlowSectionHasChartBlock,
  wasNewsFlowItemRemovedInSnapshot,
} from '@/pages/mi/newsletter/utils/snapshotUtils'

const sectionOrderReordered = (diffOverrides: DiffOverrides | undefined, sectionId: string): boolean =>
  !!diffOverrides?.sectionOrderChangedSectionIds?.includes(sectionId)

/** 현재 메일 가시 목록에 있는 섹션에만 의미 있음(복원·표시). 숨김/삭제는 본문 밖 요약으로 처리 */
const sectionLifecycleLabelKind = (overrides: DiffOverrides | undefined, sectionId: string): ChangedLabelFixedKind | null => {
  if (!overrides) return null
  const rem = overrides.sectionRemovedChanges?.[sectionId]
  if (rem === 'restored') return 'sectionRestored'
  if (rem === 'removed') return 'sectionRemoved'
  const vis = overrides.sectionVisibilityChanges?.[sectionId]
  if (vis === 'shown') return 'visibilityShown'
  if (vis === 'hidden') return null
  return null
}

export type EmailContentProps = {
  snapshot: INewsletterIssueSnapshotData | null
  chartNode?: ReactNode
  referenceChartImages?: (string | undefined)[]
  useLiveChart?: boolean
  onReferenceChartImageReady?: (index: number, image: string) => void
  tempHideCover?: boolean
  coverImage?: string
  /** Title 유가 행 — 이메일 렌더 전용 캡처 이미지 */
  oilPriceRowImage?: string
  diffOverrides?: DiffOverrides
  /** true면 소프트 삭제 항목도 렌더: 뉴스 카드 `removed` + 사용자/참고 섹션 블록 `state.removed`(리비전 Diff 전용) */
  includeRemovedNewsFlowItems?: boolean
  /** 직전(또는 최초) 비교 스냅샷 — 있으면 그때도 이미 삭제된 항목은 숨김 */
  diffComparisonSnapshot?: INewsletterIssueSnapshotData | null
  /** 직전에만 메일에 보이던 섹션을 이전 스냅샷으로 렌더하고 회색 오버레이·라벨 표시 */
  showDroppedSectionGhosts?: boolean
}

/**
 * Outlook(Word 렌더링 엔진) 호환 이메일 템플릿.
 * 순수 HTML table 기반. @react-email/render -> HTML 문서로 변환.
 */
/** 섹션 `code`(및 참고 섹션 판별) → 이메일 템플릿 분기 */
const getSectionTemplateKind = (section: INewsletterSnapshotSection) => newsletterSectionToEmailTemplateKind(section)

/** diff 고스트(숨김·섹션 삭제) 본문 — 오버레이 대신 박스 전체 opacity로만 구분 */
const GHOST_SECTION_BODY_OPACITY = 0.3

const GhostSectionContentWrap = ({ ghost, children }: { ghost: boolean; children: React.ReactNode }) => {
  if (!ghost) return <>{children}</>
  return <div style={{ display: 'block', opacity: GHOST_SECTION_BODY_OPACITY }}>{children}</div>
}

const NEWS_FLOW_ITEM_LABEL_STEP = 28

/** 리비전 뉴스 카드 행 — 삭제·본문 수정·눈 아이콘 숨김 라벨을 위에서부터 쌓음 */
const NewsFlowItemDiffLabels = ({
  isRemoved,
  showContentDiff,
  relatedNewsDiffHtmls,
  showNewsItemVisibilityHidden,
}: {
  isRemoved: boolean
  showContentDiff: boolean
  relatedNewsDiffHtmls: [string | undefined, string | undefined]
  showNewsItemVisibilityHidden: boolean
}) => {
  let top = 22
  const nodes: React.ReactNode[] = []
  if (isRemoved) {
    nodes.push(<ChangedLabel key="nf-del" labelKind="deleted" top={top} />)
    top += NEWS_FLOW_ITEM_LABEL_STEP
  }
  if (showContentDiff) {
    nodes.push(<ChangedLabel key="nf-mod" diffHtmls={relatedNewsDiffHtmls} top={top} />)
    top += NEWS_FLOW_ITEM_LABEL_STEP
  }
  if (showNewsItemVisibilityHidden) {
    nodes.push(<ChangedLabel key="nf-vis-hid" labelKind="visibilityHidden" top={top} />)
  }
  return <>{nodes}</>
}

export const EmailContentTemplate = ({
  snapshot,
  chartNode,
  referenceChartImages,
  useLiveChart = false,
  tempHideCover = false,
  onReferenceChartImageReady,
  coverImage,
  oilPriceRowImage,
  diffOverrides,
  includeRemovedNewsFlowItems = false,
  diffComparisonSnapshot = null,
  showDroppedSectionGhosts = false,
}: EmailContentProps) => {
  const orderedReferenceSections = getOrderedReferenceSections(snapshot)
  const orderedSections = getSectionsInOrder(snapshot)
  const { marketOpenTime, marketCloseTime } = getMarketTimes(snapshot)
  const orderTag = (sectionId: string) => sectionOrderReordered(diffOverrides, sectionId)
  const orderPos = (sectionId: string) => {
    const p = diffOverrides?.sectionOrderChangePositions?.[sectionId]
    if (!p) return {}
    return { orderFrom: p.from, orderTo: p.to }
  }
  const screenPos = (sectionId: string) => {
    const p = diffOverrides?.sectionOrderChangeScreenPositions?.[sectionId]
    if (!p) return {}
    return { screenFrom: p.from, screenTo: p.to }
  }

  /** 직전 스냅샷과 비교할 때는 뉴스 카드 `visibility=false`(편집기 눈 숨김)도 본문에 포함 */
  const expandNewsFlowItemListForDiff = includeRemovedNewsFlowItems || !!diffComparisonSnapshot

  /** 직전 메일 가시 순서를 유지하면서, 빠진 섹션은 그 자리에 고스트로 끼워 넣음 */
  const useMergedGhostOrder = showDroppedSectionGhosts && !!diffComparisonSnapshot && !!snapshot
  const prevVisibleSections = useMergedGhostOrder ? getSectionsInOrder(diffComparisonSnapshot) : []
  const currById = new Map(orderedSections.map((s) => [s.id, s]))
  const prevVisibleIdSet = new Set(prevVisibleSections.map((s) => s.id))

  type MergedRow = { id: string; mode: 'live' | 'ghost' }
  const mergedRows: MergedRow[] = useMergedGhostOrder
    ? [
      ...prevVisibleSections.map((s) => ({
        id: s.id,
        mode: currById.has(s.id) ? ('live' as const) : ('ghost' as const),
      })),
      ...orderedSections.filter((s) => !prevVisibleIdSet.has(s.id)).map((s) => ({ id: s.id, mode: 'live' as const })),
    ]
    : orderedSections.map((s) => ({ id: s.id, mode: 'live' as const }))

  /** 병합 순회 시에도 현재 문서 기준 참고 차트 이미지 슬라이스가 맞도록 id별 오프셋 */
  const refChartLayoutBySectionId: Map<string, { start: number; count: number }> | null = useMergedGhostOrder
    ? (() => {
      const m = new Map<string, { start: number; count: number }>()
      let pos = 0
      for (const s of orderedSections) {
        if (getSectionTemplateKind(s) !== 'REFERENCE') continue
        const chartCount = getReferenceContentBlocks(s).filter(
          (b) => b.type === 'CHART' && b.visibility && !isReferenceBlockRemoved(b),
        ).length
        m.set(s.id, { start: pos, count: chartCount })
        pos += chartCount
      }
      return m
    })()
    : null

  let flatChartStart = 0

  type RenderSectionOpts = {
    /** 이전 스냅샷 등 — 기본은 현재 `snapshot` */
    dataSnapshot?: INewsletterIssueSnapshotData
    /** true면 diff·순서 라벨 없이 본문만 (고스트 블록용) */
    ghostContentOnly?: boolean
  }

  const renderSection = (section: INewsletterSnapshotSection, opts?: RenderSectionOpts) => {
    const src = opts?.dataSnapshot ?? snapshot
    const orderedRefs = opts?.dataSnapshot ? getOrderedReferenceSections(opts.dataSnapshot) : orderedReferenceSections
    const g = !!opts?.ghostContentOnly
    const type = getSectionTemplateKind(section)

    if (type === 'COVER') {
      if (tempHideCover && !g) return null
      const coverProps = getCoverProps(src, section)
      const coverContentDiff = !g && !!(diffOverrides?.name || diffOverrides?.description)
      const coverLife = !g && sectionLifecycleLabelKind(diffOverrides, section.id)
      return (
        <tr key={g ? `ghost-${section.id}` : section.id}>
          <td
            id={g ? `ghost-section-cover-${section.id}` : `section-cover-${section.id}`}
            style={{ paddingBottom: '38px', position: 'relative' }}
          >
            {coverContentDiff && <ChangedLabel diffHtmls={[diffOverrides?.name, diffOverrides?.description]} />}
            {coverLife && <ChangedLabel labelKind={coverLife} top={coverContentDiff ? '28px' : 0} />}
            {!g && orderTag(section.id) && (
              <ChangedLabel
                labelKind="reordered"
                top={coverContentDiff && coverLife ? '56px' : coverContentDiff || coverLife ? '28px' : 0}
                {...orderPos(section.id)}
                {...screenPos(section.id)}
              />
            )}
            <GhostSectionContentWrap ghost={g}>
              <Cover
                image={coverProps.imageBase64}
                frequency={coverProps.frequency}
                name={coverProps.name}
                description={coverProps.description}
                coverImage={coverImage}
                showImage={coverProps.showImage}
                nameDiffHtml={g ? undefined : diffOverrides?.name}
                descriptionDiffHtml={g ? undefined : diffOverrides?.description}
              />
            </GhostSectionContentWrap>
          </td>
        </tr>
      )
    }

    if (type === 'DATE_ISSUE') {
      const dateIssueProps = getDateIssueProps(src, section)
      const dateRowDiff = !g && !!diffOverrides?.date
      const dateLife = !g && sectionLifecycleLabelKind(diffOverrides, section.id)
      return (
        <tr key={g ? `ghost-${section.id}` : section.id}>
          <td
            id={g ? `ghost-section-dateAndIssue-${section.id}` : `section-dateAndIssue-${section.id}`}
            style={{ padding: 0, position: 'relative' }}
          >
            {dateRowDiff && <ChangedLabel diffHtmls={[diffOverrides?.date]} />}
            {dateLife && <ChangedLabel labelKind={dateLife} top={dateRowDiff ? '28px' : 0} />}
            {!g && orderTag(section.id) && (
              <ChangedLabel
                labelKind="reordered"
                top={(dateRowDiff ? 28 : 0) + (dateLife ? 22 : 0)}
                {...orderPos(section.id)}
                {...screenPos(section.id)}
              />
            )}
            <GhostSectionContentWrap ghost={g}>
              <DateAndIssue date={dateIssueProps.date} dateDiffHtml={g ? undefined : diffOverrides?.date} />
            </GhostSectionContentWrap>
          </td>
        </tr>
      )
    }

    if (type === 'TITLE') {
      const titleProps = getTitleProps(src, section)
      const titleContent = !g && !!(diffOverrides?.title || diffOverrides?.subtitle)
      const titleOil = !g && !!diffOverrides?.titleOilPrice
      const titleLife = !g && sectionLifecycleLabelKind(diffOverrides, section.id)
      return (
        <tr key={g ? `ghost-${section.id}` : section.id}>
          <td
            id={g ? `ghost-section-title-${section.id}` : `section-title-${section.id}`}
            style={{ paddingBottom: '38px', position: 'relative', ...({ msoPaddingAlt: '0 0 19px 0' } as CSSProperties) }}
          >
            {titleContent && <ChangedLabel diffHtmls={[diffOverrides?.title, diffOverrides?.subtitle]} top="42px" />}
            {titleLife && <ChangedLabel labelKind={titleLife} top={titleContent ? '74px' : '8px'} />}
            {!g && !titleContent && !titleOil && orderTag(section.id) && (
              <ChangedLabel labelKind="reordered" top={titleLife ? '34px' : '42px'} {...orderPos(section.id)} {...screenPos(section.id)} />
            )}
            {!g && titleContent && orderTag(section.id) && (
              <ChangedLabel labelKind="reordered" top={titleLife ? '102px' : '76px'} {...orderPos(section.id)} {...screenPos(section.id)} />
            )}
            <GhostSectionContentWrap ghost={g}>
              <TitleAndOilPrice
                title={titleProps.title}
                subtitle={titleProps.subtitle}
                priceChangeFrom={titleProps.priceChangeFrom}
                priceChangeTo={titleProps.priceChangeTo}
                oilPriceRowImage={oilPriceRowImage}
                titleDiffHtml={g ? undefined : diffOverrides?.title}
                subtitleDiffHtml={g ? undefined : diffOverrides?.subtitle}
                oilPriceRowDiffHtml={g ? undefined : diffOverrides?.titleOilPrice}
              />
            </GhostSectionContentWrap>
          </td>
        </tr>
      )
    }

    if (type === 'SUMMARY') {
      const summaryProps = getSummaryProps(src, section)
      const sumLife = !g && sectionLifecycleLabelKind(diffOverrides, section.id)
      const sumDiff = !g && !!diffOverrides?.summary
      return (
        <tr key={g ? `ghost-${section.id}` : section.id}>
          <td
            id={g ? `ghost-section-summary-${section.id}` : `section-summary-${section.id}`}
            style={{ paddingBottom: '38px', position: 'relative' }}
          >
            {sumDiff && <ChangedLabel diffHtmls={[diffOverrides?.summary]} top="10px" />}
            {sumLife && <ChangedLabel labelKind={sumLife} top={sumDiff ? '36px' : '10px'} />}
            {!g && orderTag(section.id) && (
              <ChangedLabel
                labelKind="reordered"
                top={sumDiff && sumLife ? 58 : sumDiff ? 38 : sumLife ? 32 : 10}
                {...orderPos(section.id)}
                {...screenPos(section.id)}
              />
            )}
            <GhostSectionContentWrap ghost={g}>
              <Summary summary={summaryProps.summary} summaryDiffHtml={g ? undefined : diffOverrides?.summary} />
            </GhostSectionContentWrap>
          </td>
        </tr>
      )
    }

    if (type === 'SECTION' || type === 'NEWS_FLOW' || type === 'SIG_NEWS') {
      if (!g) return null
      const newsFlowProps = getNewsFlowProps(src, section)
      const newsFlowListItems = expandNewsFlowItemListForDiff
        ? newsFlowProps.newsEventItems
        : filterVisibleNewsFlowItems(newsFlowProps.newsEventItems.filter((i) => i.visibility !== false))
      const newsFlowRows =
        expandNewsFlowItemListForDiff && diffComparisonSnapshot
          ? newsFlowListItems
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => !item.removed || !wasNewsFlowItemRemovedInSnapshot(diffComparisonSnapshot, section.id, item.newsId))
          : newsFlowListItems.map((item, index) => ({ item, index }))
      const sectionFlowDomId = type === 'SIG_NEWS' ? `ghost-section-sigNews-${section.id}` : `ghost-section-newsFlow-${section.id}`
      return (
        <React.Fragment key={`ghost-nf-${section.id}`}>
          <tr>
            <td
              id={sectionFlowDomId}
              style={{
                paddingTop: '12px',
                paddingBottom: '24px',
                position: 'relative',
                ...({ msoPaddingAlt: '6px 0 12px 0' } as CSSProperties),
              }}
            >
              <GhostSectionContentWrap ghost>
                <ItemTitle title={newsFlowProps.title} subtitle={newsFlowProps.aggregationTime} />
              </GhostSectionContentWrap>
            </td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '38px' }}>
              <GhostSectionContentWrap ghost>
                <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse', width: '800px' }}>
                  <tbody>
                    {newsFlowRows.map(({ item }) => (
                      <tr key={item.newsId}>
                        <td style={{ borderBottom: '1px solid #DEE2E6', position: 'relative' }}>
                          <NewsFlowItemDiffLabels
                            isRemoved={item.removed === true}
                            showContentDiff={false}
                            relatedNewsDiffHtmls={[undefined, undefined]}
                            showNewsItemVisibilityHidden={expandNewsFlowItemListForDiff && item.visibility === false}
                          />
                          <RelatedNews item={item} visualRemoved={item.removed === true} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GhostSectionContentWrap>
            </td>
          </tr>
        </React.Fragment>
      )
    }

    if (type === 'USER_CUSTOM') {
      const refIndex = orderedRefs.findIndex((r) => r.id === section.id)
      if (refIndex < 0) return null
      const refSection = orderedRefs[refIndex]!

      const hasReferenceDiff = !g && (!!diffOverrides?.referenceTitles?.[refIndex] || !!diffOverrides?.referenceDescriptions?.[refIndex])
      const refLife = !g && sectionLifecycleLabelKind(diffOverrides, refSection.id)
      return (
        <tr key={g ? `ghost-${section.id}` : section.id}>
          <td
            id={g ? `ghost-section-user-custom-${refIndex}` : `section-user-custom-${refIndex}`}
            style={{ paddingBottom: '38px', position: 'relative' }}
          >
            {hasReferenceDiff && (
              <ChangedLabel
                diffHtmls={[diffOverrides?.referenceTitles?.[refIndex], diffOverrides?.referenceDescriptions?.[refIndex]]}
                top="12px"
              />
            )}
            {refLife && <ChangedLabel labelKind={refLife} top={hasReferenceDiff ? '40px' : '12px'} />}
            {!g && orderTag(refSection.id) && (
              <ChangedLabel
                labelKind="reordered"
                top={hasReferenceDiff && refLife ? '68px' : hasReferenceDiff || refLife ? '40px' : '12px'}
                {...orderPos(refSection.id)}
                {...screenPos(refSection.id)}
              />
            )}
            <GhostSectionContentWrap ghost={g}>
              <UserCustom
                section={refSection}
                titleDiffHtml={g ? undefined : diffOverrides?.referenceTitles?.[refIndex]}
                descriptionDiffHtml={g ? undefined : diffOverrides?.referenceDescriptions?.[refIndex]}
                showRemovedBlocks={includeRemovedNewsFlowItems}
                diffComparisonSnapshot={diffComparisonSnapshot}
                blockChanges={g ? undefined : diffOverrides?.referenceBlockChanges?.[refIndex]}
              />
            </GhostSectionContentWrap>
          </td>
        </tr>
      )
    }

    if (type === 'REFERENCE') {
      const refIndex = orderedRefs.findIndex((r) => r.id === section.id)
      if (refIndex < 0) return null
      const refSection = orderedRefs[refIndex]!
      const chartCount = getReferenceContentBlocks(refSection).filter(
        (b) => b.type === 'CHART' && b.visibility && !isReferenceBlockRemoved(b),
      ).length
      const layout = refChartLayoutBySectionId?.get(section.id)
      let chartImages: (string | undefined)[]
      let prevFlatStart: number
      if (g) {
        chartImages = []
        prevFlatStart = 0
      } else if (layout) {
        chartImages = referenceChartImages?.slice(layout.start, layout.start + layout.count) ?? []
        prevFlatStart = layout.start
      } else {
        chartImages = referenceChartImages?.slice(flatChartStart, flatChartStart + chartCount) ?? []
        prevFlatStart = flatChartStart
        flatChartStart += chartCount
      }

      const hasReferenceDiff = !g && (!!diffOverrides?.referenceTitles?.[refIndex] || !!diffOverrides?.referenceDescriptions?.[refIndex])
      const refLifeR = !g && sectionLifecycleLabelKind(diffOverrides, refSection.id)
      return (
        <tr key={g ? `ghost-${section.id}` : section.id}>
          <td
            id={g ? `ghost-section-reference-${refIndex}` : `section-reference-${refIndex}`}
            style={{ paddingBottom: '38px', position: 'relative' }}
          >
            {hasReferenceDiff && (
              <ChangedLabel
                diffHtmls={[diffOverrides?.referenceTitles?.[refIndex], diffOverrides?.referenceDescriptions?.[refIndex]]}
                top="12px"
              />
            )}
            {refLifeR && <ChangedLabel labelKind={refLifeR} top={hasReferenceDiff ? '40px' : '12px'} />}
            {!g && orderTag(refSection.id) && (
              <ChangedLabel
                labelKind="reordered"
                top={hasReferenceDiff && refLifeR ? '68px' : hasReferenceDiff || refLifeR ? '40px' : '12px'}
                {...orderPos(refSection.id)}
                {...screenPos(refSection.id)}
              />
            )}
            <GhostSectionContentWrap ghost={g}>
              <Reference
                section={refSection}
                marketOpenTime={marketOpenTime}
                marketCloseTime={marketCloseTime}
                chartImages={chartImages}
                flatChartStartIndex={prevFlatStart}
                onReferenceChartImageReady={onReferenceChartImageReady}
                useLiveChart={useLiveChart}
                titleDiffHtml={g ? undefined : diffOverrides?.referenceTitles?.[refIndex]}
                descriptionDiffHtml={g ? undefined : diffOverrides?.referenceDescriptions?.[refIndex]}
                showRemovedBlocks={includeRemovedNewsFlowItems}
                diffComparisonSnapshot={diffComparisonSnapshot}
                blockChanges={g ? undefined : diffOverrides?.referenceBlockChanges?.[refIndex]}
              />
            </GhostSectionContentWrap>
          </td>
        </tr>
      )
    }

    if (type === 'FOOTER') {
      const footerProps = getFooterProps(src, section)
      const footLife = !g && sectionLifecycleLabelKind(diffOverrides, section.id)
      return (
        <tr key={g ? `ghost-${section.id}` : section.id}>
          <td id={g ? `ghost-section-footer-${section.id}` : `section-footer-${section.id}`} style={{ position: 'relative' }}>
            {footLife && <ChangedLabel labelKind={footLife} top="8px" />}
            {!g && orderTag(section.id) && (
              <ChangedLabel labelKind="reordered" top={footLife ? '30px' : '8px'} {...orderPos(section.id)} {...screenPos(section.id)} />
            )}
            <GhostSectionContentWrap ghost={g}>
              <Footer footerContent={footerProps.footerContent} showLogo={footerProps.showLogo} />
            </GhostSectionContentWrap>
          </td>
        </tr>
      )
    }

    return null
  }

  return (
    <>
      <table
        width="800"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        align="center"
        style={{
          borderCollapse: 'collapse',
          width: '800px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <tbody>
          {mergedRows.map(({ id, mode }) => {
            if (mode === 'ghost') {
              if (!diffComparisonSnapshot) return null
              const prevSec = diffComparisonSnapshot.sections.find((s) => s.id === id)
              if (!prevSec) return null
              const ghostKind: ChangedLabelFixedKind =
                diffOverrides?.sectionRemovedChanges?.[id] === 'removed' ? 'sectionRemoved' : 'visibilityHidden'
              const inner = renderSection(prevSec, { dataSnapshot: diffComparisonSnapshot, ghostContentOnly: true })
              if (!inner) return null
              return (
                <React.Fragment key={`ghost-slot-${id}`}>
                  <tr>
                    <td style={{ padding: '8px 0 12px', position: 'relative' }}>
                      <ChangedLabel labelKind={ghostKind} top={0} />
                    </td>
                  </tr>
                  {inner}
                </React.Fragment>
              )
            }
            const section = currById.get(id)
            if (!section) return null
            const type = getSectionTemplateKind(section)
            if (type === 'SECTION' || type === 'NEWS_FLOW' || type === 'SIG_NEWS') {
              const newsFlowProps = getNewsFlowProps(snapshot, section)
              const newsFlowListItems = expandNewsFlowItemListForDiff
                ? newsFlowProps.newsEventItems
                : filterVisibleNewsFlowItems(newsFlowProps.newsEventItems.filter((i) => i.visibility !== false))
              const newsFlowRows =
                expandNewsFlowItemListForDiff && diffComparisonSnapshot
                  ? newsFlowListItems
                    .map((item, index) => ({ item, index }))
                    .filter(
                      ({ item }) => !item.removed || !wasNewsFlowItemRemovedInSnapshot(diffComparisonSnapshot, section.id, item.newsId),
                    )
                  : newsFlowListItems.map((item, index) => ({ item, index }))
              const showFlowChartRow = type === 'SECTION' || (type === 'NEWS_FLOW' && newsFlowSectionHasChartBlock(section))
              const sectionFlowDomId = type === 'SIG_NEWS' ? `section-sigNews-${section.id}` : `section-newsFlow-${section.id}`
              const chTitleDiff = !!(diffOverrides?.newsFlowChartTitle || diffOverrides?.newsFlowChartAggregationTime)
              const nfLife = sectionLifecycleLabelKind(diffOverrides, section.id)
              return (
                <React.Fragment key={section.id}>
                  <tr>
                    <td
                      id={sectionFlowDomId}
                      style={{
                        paddingTop: '12px',
                        paddingBottom: '24px',
                        position: 'relative',
                        ...({ msoPaddingAlt: '6px 0 12px 0' } as CSSProperties),
                      }}
                    >
                      {chTitleDiff && (
                        <ChangedLabel
                          diffHtmls={[diffOverrides?.newsFlowChartTitle, diffOverrides?.newsFlowChartAggregationTime]}
                          top="12px"
                        />
                      )}
                      {nfLife && <ChangedLabel labelKind={nfLife} top={chTitleDiff ? '40px' : '12px'} />}
                      {orderTag(section.id) && (
                        <ChangedLabel
                          labelKind="reordered"
                          top={chTitleDiff && nfLife ? '68px' : chTitleDiff || nfLife ? '40px' : '12px'}
                          {...orderPos(section.id)}
                          {...screenPos(section.id)}
                        />
                      )}
                      <ItemTitle
                        title={newsFlowProps.title}
                        subtitle={newsFlowProps.aggregationTime}
                        titleDiffHtml={diffOverrides?.newsFlowChartTitle}
                        subtitleDiffHtml={diffOverrides?.newsFlowChartAggregationTime}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: '38px' }}>
                      <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse', width: '800px' }}>
                        <tbody>
                          {showFlowChartRow && (
                            <tr>
                              <td id={`newsletter-chart-section-${section.id}`} style={{ paddingBottom: '24px', position: 'relative' }}>
                                {diffOverrides?.newsFlowChartGraphModified && <ChangedLabel labelKind="modified" top="4px" />}
                                <table
                                  cellPadding={0}
                                  cellSpacing={0}
                                  border={0}
                                  width="800"
                                  style={{
                                    borderCollapse: 'collapse',
                                    width: '800px',
                                    background: '#FFFFFF',
                                  }}
                                >
                                  <tbody>
                                    <tr>
                                      <td
                                        style={{
                                          fontSize: 0,
                                          lineHeight: 0,
                                          padding: 0,
                                          ...({
                                            msoLineHeightRule: 'exactly',
                                            msoLineHeightAlt: '0px',
                                            msoPaddingAlt: '0 0 0 0',
                                          } as CSSProperties),
                                        }}
                                      >
                                        {chartNode}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                          {newsFlowRows.map(({ item, index: origIndex }) => {
                            const isRemoved = item.removed === true
                            const hasRelatedNewsDiff =
                              !!diffOverrides?.relatedNewsTitles?.[origIndex] || !!diffOverrides?.relatedNewsContents?.[origIndex]
                            return (
                              <tr key={item.newsId}>
                                <td
                                  style={{
                                    borderBottom: '1px solid #DEE2E6',
                                    position: 'relative',
                                  }}
                                >
                                  <NewsFlowItemDiffLabels
                                    isRemoved={isRemoved}
                                    showContentDiff={!isRemoved && hasRelatedNewsDiff}
                                    relatedNewsDiffHtmls={[
                                      diffOverrides?.relatedNewsTitles?.[origIndex],
                                      diffOverrides?.relatedNewsContents?.[origIndex],
                                    ]}
                                    showNewsItemVisibilityHidden={expandNewsFlowItemListForDiff && item.visibility === false}
                                  />
                                  <RelatedNews
                                    item={item}
                                    titleDiffHtml={diffOverrides?.relatedNewsTitles?.[origIndex]}
                                    contentDiffHtml={diffOverrides?.relatedNewsContents?.[origIndex]}
                                    visualRemoved={isRemoved}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </React.Fragment>
              )
            }
            return renderSection(section)
          })}
        </tbody>
      </table>
    </>
  )
}

const EmailContent = forwardRef<HTMLDivElement, EmailContentProps>(
  (
    {
      snapshot,
      chartNode,
      referenceChartImages,
      useLiveChart,
      tempHideCover,
      onReferenceChartImageReady,
      coverImage,
      oilPriceRowImage,
      diffOverrides,
      includeRemovedNewsFlowItems,
      diffComparisonSnapshot,
      showDroppedSectionGhosts,
    },
    ref,
  ) => (
    <div ref={ref}>
      <EmailContentTemplate
        snapshot={snapshot}
        chartNode={chartNode}
        referenceChartImages={referenceChartImages}
        useLiveChart={useLiveChart}
        tempHideCover={tempHideCover}
        onReferenceChartImageReady={onReferenceChartImageReady}
        coverImage={coverImage}
        oilPriceRowImage={oilPriceRowImage}
        diffOverrides={diffOverrides}
        includeRemovedNewsFlowItems={includeRemovedNewsFlowItems}
        diffComparisonSnapshot={diffComparisonSnapshot}
        showDroppedSectionGhosts={showDroppedSectionGhosts}
      />
    </div>
  ),
)

EmailContent.displayName = 'EmailContent'

export default EmailContent
