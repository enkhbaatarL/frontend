import { cloneDeep, isEqual } from 'lodash-es'
import { useMemo } from 'react'

import type {
  INewsletterIssueSnapshotData,
  INewsletterSnapshotBlock,
  IRelatedNewsEventItem,
  IRevisionChangeDetailResponse,
} from '@/service/mi/newsletter'

import {
  chartBoxPositionsEqual,
  computeDirectOrderChangeSectionIds,
  getChartBoxPositions,
  getCoverProps,
  getDateIssueProps,
  getNewsFlowProps,
  getOrderedReferenceSections,
  getReferenceContentBlocks,
  getSummaryProps,
  getTitleProps,
  isReferenceBlockRemoved,
  parseNewsletterIssueSnapshotData,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import { textDiffToHtml } from '@/pages/mi/newsletter/utils/textDiffToHtml'
import { applyNewsletterSnapshotPatch } from '@/service/mi/newsletter'
import { titleOilPricePlainSummaryForDiff } from '@/utils/titleOilPriceDisplay'

export type ReferenceBlockChangeKind = 'added' | 'modified' | 'deleted'

export type ReferenceBlockDiff = {
  kind: ReferenceBlockChangeKind
  titleDiffHtml?: string
  contentDiffHtml?: string
}

export type RelatedNewsDiff = {
  kind: ReferenceBlockChangeKind
  titleDiffHtml?: string
  contentDiffHtml?: string
}

export type DiffOverrides = {
  summary?: string
  title?: string
  /** Title 섹션 fields.subtitle */
  subtitle?: string
  /** 유가 행(전일→당일·변동률) 한 줄 요약 diff */
  titleOilPrice?: string
  name?: string
  description?: string
  date?: string
  newsFlowChartTitle?: string
  newsFlowChartAggregationTime?: string
  /** 메인 뉴스플로우 차트(시계열·박스 위치 등) 변경 — 그래프 영역에 '수정됨' */
  newsFlowChartGraphModified?: boolean
  referenceTitles?: string[]
  referenceDescriptions?: string[]
  relatedNewsTitles?: string[]
  relatedNewsContents?: string[]
  /** 뉴스 id → diff 정보. 표시 여부/라벨은 이 값 기준으로 net diff만 반영 */
  relatedNewsItemChanges?: Record<string, RelatedNewsDiff>
  /** 순서만 바뀐(또는 순서+내용) 섹션 — UI에서 `변경됨` 표시용. 직접 이동한 섹션 id만 담음 */
  sectionOrderChangedSectionIds?: string[]
  /** 레퍼런스/사용자 추가 섹션의 블록별 diff. 배열 인덱스는 orderedReferenceSections 기준 */
  referenceBlockChanges?: Record<string, ReferenceBlockDiff>[]
}

export type UseDocumentDiffResult = {
  previousData: INewsletterIssueSnapshotData | null
  currentData: INewsletterIssueSnapshotData | null
  diffOverrides: DiffOverrides
}

export type ComparisonTarget = 'previous' | 'initial'

const isRenderedReferenceBlock = (block: INewsletterSnapshotBlock | undefined): boolean =>
  !!block && block.visibility && !isReferenceBlockRemoved(block)

const isRenderedNewsFlowItem = (item: IRelatedNewsEventItem | undefined): boolean =>
  !!item && item.removed !== true && item.visibility !== false

/**
 * 리비전 델타로 이전/현재 스냅샷과 diff HTML을 만듭니다.
 *
 * @param revisionDetail - GET .../revisions/{id}/changes/{seq} → RevisionReplayRes
 * @param selectedVersionSeq - 선택 버전 seq (`null`이면 baseSnapshot만 표시)
 * @param comparisonTarget - `previous`: n vs n-1 / `initial`: n vs 최초 발행(`originalPublishedBaseline`)
 * @param originalPublishedBaseline - GET .../original-snapshot 의 SnapshotRoot (comparisonTarget `initial` 전용)
 */
export const useDocumentDiff = (
  revisionDetail: IRevisionChangeDetailResponse | null | undefined,
  selectedVersionSeq: number | null,
  comparisonTarget: ComparisonTarget = 'previous',
  originalPublishedBaseline?: INewsletterIssueSnapshotData | null,
): UseDocumentDiffResult =>
  useMemo(() => {
    const empty = (): UseDocumentDiffResult => ({
      previousData: null,
      currentData: null,
      diffOverrides: {},
    })

    if (!revisionDetail?.baseSnapshot?.data) {
      return empty()
    }

    const base = revisionDetail.baseSnapshot.data
    const histories = revisionDetail.histories ?? []

    const parsedBase = parseNewsletterIssueSnapshotData(base) ?? base
    const originalParsed = originalPublishedBaseline
      ? (parseNewsletterIssueSnapshotData(originalPublishedBaseline) ?? originalPublishedBaseline)
      : null

    if (selectedVersionSeq === null) {
      return { previousData: null, currentData: originalParsed ?? parsedBase, diffOverrides: {} }
    }

    const selectedIndex = histories.findIndex((h) => Number(h.seq) === Number(selectedVersionSeq))
    const selectedIsBaseSnapshot = Number(revisionDetail.baseSnapshot.seq) === Number(selectedVersionSeq)

    if (!selectedIsBaseSnapshot && selectedIndex < 0) {
      return { previousData: null, currentData: parsedBase, diffOverrides: {} }
    }

    const deltasToPrevious =
      comparisonTarget === 'initial' || selectedIsBaseSnapshot ? [] : histories.slice(0, selectedIndex).flatMap((h) => h.deltas ?? [])
    const deltasToCurrent = selectedIsBaseSnapshot ? [] : histories.slice(0, selectedIndex + 1).flatMap((h) => h.deltas ?? [])

    let previousData: INewsletterIssueSnapshotData | null =
      comparisonTarget === 'initial' && originalParsed ? cloneDeep(originalParsed) : cloneDeep(parsedBase)
    let currentData: INewsletterIssueSnapshotData | null = cloneDeep(parsedBase)

    try {
      if (deltasToPrevious.length > 0) {
        previousData = applyNewsletterSnapshotPatch(parsedBase, deltasToPrevious)
      }
      currentData = applyNewsletterSnapshotPatch(parsedBase, deltasToCurrent)
    } catch {
      return empty()
    }

    if (!currentData) return empty()
    const effectivePreviousData = previousData ?? parsedBase

    const diffOverrides: DiffOverrides = {}

    const prevCover = getCoverProps(effectivePreviousData)
    const currCover = getCoverProps(currentData)
    const prevTitle = getTitleProps(effectivePreviousData)
    const currTitle = getTitleProps(currentData)
    const prevSummary = getSummaryProps(effectivePreviousData).summary
    const currSummary = getSummaryProps(currentData).summary
    const prevDi = getDateIssueProps(effectivePreviousData)
    const currDi = getDateIssueProps(currentData)
    const prevNf = getNewsFlowProps(effectivePreviousData)
    const currNf = getNewsFlowProps(currentData)
    const prevRefs = getOrderedReferenceSections(effectivePreviousData)
    const currRefs = getOrderedReferenceSections(currentData)

    if (prevSummary !== currSummary) {
      diffOverrides.summary = textDiffToHtml(prevSummary, currSummary)
    }

    if (prevTitle.title !== currTitle.title) {
      diffOverrides.title = textDiffToHtml(prevTitle.title, currTitle.title)
    }

    const prevSub = prevTitle.subtitle
    const currSub = currTitle.subtitle
    if (prevSub !== currSub) {
      diffOverrides.subtitle = textDiffToHtml(prevSub, currSub)
    }

    const prevOil = titleOilPricePlainSummaryForDiff(prevTitle.priceChangeFrom, prevTitle.priceChangeTo)
    const currOil = titleOilPricePlainSummaryForDiff(currTitle.priceChangeFrom, currTitle.priceChangeTo)
    if (prevOil !== currOil) {
      diffOverrides.titleOilPrice = textDiffToHtml(prevOil, currOil)
    }

    if (prevCover.name !== currCover.name) {
      diffOverrides.name = textDiffToHtml(prevCover.name, currCover.name)
    }

    if (prevCover.description !== currCover.description) {
      diffOverrides.description = textDiffToHtml(prevCover.description, currCover.description)
    }

    if (prevDi.date !== currDi.date) {
      diffOverrides.date = textDiffToHtml(prevDi.date, currDi.date)
    }

    if (prevNf.title !== currNf.title) {
      diffOverrides.newsFlowChartTitle = textDiffToHtml(prevNf.title, currNf.title)
    }

    if (prevNf.aggregationTime !== currNf.aggregationTime) {
      diffOverrides.newsFlowChartAggregationTime = textDiffToHtml(prevNf.aggregationTime, currNf.aggregationTime)
    }

    const prevBoxPos = getChartBoxPositions(effectivePreviousData)
    const currBoxPos = getChartBoxPositions(currentData)
    const graphLayoutChanged = !isEqual(prevNf.chartData, currNf.chartData) || !chartBoxPositionsEqual(prevBoxPos, currBoxPos)
    if (graphLayoutChanged) {
      diffOverrides.newsFlowChartGraphModified = true
    }

    if (currRefs.length > 0) {
      const prevRefById = new Map(prevRefs.map((r) => [r.id, r]))
      const titles: string[] = []
      const descriptions: string[] = []
      const blockChanges: Record<string, ReferenceBlockDiff>[] = []
      currRefs.forEach((ref) => {
        const pRef = prevRefById.get(ref.id)
        const prevT = String(pRef?.fields?.title ?? '')
        const currT = String(ref?.fields?.title ?? '')
        if (prevT === currT) {
          titles.push('')
        } else {
          titles.push(textDiffToHtml(prevT, currT))
        }

        const prevD = String(pRef?.fields?.description ?? '')
        const currD = String(ref?.fields?.description ?? '')
        if (prevD === currD) {
          descriptions.push('')
        } else {
          descriptions.push(textDiffToHtml(prevD, currD))
        }

        const changes: Record<string, ReferenceBlockDiff> = {}
        const prevBlocks = pRef ? getReferenceContentBlocks(pRef) : []
        const currBlocks = getReferenceContentBlocks(ref)
        const prevBlockMap = new Map(prevBlocks.map((b) => [b.id, b]))

        for (const cb of currBlocks) {
          const pb = prevBlockMap.get(cb.id)
          const currActive = isRenderedReferenceBlock(cb)
          const prevActive = isRenderedReferenceBlock(pb)

          const prevFields = (pb?.fields ?? {}) as Record<string, unknown>
          const currFields = (cb.fields ?? {}) as Record<string, unknown>
          const prevBlockTitle = String(prevFields.title ?? pb?.title ?? '')
          const currBlockTitle = String(currFields.title ?? cb.title ?? '')
          const prevContent = String(prevFields.content ?? '')
          const currContent = String(currFields.content ?? '')

          if (!prevActive && !currActive) {
            continue
          }

          if (!prevActive && currActive) {
            changes[cb.id] = {
              kind: 'added',
              titleDiffHtml: currBlockTitle ? textDiffToHtml('', currBlockTitle) : undefined,
              contentDiffHtml: currContent ? textDiffToHtml('', currContent) : undefined,
            }
            continue
          }

          if (prevActive && !currActive) {
            changes[cb.id] = { kind: 'deleted' }
            continue
          }

          const titleChanged = prevBlockTitle !== currBlockTitle
          const contentChanged = prevContent !== currContent

          if (titleChanged || contentChanged) {
            changes[cb.id] = {
              kind: 'modified',
              titleDiffHtml: titleChanged ? textDiffToHtml(prevBlockTitle, currBlockTitle) : undefined,
              contentDiffHtml: contentChanged ? textDiffToHtml(prevContent, currContent) : undefined,
            }
          }
        }

        blockChanges.push(changes)
      })
      if (titles.some(Boolean)) diffOverrides.referenceTitles = titles
      if (descriptions.some(Boolean)) diffOverrides.referenceDescriptions = descriptions
      if (blockChanges.some((m) => Object.keys(m).length > 0)) diffOverrides.referenceBlockChanges = blockChanges
    }

    const currItems = currNf.newsEventItems
    const prevItems = prevNf.newsEventItems
    if (currItems.length > 0) {
      const prevItemByNewsId = new Map(prevItems.map((it) => [it.newsId, it]))
      const titles: string[] = []
      const contents: string[] = []
      const itemChanges: Record<string, RelatedNewsDiff> = {}
      currItems.forEach((item) => {
        const pItem = prevItemByNewsId.get(item.newsId)
        const prevActive = isRenderedNewsFlowItem(pItem)
        const currActive = isRenderedNewsFlowItem(item)

        if (!prevActive && !currActive) {
          titles.push('')
          contents.push('')
          return
        }

        if (prevActive && !currActive) {
          itemChanges[item.newsId] = { kind: 'deleted' }
          titles.push('')
          contents.push('')
          return
        }

        const prevItemT = prevActive ? (pItem?.title ?? '') : ''
        const currItemT = currActive ? (item.title ?? '') : ''
        const prevC = prevActive ? (pItem?.content ?? []).join('\n') : ''
        const currC = currActive ? (item.content ?? []).join('\n') : ''

        const titleDiffHtml = prevItemT === currItemT ? undefined : textDiffToHtml(prevItemT, currItemT)
        const contentDiffHtml = prevC === currC ? undefined : textDiffToHtml(prevC, currC)
        titles.push(titleDiffHtml ?? '')
        contents.push(contentDiffHtml ?? '')

        if (!prevActive && currActive) {
          itemChanges[item.newsId] = {
            kind: 'added',
            titleDiffHtml,
            contentDiffHtml,
          }
          return
        }

        if (titleDiffHtml || contentDiffHtml) {
          itemChanges[item.newsId] = {
            kind: 'modified',
            titleDiffHtml,
            contentDiffHtml,
          }
        }
      })
      if (titles.some(Boolean)) diffOverrides.relatedNewsTitles = titles
      if (contents.some(Boolean)) diffOverrides.relatedNewsContents = contents
      if (Object.keys(itemChanges).length > 0) diffOverrides.relatedNewsItemChanges = itemChanges
    }

    const sectionOrderChangedSectionIds = computeDirectOrderChangeSectionIds(previousData, currentData)
    if (sectionOrderChangedSectionIds.length > 0) {
      diffOverrides.sectionOrderChangedSectionIds = sectionOrderChangedSectionIds
    }

    return { previousData, currentData, diffOverrides }
  }, [revisionDetail, selectedVersionSeq, comparisonTarget, originalPublishedBaseline])
