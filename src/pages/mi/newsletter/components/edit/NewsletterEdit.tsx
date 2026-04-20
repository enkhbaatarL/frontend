import { Box, Stack } from '@mui/material'
import React, { useCallback, useMemo } from 'react'

import type { BlockOrderProps } from '@/pages/mi/newsletter/components/edit/sections/Block'
import type { NewsletterEditSnapshotSaveValidationIssue } from '@/pages/mi/newsletter/utils/snapshotUtils'

import CoverSection from '@/pages/mi/newsletter/components/edit/sections/CoverSection'
import DateAndIssueSection from '@/pages/mi/newsletter/components/edit/sections/DateAndIssueSection'
import FooterSection from '@/pages/mi/newsletter/components/edit/sections/FooterSection'
import NewsFlowSection from '@/pages/mi/newsletter/components/edit/sections/NewsFlowSection'
import ReferenceSection from '@/pages/mi/newsletter/components/edit/sections/ReferenceSection'
import SigNewsSection from '@/pages/mi/newsletter/components/edit/sections/SigNewsSection'
import SummarySection from '@/pages/mi/newsletter/components/edit/sections/SummarySection'
import TitleSection from '@/pages/mi/newsletter/components/edit/sections/TitleSection'
import UserCustomSection, { UserCustomSectionAddToolbar } from '@/pages/mi/newsletter/components/edit/sections/UserCustomSection'
import { useUserCustomSections } from '@/pages/mi/newsletter/hooks/useUserCustomSections'
import {
  findFirstSectionByCanonicalCode,
  findFirstNewsFlowSection,
  findFirstSigNewsSection,
  getCoverProps,
  getDateIssueProps,
  getEditorSectionOrderKeysFromSnapshot,
  getFirstNewsCardBlockFieldDefs,
  getFooterProps,
  getMarketTimes,
  getNewsFlowProps,
  getSummaryProps,
  getTitleProps,
  isUserAddedReferenceSection,
  NEWSLETTER_SECTION_CODE,
  newsletterEditAnchorDomId,
  reorderSnapshotByEditorKeys,
  shouldSuppressNewsFlowChartUi,
  isNewsFlowTimeSortedSectionCode,
  type ReferenceContentBlockPatch,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import { type INewsletterIssueSnapshotData, type INewsletterSnapshotSection, type IRelatedNewsEventItem } from '@/service/mi/newsletter'

const COVER_SECTION_KEY = NEWSLETTER_SECTION_CODE.COVER
const FOOTER_SECTION_KEY = NEWSLETTER_SECTION_CODE.FOOTER

export type NewsletterEditProps = {
  snapshot: INewsletterIssueSnapshotData | null
  validationIssues?: NewsletterEditSnapshotSaveValidationIssue[]
  onMainChartImageReady?: (image: string) => void
  onRelatedNewsChange?: (items: IRelatedNewsEventItem[]) => void
  onTitleChange?: (value?: string) => void
  onSubtitleChange?: (value?: string) => void
  onPriceChangeFromChange?: (value?: string) => void
  onPriceChangeToChange?: (value?: string) => void
  onSummaryChange?: (value?: string) => void
  onNameChange?: (value?: string) => void
  onDescriptionChange?: (value?: string) => void
  onCoverShowImageChange?: (show: boolean) => void
  onNewsFlowTitleChange?: (value?: string) => void
  onNewsFlowAggregationTimeChange?: (value?: string) => void
  /** 사용자 추가 섹션(스냅샷 Reference 구간) 전체 */
  onReferencesChange?: (referenceSections: INewsletterSnapshotSection[]) => void
  onReferenceChartImageReady?: (index: number, image: string) => void
  onSnapshotReorder?: (snapshot: INewsletterIssueSnapshotData) => void
  onFooterContentChange?: (value?: string) => void
  onFooterShowLogoChange?: (show: boolean) => void
  onSectionVisibilityChange?: (sectionId: string, visible: boolean) => void
  /** 차트 뉴스 박스 드래그를 놓은 뒤(또는 위치 리셋 후) 스냅샷에 좌표 반영 */
  onBoxPositionDragEnd?: () => void
  /** 플로우 차트 편집 모달이 열린 동안 본문 인라인 차트는 플레이스홀더만 표시 */
  flowChartEditModalOpen?: boolean
}

const NewsletterEdit = ({
  snapshot,
  validationIssues,
  onMainChartImageReady,
  onRelatedNewsChange,
  onTitleChange,
  onSubtitleChange,
  onPriceChangeFromChange,
  onPriceChangeToChange,
  onSummaryChange,
  onNameChange,
  onDescriptionChange,
  onCoverShowImageChange,
  onNewsFlowTitleChange,
  onNewsFlowAggregationTimeChange,
  onReferencesChange,
  onReferenceChartImageReady,
  onSnapshotReorder,
  onFooterContentChange,
  onFooterShowLogoChange,
  onSectionVisibilityChange,
  onBoxPositionDragEnd,
  flowChartEditModalOpen = false,
}: NewsletterEditProps) => {
  const suppressNewsFlowChartUi = useMemo(() => shouldSuppressNewsFlowChartUi(snapshot), [snapshot])
  const missingRequiredPaths = useMemo(
    () => new Set((validationIssues ?? []).filter((i) => i.kind === 'MISSING_REQUIRED').map((i) => i.path)),
    [validationIssues],
  )

  const hasAnyMissingRequiredWithPrefix = useCallback(
    (prefix: string) => {
      // Prefix match is intentionally loose to avoid coupling to every exact path format.
      for (const p of missingRequiredPaths) {
        if (p === prefix || p.startsWith(`${prefix}.`) || p.startsWith(`${prefix}[`)) return true
      }
      return false
    },
    [missingRequiredPaths],
  )

  const {
    referenceSections,
    pushReferenceSnapshot,
    updateReferenceFieldsById,
    updateReferenceSectionVisibilityById,
    deleteReferenceBySectionId,
    patchContentBlockByIndex,
    deleteContentBlockByIndex,
    reorderContentBlocksById,
    getFlatChartIndexBySectionId,
    appendReferenceContentBlock,
  } = useUserCustomSections({ snapshot, onReferencesChange })

  const sectionOrder = useMemo(() => {
    const keys = getEditorSectionOrderKeysFromSnapshot(snapshot)
    const middle = keys.filter((id) => id !== COVER_SECTION_KEY && id !== FOOTER_SECTION_KEY)
    return [COVER_SECTION_KEY, ...middle, FOOTER_SECTION_KEY]
  }, [snapshot])

  const orderableIds = sectionOrder.filter((id) => id !== FOOTER_SECTION_KEY && id !== COVER_SECTION_KEY)

  const handleSectionOrderChange = useCallback(
    (currentId: string, targetIndex: number) => {
      if (!snapshot || !onSnapshotReorder) return
      const orderable = sectionOrder.filter((id) => id !== FOOTER_SECTION_KEY && id !== COVER_SECTION_KEY)
      const fromIndex = orderable.indexOf(currentId)
      if (fromIndex < 0 || targetIndex === fromIndex) return
      const nextOrderable = [...orderable]
      const [removed] = nextOrderable.splice(fromIndex, 1)
      nextOrderable.splice(targetIndex, 0, removed)
      const newKeys = [COVER_SECTION_KEY, ...nextOrderable, FOOTER_SECTION_KEY]
      onSnapshotReorder(reorderSnapshotByEditorKeys(snapshot, newKeys))
    },
    [snapshot, onSnapshotReorder, sectionOrder],
  )

  const getBlockOrder = useCallback(
    (sectionId: string): BlockOrderProps | undefined => {
      if (sectionId === FOOTER_SECTION_KEY || sectionId === COVER_SECTION_KEY) return undefined
      if (!onSnapshotReorder) return undefined
      return {
        siblingIds: orderableIds,
        currentId: sectionId,
        onOrderChange: (targetIndex) => handleSectionOrderChange(sectionId, targetIndex),
      }
    },
    [orderableIds, handleSectionOrderChange, onSnapshotReorder],
  )

  const coverProps = useMemo(() => getCoverProps(snapshot), [snapshot])
  const dateIssueProps = useMemo(() => getDateIssueProps(snapshot), [snapshot])
  const titleProps = useMemo(() => getTitleProps(snapshot), [snapshot])
  const summaryProps = useMemo(() => getSummaryProps(snapshot), [snapshot])
  const newsFlowProps = useMemo(() => getNewsFlowProps(snapshot), [snapshot])
  const newsFlowSection = useMemo(() => findFirstNewsFlowSection(snapshot), [snapshot])
  const sigNewsSection = useMemo(() => findFirstSigNewsSection(snapshot), [snapshot])
  const sigNewsProps = useMemo(() => (sigNewsSection ? getNewsFlowProps(snapshot, sigNewsSection) : null), [snapshot, sigNewsSection])
  const disableNewsFlowItemOrder = newsFlowSection !== undefined && isNewsFlowTimeSortedSectionCode(newsFlowSection.code)
  const disableSigNewsItemOrder = sigNewsSection !== undefined && isNewsFlowTimeSortedSectionCode(sigNewsSection.code)
  const marketTimes = useMemo(() => getMarketTimes(snapshot), [snapshot])
  const footerProps = useMemo(() => getFooterProps(snapshot), [snapshot])

  const coverSection = useMemo(
    () => (snapshot ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.COVER) : null),
    [snapshot],
  )
  const dateIssueSection = useMemo(
    () => (snapshot ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.DATE_ISSUE) : null),
    [snapshot],
  )
  const titleSection = useMemo(
    () => (snapshot ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.TITLE) : null),
    [snapshot],
  )
  const summarySection = useMemo(
    () => (snapshot ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.SUMMARY) : null),
    [snapshot],
  )
  const footerSection = useMemo(
    () => (snapshot ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.FOOTER) : null),
    [snapshot],
  )

  const handleSectionVisibility = useCallback(
    (sectionId: string | undefined, visible: boolean) => {
      if (sectionId) onSectionVisibilityChange?.(sectionId, visible)
    },
    [onSectionVisibilityChange],
  )

  const getNewsFlowItemMissingRequired = useCallback(
    (newsId: string) => hasAnyMissingRequiredWithPrefix(`NEWS_FLOW.newsEventItems[newsId=${newsId}]`),
    [hasAnyMissingRequiredWithPrefix],
  )

  const newsFlowChartData = useMemo(
    () => ({
      chartData: newsFlowProps.chartData,
      title: newsFlowProps.title,
      aggregationTime: newsFlowProps.aggregationTime,
    }),
    [newsFlowProps.chartData, newsFlowProps.title, newsFlowProps.aggregationTime],
  )

  const newsFlowCardTemplateFieldDefs = useMemo(() => getFirstNewsCardBlockFieldDefs(newsFlowSection), [newsFlowSection])

  const sigNewsCardTemplateFieldDefs = useMemo(
    () => (sigNewsSection ? getFirstNewsCardBlockFieldDefs(sigNewsSection) : undefined),
    [sigNewsSection],
  )

  const onCoverVisibility = useCallback(
    (visible: boolean) => handleSectionVisibility(coverSection?.id, visible),
    [handleSectionVisibility, coverSection?.id],
  )
  const onDateIssueVisibility = useCallback(
    (visible: boolean) => handleSectionVisibility(dateIssueSection?.id, visible),
    [handleSectionVisibility, dateIssueSection?.id],
  )
  const onTitleVisibility = useCallback(
    (visible: boolean) => handleSectionVisibility(titleSection?.id, visible),
    [handleSectionVisibility, titleSection?.id],
  )
  const onSummaryVisibility = useCallback(
    (visible: boolean) => handleSectionVisibility(summarySection?.id, visible),
    [handleSectionVisibility, summarySection?.id],
  )
  const onNewsFlowVisibility = useCallback(
    (visible: boolean) => handleSectionVisibility(newsFlowSection?.id, visible),
    [handleSectionVisibility, newsFlowSection?.id],
  )
  const onFooterVisibility = useCallback(
    (visible: boolean) => handleSectionVisibility(footerSection?.id, visible),
    [handleSectionVisibility, footerSection?.id],
  )
  const onSigNewsVisibility = useCallback(
    (visible: boolean) => handleSectionVisibility(sigNewsSection?.id, visible),
    [handleSectionVisibility, sigNewsSection?.id],
  )

  const sectionMap = useMemo(() => {
    const fixedSectionMap: Record<string, React.ReactNode> = {
      [NEWSLETTER_SECTION_CODE.COVER]: (
        <CoverSection
          key={NEWSLETTER_SECTION_CODE.COVER}
          image={coverProps.imageBase64}
          publishCycle={coverProps.publishCycle}
          name={coverProps.name}
          description={coverProps.description}
          showImage={coverProps.showImage}
          onShowImageChange={onCoverShowImageChange}
          onNameChange={onNameChange}
          onDescriptionChange={onDescriptionChange}
          showRequiredIndicator={hasAnyMissingRequiredWithPrefix('COVER')}
          sectionVisibility={coverSection?.visibility !== false}
          onSectionVisibilityChange={onCoverVisibility}
        />
      ),
      [NEWSLETTER_SECTION_CODE.DATE_ISSUE]: (
        <DateAndIssueSection
          key={NEWSLETTER_SECTION_CODE.DATE_ISSUE}
          date={dateIssueProps.date}
          blockOrder={getBlockOrder(NEWSLETTER_SECTION_CODE.DATE_ISSUE)}
          showRequiredIndicator={hasAnyMissingRequiredWithPrefix('DATE_ISSUE')}
          sectionVisibility={dateIssueSection?.visibility !== false}
          onSectionVisibilityChange={onDateIssueVisibility}
        />
      ),
      [NEWSLETTER_SECTION_CODE.TITLE]: (
        <TitleSection
          key={NEWSLETTER_SECTION_CODE.TITLE}
          title={titleProps.title}
          subtitle={titleProps.subtitle}
          priceChangeFrom={titleProps.priceChangeFrom}
          priceChangeTo={titleProps.priceChangeTo}
          onTitleChange={onTitleChange}
          onSubtitleChange={onSubtitleChange}
          onPriceChangeFromChange={onPriceChangeFromChange}
          onPriceChangeToChange={onPriceChangeToChange}
          blockOrder={getBlockOrder(NEWSLETTER_SECTION_CODE.TITLE)}
          showRequiredIndicator={hasAnyMissingRequiredWithPrefix('TITLE')}
          sectionVisibility={titleSection?.visibility !== false}
          onSectionVisibilityChange={onTitleVisibility}
        />
      ),
      [NEWSLETTER_SECTION_CODE.SUMMARY]: (
        <SummarySection
          key={NEWSLETTER_SECTION_CODE.SUMMARY}
          summary={summaryProps.summary}
          onSummaryChange={onSummaryChange}
          blockOrder={getBlockOrder(NEWSLETTER_SECTION_CODE.SUMMARY)}
          showRequiredIndicator={hasAnyMissingRequiredWithPrefix('SUMMARY')}
          sectionVisibility={summarySection?.visibility !== false}
          onSectionVisibilityChange={onSummaryVisibility}
        />
      ),
      [NEWSLETTER_SECTION_CODE.SECTION]: (
        <NewsFlowSection
          key={NEWSLETTER_SECTION_CODE.SECTION}
          chartData={newsFlowChartData}
          sectionFieldDefs={newsFlowSection?.fieldDefs}
          newsCardTemplateFieldDefs={newsFlowCardTemplateFieldDefs}
          relatedNews={newsFlowProps.newsEventItems}
          marketOpenTime={marketTimes.marketOpenTime}
          marketCloseTime={marketTimes.marketCloseTime}
          onChartImageReady={onMainChartImageReady}
          onRelatedNewsChange={onRelatedNewsChange}
          onTitleChange={onNewsFlowTitleChange}
          onAggregationTimeChange={onNewsFlowAggregationTimeChange}
          blockOrder={getBlockOrder(NEWSLETTER_SECTION_CODE.SECTION)}
          hideNewsFlowChart={suppressNewsFlowChartUi}
          disableNewsItemOrder={disableNewsFlowItemOrder}
          showRequiredIndicator={hasAnyMissingRequiredWithPrefix('NEWS_FLOW')}
          getNewsItemMissingRequired={getNewsFlowItemMissingRequired}
          sectionVisibility={newsFlowSection?.visibility !== false}
          onSectionVisibilityChange={onNewsFlowVisibility}
          onBoxPositionDragEnd={onBoxPositionDragEnd}
          flowChartEditModalOpen={flowChartEditModalOpen}
        />
      ),
      [NEWSLETTER_SECTION_CODE.FOOTER]: (
        <FooterSection
          key={NEWSLETTER_SECTION_CODE.FOOTER}
          footerContent={footerProps.footerContent || undefined}
          showLogo={footerProps.showLogo}
          onFooterContentChange={onFooterContentChange}
          onShowLogoChange={onFooterShowLogoChange}
          showRequiredIndicator={hasAnyMissingRequiredWithPrefix('FOOTER')}
          sectionVisibility={footerSection?.visibility !== false}
          onSectionVisibilityChange={onFooterVisibility}
        />
      ),
    }

    const sigNewsMap: Record<string, React.ReactNode> =
      sigNewsSection && sigNewsProps
        ? {
          [NEWSLETTER_SECTION_CODE.SIG_NEWS]: (
            <SigNewsSection
              key={NEWSLETTER_SECTION_CODE.SIG_NEWS}
              title={sigNewsProps.title}
              aggregationTime={sigNewsProps.aggregationTime}
              sectionFieldDefs={sigNewsSection.fieldDefs}
              newsCardTemplateFieldDefs={sigNewsCardTemplateFieldDefs}
              relatedNews={sigNewsProps.newsEventItems}
              onRelatedNewsChange={onRelatedNewsChange}
              onTitleChange={onNewsFlowTitleChange}
              onAggregationTimeChange={onNewsFlowAggregationTimeChange}
              blockOrder={getBlockOrder(NEWSLETTER_SECTION_CODE.SIG_NEWS)}
              disableNewsItemOrder={disableSigNewsItemOrder}
              showRequiredIndicator={hasAnyMissingRequiredWithPrefix('NEWS_FLOW')}
              getNewsItemMissingRequired={getNewsFlowItemMissingRequired}
              sectionVisibility={sigNewsSection.visibility}
              onSectionVisibilityChange={onSigNewsVisibility}
            />
          ),
        }
        : {}

    const map: Record<string, React.ReactNode> = {
      ...fixedSectionMap,
      ...sigNewsMap,
    }

    referenceSections.forEach((refSection, refIndex) => {
      if (!refSection.id || refSection.removed === true) return
      const sectionId = `ref:${refSection.id}`
      const userAdded = isUserAddedReferenceSection(refSection)
      const missingRef = hasAnyMissingRequiredWithPrefix(`REFERENCE_SECTION[id=${refSection.id}]`)
      const missingRefBlock = (blockId: string) =>
        hasAnyMissingRequiredWithPrefix(`REFERENCE_SECTION[id=${refSection.id}].blocks[id=${blockId}]`)
      const sharedBase = {
        section: refSection,
        refIndex,
        blockOrder: getBlockOrder(sectionId),
        onSectionFieldsChange: (partial: { title?: string; description?: string }) => updateReferenceFieldsById(refSection.id, partial),
        onSectionVisibilityChange: (visible: boolean) => updateReferenceSectionVisibilityById(refSection.id, visible),
        onBlockPatch: (contentBlockIndex: number, patch: ReferenceContentBlockPatch) =>
          patchContentBlockByIndex(refSection.id, contentBlockIndex, patch),
        onBlockItemDelete: onReferencesChange
          ? (contentBlockIndex: number) => deleteContentBlockByIndex(refSection.id, contentBlockIndex)
          : undefined,
        onBlockItemOrderChange: (fromIndex: number, targetIndex: number) => reorderContentBlocksById(refSection.id, fromIndex, targetIndex),
      }
      map[sectionId] = userAdded ? (
        <UserCustomSection
          key={sectionId}
          {...sharedBase}
          showRequiredIndicator={missingRef}
          getContentBlockMissingRequired={missingRefBlock}
          onDelete={onReferencesChange ? () => deleteReferenceBySectionId(refSection.id) : undefined}
          onAppendContentBlock={onReferencesChange ? (block) => appendReferenceContentBlock(refSection.id, block) : undefined}
        />
      ) : (
        <ReferenceSection
          key={sectionId}
          {...sharedBase}
          marketOpenTime={marketTimes.marketOpenTime}
          marketCloseTime={marketTimes.marketCloseTime}
          onChartImageReady={onReferenceChartImageReady}
          getFlatChartIndex={(contentBlockIndex: number) => getFlatChartIndexBySectionId(refSection.id, contentBlockIndex)}
          showRequiredIndicator={missingRef}
          getContentBlockMissingRequired={missingRefBlock}
        />
      )
    })
    return map
  }, [
    coverProps,
    dateIssueProps,
    titleProps,
    summaryProps,
    newsFlowProps.newsEventItems,
    newsFlowChartData,
    newsFlowSection,
    newsFlowCardTemplateFieldDefs,
    sigNewsSection,
    sigNewsProps,
    sigNewsCardTemplateFieldDefs,
    disableNewsFlowItemOrder,
    disableSigNewsItemOrder,
    marketTimes,
    footerProps,
    coverSection,
    dateIssueSection,
    titleSection,
    summarySection,
    footerSection,
    referenceSections,
    getBlockOrder,
    hasAnyMissingRequiredWithPrefix,
    getNewsFlowItemMissingRequired,
    updateReferenceFieldsById,
    updateReferenceSectionVisibilityById,
    deleteReferenceBySectionId,
    patchContentBlockByIndex,
    deleteContentBlockByIndex,
    reorderContentBlocksById,
    getFlatChartIndexBySectionId,
    onReferencesChange,
    appendReferenceContentBlock,
    onReferenceChartImageReady,
    onNameChange,
    onDescriptionChange,
    onCoverShowImageChange,
    onTitleChange,
    onSubtitleChange,
    onPriceChangeFromChange,
    onPriceChangeToChange,
    onSummaryChange,
    onNewsFlowTitleChange,
    onNewsFlowAggregationTimeChange,
    onMainChartImageReady,
    onRelatedNewsChange,
    onFooterContentChange,
    onFooterShowLogoChange,
    onCoverVisibility,
    onDateIssueVisibility,
    onTitleVisibility,
    onSummaryVisibility,
    onNewsFlowVisibility,
    onFooterVisibility,
    onSigNewsVisibility,
    onBoxPositionDragEnd,
    suppressNewsFlowChartUi,
    flowChartEditModalOpen,
  ])

  return (
    <Stack gap="38px">
      {sectionOrder
        .map((id) => {
          const node = sectionMap[id]
          if (!node) return null
          return (
            <Box key={id} id={newsletterEditAnchorDomId(id, snapshot)}>
              {node}
            </Box>
          )
        })
        .filter((node): node is React.ReactElement => node !== null)}
      <UserCustomSectionAddToolbar
        enabled={Boolean(onReferencesChange && snapshot)}
        referenceSections={referenceSections}
        onReplaceReferenceSections={pushReferenceSnapshot}
      />
    </Stack>
  )
}

export default NewsletterEdit
