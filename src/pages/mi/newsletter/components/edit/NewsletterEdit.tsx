import { Box, Stack } from '@mui/material'
import React, { useCallback, useMemo } from 'react'

import type { BlockOrderProps } from '@/pages/mi/newsletter/components/edit/sections/Block'

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
}

const NewsletterEdit = ({
  snapshot,
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
}: NewsletterEditProps) => {
  const suppressNewsFlowChartUi = useMemo(() => shouldSuppressNewsFlowChartUi(snapshot), [snapshot])

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

  const sectionMap = useMemo(() => {
    const coverProps = getCoverProps(snapshot)
    const dateIssueProps = getDateIssueProps(snapshot)
    const titleProps = getTitleProps(snapshot)
    const summaryProps = getSummaryProps(snapshot)
    const newsFlowProps = getNewsFlowProps(snapshot)
    const newsFlowSection = findFirstNewsFlowSection(snapshot)
    const sigNewsSection = findFirstSigNewsSection(snapshot)
    const sigNewsProps = sigNewsSection ? getNewsFlowProps(snapshot, sigNewsSection) : null
    const disableNewsFlowItemOrder = newsFlowSection !== undefined && isNewsFlowTimeSortedSectionCode(newsFlowSection.code)
    const disableSigNewsItemOrder = sigNewsSection !== undefined && isNewsFlowTimeSortedSectionCode(sigNewsSection.code)
    const { marketOpenTime, marketCloseTime } = getMarketTimes(snapshot)
    const footerProps = getFooterProps(snapshot)

    const coverSection = snapshot ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.COVER) : null
    const dateIssueSection = snapshot ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.DATE_ISSUE) : null
    const titleSection = snapshot ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.TITLE) : null
    const summarySection = snapshot ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.SUMMARY) : null
    const footerSection = snapshot ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.FOOTER) : null

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
          sectionVisibility={coverSection?.visibility !== false}
          onSectionVisibilityChange={(visible) => (coverSection?.id ? onSectionVisibilityChange?.(coverSection.id, visible) : undefined)}
        />
      ),
      [NEWSLETTER_SECTION_CODE.DATE_ISSUE]: (
        <DateAndIssueSection
          key={NEWSLETTER_SECTION_CODE.DATE_ISSUE}
          date={dateIssueProps.date}
          issueNo={dateIssueProps.issueNo}
          blockOrder={getBlockOrder(NEWSLETTER_SECTION_CODE.DATE_ISSUE)}
          sectionVisibility={dateIssueSection?.visibility !== false}
          onSectionVisibilityChange={(visible) =>
            dateIssueSection?.id ? onSectionVisibilityChange?.(dateIssueSection.id, visible) : undefined
          }
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
          sectionVisibility={titleSection?.visibility !== false}
          onSectionVisibilityChange={(visible) => (titleSection?.id ? onSectionVisibilityChange?.(titleSection.id, visible) : undefined)}
        />
      ),
      [NEWSLETTER_SECTION_CODE.SUMMARY]: (
        <SummarySection
          key={NEWSLETTER_SECTION_CODE.SUMMARY}
          summary={summaryProps.summary}
          onSummaryChange={onSummaryChange}
          blockOrder={getBlockOrder(NEWSLETTER_SECTION_CODE.SUMMARY)}
          sectionVisibility={summarySection?.visibility !== false}
          onSectionVisibilityChange={(visible) =>
            summarySection?.id ? onSectionVisibilityChange?.(summarySection.id, visible) : undefined
          }
        />
      ),
      [NEWSLETTER_SECTION_CODE.SECTION]: (
        <NewsFlowSection
          key={NEWSLETTER_SECTION_CODE.SECTION}
          chartData={{
            chartData: newsFlowProps.chartData,
            title: newsFlowProps.title,
            aggregationTime: newsFlowProps.aggregationTime,
          }}
          sectionFieldDefs={newsFlowSection?.fieldDefs}
          relatedNews={newsFlowProps.newsEventItems}
          marketOpenTime={marketOpenTime}
          marketCloseTime={marketCloseTime}
          onChartImageReady={onMainChartImageReady}
          onRelatedNewsChange={onRelatedNewsChange}
          onTitleChange={onNewsFlowTitleChange}
          onAggregationTimeChange={onNewsFlowAggregationTimeChange}
          blockOrder={getBlockOrder(NEWSLETTER_SECTION_CODE.SECTION)}
          hideNewsFlowChart={suppressNewsFlowChartUi}
          disableNewsItemOrder={disableNewsFlowItemOrder}
          sectionVisibility={newsFlowSection?.visibility !== false}
          onSectionVisibilityChange={(visible) =>
            newsFlowSection?.id ? onSectionVisibilityChange?.(newsFlowSection.id, visible) : undefined
          }
        />
      ),
      [NEWSLETTER_SECTION_CODE.FOOTER]: (
        <FooterSection
          key={NEWSLETTER_SECTION_CODE.FOOTER}
          footerContent={footerProps.footerContent || undefined}
          showLogo={footerProps.showLogo}
          onFooterContentChange={onFooterContentChange}
          onShowLogoChange={onFooterShowLogoChange}
          sectionVisibility={footerSection?.visibility !== false}
          onSectionVisibilityChange={(visible) => (footerSection?.id ? onSectionVisibilityChange?.(footerSection.id, visible) : undefined)}
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
              relatedNews={sigNewsProps.newsEventItems}
              onRelatedNewsChange={onRelatedNewsChange}
              onTitleChange={onNewsFlowTitleChange}
              onAggregationTimeChange={onNewsFlowAggregationTimeChange}
              blockOrder={getBlockOrder(NEWSLETTER_SECTION_CODE.SIG_NEWS)}
              disableNewsItemOrder={disableSigNewsItemOrder}
              sectionVisibility={sigNewsSection.visibility !== false}
              onSectionVisibilityChange={(visible) =>
                sigNewsSection?.id ? onSectionVisibilityChange?.(sigNewsSection.id, visible) : undefined
              }
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
      const shared = {
        section: refSection,
        refIndex,
        blockOrder: getBlockOrder(sectionId),
        marketOpenTime,
        marketCloseTime,
        onSectionFieldsChange: (partial: { title?: string; description?: string }) => updateReferenceFieldsById(refSection.id, partial),
        onSectionVisibilityChange: (visible: boolean) => updateReferenceSectionVisibilityById(refSection.id, visible),
        onBlockPatch: (contentBlockIndex: number, patch: ReferenceContentBlockPatch) =>
          patchContentBlockByIndex(refSection.id, contentBlockIndex, patch),
        onBlockItemDelete: onReferencesChange
          ? (contentBlockIndex: number) => deleteContentBlockByIndex(refSection.id, contentBlockIndex)
          : undefined,
        onBlockItemOrderChange: (fromIndex: number, targetIndex: number) => reorderContentBlocksById(refSection.id, fromIndex, targetIndex),
        onChartImageReady: onReferenceChartImageReady,
        getFlatChartIndex: (contentBlockIndex: number) => getFlatChartIndexBySectionId(refSection.id, contentBlockIndex),
      }
      map[sectionId] = userAdded ? (
        <UserCustomSection
          key={sectionId}
          {...shared}
          onDelete={onReferencesChange ? () => deleteReferenceBySectionId(refSection.id) : undefined}
          onAppendContentBlock={onReferencesChange ? (block) => appendReferenceContentBlock(refSection.id, block) : undefined}
        />
      ) : (
        <ReferenceSection key={sectionId} {...shared} />
      )
    })
    return map
  }, [
    snapshot,
    referenceSections,
    getBlockOrder,
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
    onSectionVisibilityChange,
    suppressNewsFlowChartUi,
  ])

  return (
    <Stack gap="38px">
      {sectionOrder
        .map((id) => {
          const node = sectionMap[id]
          if (!node) return null
          return (
            <Box key={id} id={newsletterEditAnchorDomId(id)}>
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
