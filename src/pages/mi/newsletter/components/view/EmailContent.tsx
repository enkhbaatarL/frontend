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
import ChangedLabel from '@/pages/mi/newsletter/components/view/ChangedLabel'
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
} from '@/pages/mi/newsletter/utils/snapshotUtils'

const sectionOrderReordered = (diffOverrides: DiffOverrides | undefined, sectionId: string): boolean =>
  !!diffOverrides?.sectionOrderChangedSectionIds?.includes(sectionId)

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
}

/**
 * Outlook(Word 렌더링 엔진) 호환 이메일 템플릿.
 * 순수 HTML table 기반. @react-email/render -> HTML 문서로 변환.
 */
/** 섹션 `code`(및 참고 섹션 판별) → 이메일 템플릿 분기 */
const getSectionTemplateKind = (section: INewsletterSnapshotSection) => newsletterSectionToEmailTemplateKind(section)

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
}: EmailContentProps) => {
  const orderedReferenceSections = getOrderedReferenceSections(snapshot)
  const orderedSections = getSectionsInOrder(snapshot)
  const { marketOpenTime, marketCloseTime } = getMarketTimes(snapshot)
  const orderTag = (sectionId: string) => sectionOrderReordered(diffOverrides, sectionId)

  const sectionsToRender = orderedSections

  let flatChartStart = 0

  const renderSection = (section: INewsletterSnapshotSection) => {
    const type = getSectionTemplateKind(section)

    if (type === 'COVER') {
      if (tempHideCover) return null
      const coverProps = getCoverProps(snapshot, section)
      const coverContentDiff = !!(diffOverrides?.name || diffOverrides?.description)
      return (
        <tr key={section.id}>
          <td id={`section-cover-${section.id}`} style={{ paddingBottom: '38px', position: 'relative' }}>
            {coverContentDiff && <ChangedLabel diffHtmls={[diffOverrides?.name, diffOverrides?.description]} />}
            {!coverContentDiff && orderTag(section.id) && <ChangedLabel labelKind="reordered" />}
            <Cover
              image={coverProps.imageBase64}
              frequency={coverProps.frequency}
              name={coverProps.name}
              description={coverProps.description}
              coverImage={coverImage}
              showImage={coverProps.showImage}
              nameDiffHtml={diffOverrides?.name}
              descriptionDiffHtml={diffOverrides?.description}
            />
          </td>
        </tr>
      )
    }

    if (type === 'DATE_ISSUE') {
      const dateIssueProps = getDateIssueProps(snapshot, section)
      const dateRowDiff = !!diffOverrides?.date
      return (
        <tr key={section.id}>
          <td id={`section-dateAndIssue-${section.id}`} style={{ padding: 0, position: 'relative' }}>
            {dateRowDiff && <ChangedLabel diffHtmls={[diffOverrides?.date]} />}
            {!dateRowDiff && orderTag(section.id) && <ChangedLabel labelKind="reordered" />}
            <DateAndIssue date={dateIssueProps.date} dateDiffHtml={diffOverrides?.date} />
          </td>
        </tr>
      )
    }

    if (type === 'TITLE') {
      const titleProps = getTitleProps(snapshot, section)
      return (
        <tr key={section.id}>
          <td
            id={`section-title-${section.id}`}
            style={{ paddingBottom: '38px', position: 'relative', ...({ msoPaddingAlt: '0 0 19px 0' } as CSSProperties) }}
          >
            {(diffOverrides?.title || diffOverrides?.subtitle) && (
              <ChangedLabel diffHtmls={[diffOverrides?.title, diffOverrides?.subtitle]} top="42px" />
            )}
            {!(diffOverrides?.title || diffOverrides?.subtitle) && !diffOverrides?.titleOilPrice && orderTag(section.id) && (
              <ChangedLabel labelKind="reordered" top="42px" />
            )}
            <TitleAndOilPrice
              title={titleProps.title}
              subtitle={titleProps.subtitle}
              priceChangeFrom={titleProps.priceChangeFrom}
              priceChangeTo={titleProps.priceChangeTo}
              oilPriceRowImage={oilPriceRowImage}
              titleDiffHtml={diffOverrides?.title}
              subtitleDiffHtml={diffOverrides?.subtitle}
              oilPriceRowDiffHtml={diffOverrides?.titleOilPrice}
            />
          </td>
        </tr>
      )
    }

    if (type === 'SUMMARY') {
      const summaryProps = getSummaryProps(snapshot, section)
      return (
        <tr key={section.id}>
          <td id={`section-summary-${section.id}`} style={{ paddingBottom: '38px', position: 'relative' }}>
            {diffOverrides?.summary && <ChangedLabel diffHtmls={[diffOverrides?.summary]} top="10px" />}
            {!diffOverrides?.summary && orderTag(section.id) && <ChangedLabel labelKind="reordered" top="10px" />}
            <Summary summary={summaryProps.summary} summaryDiffHtml={diffOverrides?.summary} />
          </td>
        </tr>
      )
    }

    if (type === 'SECTION' || type === 'NEWS_FLOW' || type === 'SIG_NEWS') {
      return null
    }

    if (type === 'USER_CUSTOM') {
      const refIndex = orderedReferenceSections.findIndex((r) => r.id === section.id)
      if (refIndex < 0) return null
      const refSection = orderedReferenceSections[refIndex]!

      const hasReferenceDiff = !!diffOverrides?.referenceTitles?.[refIndex] || !!diffOverrides?.referenceDescriptions?.[refIndex]
      return (
        <tr key={section.id}>
          <td id={`section-user-custom-${refIndex}`} style={{ paddingBottom: '38px', position: 'relative' }}>
            {hasReferenceDiff && (
              <ChangedLabel
                diffHtmls={[diffOverrides?.referenceTitles?.[refIndex], diffOverrides?.referenceDescriptions?.[refIndex]]}
                top="12px"
              />
            )}
            {!hasReferenceDiff && orderTag(refSection.id) && <ChangedLabel labelKind="reordered" top="12px" />}
            <UserCustom
              section={refSection}
              titleDiffHtml={diffOverrides?.referenceTitles?.[refIndex]}
              descriptionDiffHtml={diffOverrides?.referenceDescriptions?.[refIndex]}
              showRemovedBlocks={includeRemovedNewsFlowItems}
              blockChanges={diffOverrides?.referenceBlockChanges?.[refIndex]}
            />
          </td>
        </tr>
      )
    }

    if (type === 'REFERENCE') {
      const refIndex = orderedReferenceSections.findIndex((r) => r.id === section.id)
      if (refIndex < 0) return null
      const refSection = orderedReferenceSections[refIndex]!
      const chartCount = getReferenceContentBlocks(refSection).filter(
        (b) => b.type === 'CHART' && b.visibility && !isReferenceBlockRemoved(b),
      ).length
      const chartImages = referenceChartImages?.slice(flatChartStart, flatChartStart + chartCount) ?? []
      const prevFlatStart = flatChartStart
      flatChartStart += chartCount

      const hasReferenceDiff = !!diffOverrides?.referenceTitles?.[refIndex] || !!diffOverrides?.referenceDescriptions?.[refIndex]
      return (
        <tr key={section.id}>
          <td id={`section-reference-${refIndex}`} style={{ paddingBottom: '38px', position: 'relative' }}>
            {hasReferenceDiff && (
              <ChangedLabel
                diffHtmls={[diffOverrides?.referenceTitles?.[refIndex], diffOverrides?.referenceDescriptions?.[refIndex]]}
                top="12px"
              />
            )}
            {!hasReferenceDiff && orderTag(refSection.id) && <ChangedLabel labelKind="reordered" top="12px" />}
            <Reference
              section={refSection}
              marketOpenTime={marketOpenTime}
              marketCloseTime={marketCloseTime}
              chartImages={chartImages}
              flatChartStartIndex={prevFlatStart}
              onReferenceChartImageReady={onReferenceChartImageReady}
              useLiveChart={useLiveChart}
              titleDiffHtml={diffOverrides?.referenceTitles?.[refIndex]}
              descriptionDiffHtml={diffOverrides?.referenceDescriptions?.[refIndex]}
              showRemovedBlocks={includeRemovedNewsFlowItems}
              blockChanges={diffOverrides?.referenceBlockChanges?.[refIndex]}
            />
          </td>
        </tr>
      )
    }

    if (type === 'FOOTER') {
      const footerProps = getFooterProps(snapshot, section)
      return (
        <tr key={section.id}>
          <td id={`section-footer-${section.id}`} style={{ position: 'relative' }}>
            {orderTag(section.id) && <ChangedLabel labelKind="reordered" top="8px" />}
            <Footer footerContent={footerProps.footerContent} showLogo={footerProps.showLogo} />
          </td>
        </tr>
      )
    }

    return null
  }

  return (
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
        {sectionsToRender.map((section) => {
          const type = getSectionTemplateKind(section)
          if (type === 'SECTION' || type === 'NEWS_FLOW' || type === 'SIG_NEWS') {
            const newsFlowProps = getNewsFlowProps(snapshot, section)
            const newsFlowListItems = includeRemovedNewsFlowItems
              ? newsFlowProps.newsEventItems
              : filterVisibleNewsFlowItems(newsFlowProps.newsEventItems.filter((i) => i.visibility !== false))
            const newsFlowRows = includeRemovedNewsFlowItems
              ? newsFlowListItems
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => {
                  if (item.removed !== true && item.visibility !== false) return true
                  return diffOverrides?.relatedNewsItemChanges?.[item.newsId]?.kind === 'deleted'
                })
              : newsFlowListItems.map((item, index) => ({ item, index }))
            const showFlowChartRow = type === 'SECTION' || (type === 'NEWS_FLOW' && newsFlowSectionHasChartBlock(section))
            const sectionFlowDomId = type === 'SIG_NEWS' ? `section-sigNews-${section.id}` : `section-newsFlow-${section.id}`
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
                    {(diffOverrides?.newsFlowChartTitle || diffOverrides?.newsFlowChartAggregationTime) && (
                      <ChangedLabel
                        diffHtmls={[diffOverrides?.newsFlowChartTitle, diffOverrides?.newsFlowChartAggregationTime]}
                        top="12px"
                      />
                    )}
                    {!(diffOverrides?.newsFlowChartTitle || diffOverrides?.newsFlowChartAggregationTime) && orderTag(section.id) && (
                      <ChangedLabel labelKind="reordered" top="12px" />
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
                          const itemChange = diffOverrides?.relatedNewsItemChanges?.[item.newsId]
                          const isRemoved = itemChange?.kind === 'deleted'
                          const hasRelatedNewsDiff =
                            !!itemChange?.titleDiffHtml ||
                            !!itemChange?.contentDiffHtml ||
                            !!diffOverrides?.relatedNewsTitles?.[origIndex] ||
                            !!diffOverrides?.relatedNewsContents?.[origIndex]
                          return (
                            <tr key={item.newsId}>
                              <td
                                style={{
                                  borderBottom: '1px solid #DEE2E6',
                                  position: 'relative',
                                }}
                              >
                                {isRemoved && <ChangedLabel labelKind="deleted" top="22px" />}
                                {!isRemoved && itemChange && (
                                  <ChangedLabel
                                    labelKind={itemChange.kind}
                                    diffHtmls={[itemChange.titleDiffHtml, itemChange.contentDiffHtml]}
                                    top="22px"
                                  />
                                )}
                                {!isRemoved && !itemChange && hasRelatedNewsDiff && (
                                  <ChangedLabel
                                    diffHtmls={[
                                      diffOverrides?.relatedNewsTitles?.[origIndex],
                                      diffOverrides?.relatedNewsContents?.[origIndex],
                                    ]}
                                    top="22px"
                                  />
                                )}
                                <RelatedNews
                                  item={item}
                                  titleDiffHtml={itemChange?.titleDiffHtml ?? diffOverrides?.relatedNewsTitles?.[origIndex]}
                                  contentDiffHtml={itemChange?.contentDiffHtml ?? diffOverrides?.relatedNewsContents?.[origIndex]}
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
      />
    </div>
  ),
)

EmailContent.displayName = 'EmailContent'

export default EmailContent
