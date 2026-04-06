import { v4 as uuid } from 'uuid'

import { timeFormat } from '@/components/common/input/validators'
import {
  FREQUENCY_LABEL,
  NewsletterFrequency,
  type IChartData,
  type INewsletterIssueSnapshotData,
  type INewsletterSnapshotBlock,
  type INewsletterSnapshotFieldDef,
  type INewsletterSnapshotSection,
  type INewsletterTitleViewProps,
  type IReferenceTableData,
  type IRelatedNewsEventItem,
} from '@/service/mi/newsletter'
import { createTimestampInNY, parseDate } from '@/utils/date'

/** 스냅샷 `sections[].code` 기준 고정 식별자(편집 순서·필드 갱신·이메일 분기). */
export const NEWSLETTER_SECTION_CODE = {
  COVER: 'COVER',
  DATE_ISSUE: 'DATE_ISSUE',
  TITLE: 'TITLE',
  SUMMARY: 'SUMMARY',
  /** 주요 뉴스(플로우) — API에 따라 `SECTION` 또는 `NEWS_FLOW` */
  SECTION: 'SECTION',
  NEWS_FLOW: 'NEWS_FLOW',
  /** 그래프 없는 뉴스 플로우 계열 — `SIG_NEWS` */
  SIG_NEWS: 'SIG_NEWS',
  FOOTER: 'FOOTER',
} as const

export type NewsletterSectionCanonicalCode = (typeof NEWSLETTER_SECTION_CODE)[keyof typeof NEWSLETTER_SECTION_CODE]

/** 편집기 Block 등에 쓰는 짧은 라벨(표시용·데이터 키 아님) */
export const NEWSLETTER_SECTION_EDIT_LABEL: Record<string, string> = {
  [NEWSLETTER_SECTION_CODE.COVER]: 'Cover',
  [NEWSLETTER_SECTION_CODE.DATE_ISSUE]: 'Date',
  [NEWSLETTER_SECTION_CODE.TITLE]: 'Title',
  [NEWSLETTER_SECTION_CODE.SUMMARY]: 'Summary',
  [NEWSLETTER_SECTION_CODE.SECTION]: 'News Flow',
  [NEWSLETTER_SECTION_CODE.NEWS_FLOW]: 'News Flow',
  [NEWSLETTER_SECTION_CODE.SIG_NEWS]: 'SIG News',
  [NEWSLETTER_SECTION_CODE.FOOTER]: 'Footer',
}

export const normSectionCode = (code: string | undefined): string => (code ?? '').trim().toUpperCase()

export const isNewsFlowSectionCode = (code: string | undefined): boolean => {
  const c = normSectionCode(code)
  return c === normSectionCode(NEWSLETTER_SECTION_CODE.SECTION) || c === normSectionCode(NEWSLETTER_SECTION_CODE.NEWS_FLOW)
}

/** API `NEWS_FLOW` · `SIG_NEWS` — 저장 시 뉴스가 시간순으로 정렬되는 스킴 */
export const isNewsFlowTimeSortedSectionCode = (code: string | undefined): boolean => {
  const c = normSectionCode(code)
  return c === normSectionCode(NEWSLETTER_SECTION_CODE.NEWS_FLOW) || c === normSectionCode(NEWSLETTER_SECTION_CODE.SIG_NEWS)
}

export const isTitleSectionCode = (code: string | undefined): boolean => {
  const c = normSectionCode(code)
  return c === normSectionCode(NEWSLETTER_SECTION_CODE.TITLE) || c === 'TITLE_SPECIALIZED'
}

/** 참고자료 블록 묶음 — `type === SPECIALIZED` 이고 `code`가 REFERENCE(+선택 숫자) */
export const isReferenceSnapshotSection = (s: INewsletterSnapshotSection): boolean => {
  if (s.type !== 'SPECIALIZED') return false
  const c = normSectionCode(s.code)
  return /^REFERENCE\d*$/i.test(c)
}

export const findFirstNewsFlowSection = (
  snapshot: INewsletterIssueSnapshotData | null | undefined,
): INewsletterSnapshotSection | undefined => snapshot?.sections?.find((sect) => isNewsFlowSectionCode(sect.code))

export const findFirstSigNewsSection = (
  snapshot: INewsletterIssueSnapshotData | null | undefined,
): INewsletterSnapshotSection | undefined =>
  snapshot?.sections?.find((sect) => normSectionCode(sect.code) === normSectionCode(NEWSLETTER_SECTION_CODE.SIG_NEWS))

/** SECTION / NEWS_FLOW / SIG_NEWS 중 뉴스 카드 묶음 편집 대상이 되는 첫 섹션 */
export const findPrimaryRelatedNewsSection = (
  snapshot: INewsletterIssueSnapshotData | null | undefined,
): INewsletterSnapshotSection | undefined => findFirstNewsFlowSection(snapshot) ?? findFirstSigNewsSection(snapshot)

/**
 * API `fieldDefs` → 입력 UI: `editable === false` 이면 disabled, `required === true` 이면 필수.
 * 정의가 없으면 편집 가능·비필수(기존 동작 유지).
 */
export const getEffectiveFieldDef = (
  defs: Record<string, INewsletterSnapshotFieldDef> | undefined,
  key: string,
): { disabled: boolean; required: boolean } => {
  const d = defs?.[key]
  return {
    disabled: d ? !d.editable : false,
    required: d?.required === true,
  }
}

/** 메일·뷰·차트 — `removed` 뉴스 카드는 표시하지 않음 */
export const filterVisibleNewsFlowItems = (items: IRelatedNewsEventItem[]): IRelatedNewsEventItem[] =>
  items.filter((n) => n.removed !== true)

/** `timestamp`가 없는 뉴스 항목에 `createdDate + createTime`으로 타임스탬프를 보강.
 *  차트 플러그인이 범위 밖 뉴스도 올바르게 표시할 수 있도록 모든 소비처에서 사용. */
export const enrichNewsFlowItemTimestamps = (items: IRelatedNewsEventItem[]): IRelatedNewsEventItem[] =>
  items.map((item) => ({
    ...item,
    timestamp: item.timestamp ?? createTimestampInNY(item.createdDate ?? '', item.createTime ?? ''),
  }))

/** 뉴스 플로우 섹션 `blocks`에 `type === 'CHART'` 블록이 하나라도 있는지 */
export const newsFlowSectionHasChartBlock = (section: INewsletterSnapshotSection | null | undefined): boolean =>
  (section?.blocks ?? []).some((b) => b.type === 'CHART')

/**
 * 같은 섹션 안 `NEWS_CARD` 블록 중 `order` 기준 첫 번째의 `fieldDefs`.
 * 뉴스 추가 모달·신규 카드가 템플릿과 동일한 필수/비활성 정책을 따를 때 사용.
 */
export const getFirstNewsCardBlockFieldDefs = (
  section: INewsletterSnapshotSection | null | undefined,
): Record<string, INewsletterSnapshotFieldDef> | undefined => {
  const cards = (section?.blocks ?? []).filter((b) => b.type === 'NEWS_CARD').sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  return cards[0]?.fieldDefs
}

/**
 * `sections[].code === NEWS_FLOW` 이고 해당 섹션에 CHART 타입 블록이 없을 때 true.
 * 보기/편집에서 메인 차트·차트 툴바·뉴스 행 변곡점 메뉴 비표시에 사용.
 */
export const shouldSuppressNewsFlowChartUi = (snapshot: INewsletterIssueSnapshotData | null | undefined): boolean => {
  if (!snapshot) return false
  const nf = findFirstNewsFlowSection(snapshot)
  const sig = findFirstSigNewsSection(snapshot)
  /** SECTION/NEWS_FLOW 없이 SIG_NEWS만 있는 템플릿 — 메인 플로우 차트 없음 */
  if (sig && !nf) return true
  const sec = nf
  if (!sec) return false
  if (normSectionCode(sec.code) !== normSectionCode(NEWSLETTER_SECTION_CODE.NEWS_FLOW)) return false
  return !newsFlowSectionHasChartBlock(sec)
}

export const findFirstSectionByCanonicalCode = (
  snapshot: INewsletterIssueSnapshotData,
  canonicalCode: string,
): INewsletterSnapshotSection | undefined => {
  const k = normSectionCode(canonicalCode)
  if (k === normSectionCode(NEWSLETTER_SECTION_CODE.SIG_NEWS)) return findFirstSigNewsSection(snapshot)
  if (k === normSectionCode(NEWSLETTER_SECTION_CODE.SECTION) || k === normSectionCode(NEWSLETTER_SECTION_CODE.NEWS_FLOW))
    return findFirstNewsFlowSection(snapshot)
  if (k === normSectionCode(NEWSLETTER_SECTION_CODE.TITLE)) return snapshot.sections.find((sect) => isTitleSectionCode(sect.code))
  return snapshot.sections.find((sect) => normSectionCode(sect.code) === k)
}

/** `fields`에만 저장. API에서 내려온 참고 섹션과 편집기 «섹션 추가» 섹션을 구분 */
export const USER_ADDED_REFERENCE_SECTION_FIELD = 'userAddedSection' as const

export const isUserAddedReferenceSection = (section: INewsletterSnapshotSection): boolean =>
  section.fields?.[USER_ADDED_REFERENCE_SECTION_FIELD] === true

/** 이메일 `EmailContent` 분기 — `section.code`·참고 섹션 여부만 사용 */
export type NewsletterEmailTemplateKind =
  | 'COVER'
  | 'DATE_ISSUE'
  | 'TITLE'
  | 'SUMMARY'
  | 'SECTION'
  | 'NEWS_FLOW'
  | 'SIG_NEWS'
  | 'REFERENCE'
  | 'USER_CUSTOM'
  | 'FOOTER'
  | 'UNKNOWN'

export const newsletterSectionToEmailTemplateKind = (section: INewsletterSnapshotSection): NewsletterEmailTemplateKind => {
  if (isReferenceSnapshotSection(section)) {
    return isUserAddedReferenceSection(section) ? 'USER_CUSTOM' : 'REFERENCE'
  }
  const c = normSectionCode(section.code)
  if (c === normSectionCode(NEWSLETTER_SECTION_CODE.COVER)) return 'COVER'
  if (c === normSectionCode(NEWSLETTER_SECTION_CODE.DATE_ISSUE)) return 'DATE_ISSUE'
  if (isTitleSectionCode(section.code)) return 'TITLE'
  if (c === normSectionCode(NEWSLETTER_SECTION_CODE.SUMMARY)) return 'SUMMARY'
  if (c === normSectionCode(NEWSLETTER_SECTION_CODE.SIG_NEWS)) return 'SIG_NEWS'
  if (isNewsFlowSectionCode(section.code)) {
    return normSectionCode(section.code) === normSectionCode(NEWSLETTER_SECTION_CODE.NEWS_FLOW) ? 'NEWS_FLOW' : 'SECTION'
  }
  if (c === normSectionCode(NEWSLETTER_SECTION_CODE.FOOTER)) return 'FOOTER'
  return 'UNKNOWN'
}

export const getSectionById = (snapshot: INewsletterIssueSnapshotData, id: string): INewsletterSnapshotSection | undefined =>
  snapshot.sections?.find((s) => s.id === id || (s.id ?? '').includes(id))

export const getBlockByType = (
  section: INewsletterSnapshotSection,
  type: INewsletterSnapshotBlock['type'],
): INewsletterSnapshotBlock | undefined => section.blocks?.find((b) => b.type === type)

export const getBlockFields = <T extends Record<string, unknown>>(block: INewsletterSnapshotBlock | undefined): T | undefined => {
  if (!block?.fields) return undefined
  return block.fields as T
}

export const updateBlockFields = (
  snapshot: INewsletterIssueSnapshotData,
  sectionId: string,
  blockId: string,
  partial: Record<string, unknown>,
): INewsletterIssueSnapshotData => {
  const sectionIdx = snapshot.sections.findIndex((s) => s.id === sectionId || (s.id ?? '').includes(sectionId))
  if (sectionIdx < 0) return snapshot

  const section = snapshot.sections[sectionIdx]
  const blockIdx = section.blocks?.findIndex((b) => b.id === blockId || (b.id ?? '').includes(blockId)) ?? -1
  if (blockIdx < 0) return snapshot

  const block = section.blocks[blockIdx]
  const newBlocks = [...(section.blocks ?? [])]
  newBlocks[blockIdx] = { ...block, fields: { ...(block.fields ?? {}), ...partial } }

  const newSections = [...snapshot.sections]
  newSections[sectionIdx] = { ...section, blocks: newBlocks }

  return { ...snapshot, sections: newSections }
}

export const updateBlockFieldsByType = (
  snapshot: INewsletterIssueSnapshotData,
  sectionIdPattern: string,
  blockType: INewsletterSnapshotBlock['type'],
  partial: Record<string, unknown>,
): INewsletterIssueSnapshotData => {
  const section = getSectionById(snapshot, sectionIdPattern)
  const block = section ? getBlockByType(section, blockType) : undefined
  if (!section || !block) return snapshot
  return updateBlockFields(snapshot, section.id, block.id, partial)
}

export const updateBlockFieldsByBlockIdPattern = (
  snapshot: INewsletterIssueSnapshotData,
  sectionIdPattern: string,
  blockIdPattern: string,
  partial: Record<string, unknown>,
): INewsletterIssueSnapshotData => {
  const section = getSectionById(snapshot, sectionIdPattern)
  const block = section?.blocks?.find((b) => (b.id ?? '').includes(blockIdPattern))
  if (!section || !block) return snapshot
  return updateBlockFields(snapshot, section.id, block.id, partial)
}

/** 섹션 `fields` 병합 — `canonicalCode`는 {@link NEWSLETTER_SECTION_CODE} 또는 동일 역할의 API code 계열 */
export const updateSectionFieldsByCode = (
  snapshot: INewsletterIssueSnapshotData,
  canonicalCode: string,
  partial: Record<string, unknown>,
): INewsletterIssueSnapshotData => {
  const target = findFirstSectionByCanonicalCode(snapshot, canonicalCode)
  if (!target) return snapshot
  const sectionIdx = snapshot.sections.findIndex((s) => s.id === target.id)
  if (sectionIdx < 0) return snapshot
  const section = snapshot.sections[sectionIdx]
  const newSections = [...snapshot.sections]
  newSections[sectionIdx] = {
    ...section,
    fields: { ...(section.fields ?? {}), ...partial },
  }
  return { ...snapshot, sections: newSections }
}

export const updateSectionVisibilityById = (
  snapshot: INewsletterIssueSnapshotData,
  sectionId: string,
  visibility: boolean,
): INewsletterIssueSnapshotData => {
  const sectionIdx = snapshot.sections.findIndex((s) => s.id === sectionId)
  if (sectionIdx < 0) return snapshot
  const section = snapshot.sections[sectionIdx]!
  if (section.visibility === visibility) return snapshot
  const newSections = [...snapshot.sections]
  newSections[sectionIdx] = { ...section, visibility }
  return { ...snapshot, sections: newSections }
}

export const updateNewsFlowPresentationFields = (
  snapshot: INewsletterIssueSnapshotData,
  partial: { title?: string; aggregationTime?: string },
): INewsletterIssueSnapshotData => {
  const target = findPrimaryRelatedNewsSection(snapshot)
  if (!target) return snapshot

  const sectionPartial: Record<string, unknown> = { ...partial }
  if (partial.aggregationTime !== undefined) {
    sectionPartial.subtitle = partial.aggregationTime
  }

  const sectionIdx = snapshot.sections.findIndex((s) => s.id === target.id || (s.id ?? '').includes(target.id))
  if (sectionIdx < 0) return snapshot

  const section = snapshot.sections[sectionIdx]
  const newSections = [...snapshot.sections]
  newSections[sectionIdx] = {
    ...section,
    fields: { ...(section.fields ?? {}), ...sectionPartial },
  }
  let next: INewsletterIssueSnapshotData = { ...snapshot, sections: newSections }

  const chart = getBlockByType(newSections[sectionIdx]!, 'CHART')
  if (chart) {
    next = updateBlockFields(next, target.id, chart.id, partial)
  }
  return next
}

export const reorderSections = (snapshot: INewsletterIssueSnapshotData, sectionIds: string[]): INewsletterIssueSnapshotData => {
  const orderMap = new Map(sectionIds.map((id, i) => [id, i]))
  let anyOrderChanged = false
  const newSections = snapshot.sections.map((s) => {
    const mapped = orderMap.get(s.id)
    const nextOrder = mapped === undefined ? (s.order ?? 999) : mapped
    const prevOrder = s.order ?? 999
    if (nextOrder === prevOrder) return s
    anyOrderChanged = true
    return { ...s, order: nextOrder }
  })
  if (!anyOrderChanged) return snapshot
  return { ...snapshot, sections: newSections }
}

export const updateNewsFlowItems = (
  snapshot: INewsletterIssueSnapshotData,
  items: IRelatedNewsEventItem[],
): INewsletterIssueSnapshotData => {
  const section = findPrimaryRelatedNewsSection(snapshot)
  if (!section) return snapshot

  const otherBlocks = (section.blocks ?? []).filter((b) => b.type !== 'NEWS_CARD')
  const existingNewsBlocks = (section.blocks ?? []).filter((b) => b.type === 'NEWS_CARD')
  const existingByNewsId = new Map<string, INewsletterSnapshotBlock>()
  for (const b of existingNewsBlocks) {
    const f = getBlockFields<{ newsId?: string }>(b)
    const id = f?.newsId
    if (id) existingByNewsId.set(id, b)
  }

  const newNewsBlocks: INewsletterSnapshotBlock[] = items.map((item, i) => {
    const prev = existingByNewsId.get(item.newsId)
    const softRemoved = item.removed === true
    const nextVisibility = item.visibility !== undefined ? item.visibility : !softRemoved
    return {
      id: prev?.id ?? `blk-NEWS_ITEM-${item.newsId}`,
      type: 'NEWS_CARD' as const,
      title: item.title || '뉴스 카드',
      format: 'GENERAL',
      order: i,
      visibility: nextVisibility,
      fieldDefs: item.fieldDefs ?? prev?.fieldDefs,
      fields: {
        newsId: item.newsId,
        title: item.title,
        content: item.content ?? [],
        timestamp: item.timestamp,
        createdDate: item.createdDate,
        createTime: item.createTime ?? '',
        source: item.source ?? null,
        originalUrl: item.originalLink ?? null,
        showInChart: item.showInChart ?? false,
        trend: item.trend ?? 'NONE',
      },
      state: { removed: softRemoved },
    }
  })

  const newBlocks = [...otherBlocks, ...newNewsBlocks].map((b, i) => ({ ...b, order: i }))
  const sectionIdx = snapshot.sections.findIndex((s) => s.id === section.id || (s.id ?? '').includes(section.id))
  if (sectionIdx < 0) return snapshot

  const newSections = [...snapshot.sections]
  newSections[sectionIdx] = { ...section, blocks: newBlocks }
  return { ...snapshot, sections: newSections }
}

const coalesceTimeFieldToString = (a: unknown, b: unknown): string => {
  const pick = (v: unknown): string => {
    if (typeof v === 'string') return v
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    return ''
  }
  return pick(a) || pick(b)
}

const newsFieldsToSortTimeMs = (raw: Record<string, unknown>): number => {
  const ts = raw.timestamp
  if (typeof ts === 'number' && !Number.isNaN(ts)) return ts

  const createdRaw = raw.createdDate
  const createdStr = typeof createdRaw === 'string' ? createdRaw : ''
  const dateNorm = parseDate(createdStr)
  const timeRaw = coalesceTimeFieldToString(raw.createTime, raw.markTime)
  if (dateNorm && timeRaw) {
    const normalizedTime = timeRaw.includes(':')
      ? timeRaw.slice(0, 5)
      : timeRaw.length >= 4
        ? `${timeRaw.slice(0, 2)}:${timeRaw.slice(2, 4)}`
        : '12:00'
    try {
      return createTimestampInNY(dateNorm, normalizedTime)
    } catch {
      return 0
    }
  }
  if (dateNorm) {
    try {
      return createTimestampInNY(dateNorm, '12:00')
    } catch {
      return 0
    }
  }
  return 0
}

const replaceSectionBlocksInSnapshot = (
  snapshot: INewsletterIssueSnapshotData,
  section: INewsletterSnapshotSection,
  blocks: INewsletterSnapshotBlock[],
): INewsletterIssueSnapshotData => {
  const sectionIdx = snapshot.sections.findIndex((s) => s.id === section.id || (s.id ?? '').includes(section.id))
  if (sectionIdx < 0) return snapshot
  const newSections = [...snapshot.sections]
  newSections[sectionIdx] = { ...section, blocks }
  return { ...snapshot, sections: newSections }
}

export const sortNewsFlowNewsCardsByTimeForSave = (snapshot: INewsletterIssueSnapshotData): INewsletterIssueSnapshotData => {
  const section = findPrimaryRelatedNewsSection(snapshot)
  if (!section?.blocks?.length) return snapshot

  const blocks = [...section.blocks]
  const chartBlocks = blocks.filter((b) => b.type === 'CHART')
  const otherBlocks = blocks.filter((b) => b.type !== 'CHART' && b.type !== 'NEWS_CARD')
  const newsBlocks = blocks.filter((b) => b.type === 'NEWS_CARD')

  if (newsBlocks.length === 0) {
    const merged = [...chartBlocks, ...otherBlocks].map((b, i) => ({ ...b, order: i }))
    return replaceSectionBlocksInSnapshot(snapshot, section, merged)
  }

  const activeNews = newsBlocks.filter((b) => b.state?.removed !== true)
  const removedNews = newsBlocks.filter((b) => b.state?.removed === true)
  const sortedActive = [...activeNews].sort((a, b) => {
    const ca = getBlockFields<Record<string, unknown>>(a) ?? {}
    const cb = getBlockFields<Record<string, unknown>>(b) ?? {}
    return newsFieldsToSortTimeMs(ca) - newsFieldsToSortTimeMs(cb)
  })
  const newNewsBlocks = [...sortedActive, ...removedNews]

  const merged: INewsletterSnapshotBlock[] = []
  let order = 0
  for (const b of chartBlocks) {
    merged.push({ ...b, order: order++ })
  }
  for (const b of otherBlocks) {
    merged.push({ ...b, order: order++ })
  }
  for (const b of newNewsBlocks) {
    merged.push({ ...b, order: order++ })
  }

  return replaceSectionBlocksInSnapshot(snapshot, section, merged)
}

export const getOrderedReferenceSections = (snapshot: INewsletterIssueSnapshotData | null): INewsletterSnapshotSection[] => {
  if (!snapshot?.sections?.length) return []
  return snapshot.sections.filter((s) => isReferenceSnapshotSection(s)).sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

/** Reference 섹션에서 본문 블록만 (CHART / TABLE / IMAGE / REFERENCE_CONTENT TEXT) */
export const getReferenceContentBlocks = (section: INewsletterSnapshotSection): INewsletterSnapshotBlock[] =>
  (section.blocks ?? [])
    .filter(
      (b) =>
        b.type === 'CHART' || b.type === 'TABLE' || b.type === 'IMAGE' || (b.type === 'TEXT' && (b.id ?? '').includes('REFERENCE_CONTENT')),
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

export const isReferenceSectionRemoved = (section: INewsletterSnapshotSection): boolean => section.removed === true

export const isReferenceBlockRemoved = (block: INewsletterSnapshotBlock): boolean => block.state?.removed === true

/** 비교 스냅샷에서 해당 참고 블록이 이미 `state.removed` 였는지(없으면 false) */
export const wasReferenceContentBlockRemovedInSnapshot = (
  snapshot: INewsletterIssueSnapshotData | null | undefined,
  referenceSectionId: string,
  blockId: string,
): boolean => {
  if (!snapshot?.sections?.length) return false
  const sec = snapshot.sections.find((s) => s.id === referenceSectionId)
  if (!sec) return false
  const b = getReferenceContentBlocks(sec).find((x) => x.id === blockId)
  if (!b) return false
  return isReferenceBlockRemoved(b)
}

export type ReferenceContentBlockPatch = {
  title?: string
  content?: string
  chartData?: IChartData
  tableData?: IReferenceTableData
  imageBase64?: string
  fileName?: string
  state?: { removed?: boolean }
  /** 편집기 눈 아이콘 숨김 처리용 */
  visibility?: boolean
}

export const patchReferenceContentBlock = (
  block: INewsletterSnapshotBlock,
  patch: ReferenceContentBlockPatch,
): INewsletterSnapshotBlock => {
  const fields = { ...(block.fields ?? {}) }
  const state = patch.state !== undefined ? { ...block.state, ...patch.state } : block.state
  // `visibility`는 "눈 아이콘 숨김" 전용으로 취급합니다.
  // 삭제(`state.removed`)와는 별개이므로, `patch.visibility`가 주어지지 않으면 기존 visibility는 유지합니다.
  const nextVisibility = patch.visibility !== undefined ? patch.visibility : block.visibility
  const title = patch.title !== undefined ? patch.title : block.title
  if (block.type === 'CHART') {
    if (patch.chartData) {
      fields.timestamps = patch.chartData.timestamps
      fields.series = patch.chartData.series
    }
    if (patch.content !== undefined) fields.content = patch.content
    return { ...block, title, fields, state, visibility: nextVisibility }
  }
  if (block.type === 'TABLE') {
    if (patch.tableData) {
      fields.tableData = {
        tableId: patch.tableData.tableId,
        headers: patch.tableData.headers,
        rows: patch.tableData.rows,
      }
    }
    if (patch.content !== undefined) fields.content = patch.content
    return { ...block, title, fields, state, visibility: nextVisibility }
  }
  if (block.type === 'TEXT') {
    if (patch.content !== undefined) fields.content = patch.content
    return { ...block, title, fields, state, visibility: nextVisibility }
  }
  if (block.type === 'IMAGE') {
    if (patch.imageBase64 !== undefined) fields.imageBase64 = patch.imageBase64
    if (patch.fileName !== undefined) fields.fileName = patch.fileName
    if (patch.content !== undefined) fields.content = patch.content
    return { ...block, title, fields, state, visibility: nextVisibility }
  }
  return { ...block, title, fields, state, visibility: nextVisibility }
}

export const replaceReferenceSectionContentBlocks = (
  section: INewsletterSnapshotSection,
  newContentBlocks: INewsletterSnapshotBlock[],
): INewsletterSnapshotSection => ({
  ...section,
  blocks: newContentBlocks.map((b, i) => ({ ...b, order: i + 1 })),
})

/**
 * 편집기에서 넘긴 Reference 스냅샷 섹션 배열로 스냅샷의 Reference 구간을 통째로 교체.
 *
 * 기존 reference 섹션의 order는 보존하고, 새로 추가된 섹션만 기존 reference 뒤에 배치합니다.
 * 이렇게 하면 사용자가 순서를 변경하여 reference 섹션 사이에 비-reference 섹션이
 * 끼어 있더라도 order 충돌이 발생하지 않습니다.
 */
export const mergeReferenceSectionsIntoSnapshot = (
  snapshot: INewsletterIssueSnapshotData,
  refSections: INewsletterSnapshotSection[],
): INewsletterIssueSnapshotData => {
  const nonRefSections = snapshot.sections.filter((s) => !isReferenceSnapshotSection(s))

  const existingRefOrderMap = new Map<string, number>()
  for (const s of snapshot.sections) {
    if (isReferenceSnapshotSection(s)) {
      existingRefOrderMap.set(s.id, s.order ?? 999)
    }
  }

  const newlyAddedRefs = refSections.filter((s) => !existingRefOrderMap.has(s.id))
  const newRefCount = newlyAddedRefs.length

  const maxExistingRefOrder =
    existingRefOrderMap.size > 0 ? Math.max(...existingRefOrderMap.values()) : Math.max(...nonRefSections.map((s) => s.order ?? 0), -1)

  const adjustedNonRefSections =
    newRefCount === 0
      ? nonRefSections
      : nonRefSections.map((s) => {
        if ((s.order ?? 999) > maxExistingRefOrder) {
          return { ...s, order: (s.order ?? 999) + newRefCount }
        }
        return s
      })

  let nextNewOrder = maxExistingRefOrder + 1

  const newRefSections: INewsletterSnapshotSection[] = refSections.map((sec, idx) => {
    const existingSection = snapshot.sections.find((s) => s.id === sec.id)
    const normalizedBlocks = (sec.blocks ?? []).map((b, i) => ({ ...b, order: i + 1 }))
    const rawC = normSectionCode(sec.code)
    const code = rawC.startsWith('REFERENCE') && /^REFERENCE\d*$/i.test(rawC) ? sec.code : `REFERENCE${idx + 1}`
    const order = existingRefOrderMap.has(sec.id) ? existingRefOrderMap.get(sec.id)! : nextNewOrder++
    return {
      ...sec,
      id: sec.id,
      code,
      name: sec.name ?? '',
      type: 'SPECIALIZED',
      order,
      visibility: sec.visibility,
      removed: sec.removed === true,
      target: existingSection?.target ?? sec.target ?? '2020',
      fields: { ...(sec.fields ?? {}) },
      fieldDefs: existingSection?.fieldDefs ?? sec.fieldDefs,
      blocks: normalizedBlocks,
    }
  })

  return { ...snapshot, sections: [...adjustedNonRefSections, ...newRefSections] }
}

export const fullInsertIndexForVisibleBlockTarget = (
  blocksWithoutMoved: INewsletterSnapshotBlock[],
  targetVisibleIndex: number,
): number => {
  let v = 0
  for (let i = 0; i <= blocksWithoutMoved.length; i++) {
    if (v === targetVisibleIndex) return i
    if (i < blocksWithoutMoved.length && !isReferenceBlockRemoved(blocksWithoutMoved[i])) {
      v++
    }
  }
  return blocksWithoutMoved.length
}

/** 사용자가 편집기에서 추가한 참고 섹션 초기 스냅샷 */
export const createUserCustomSnapshotSection = (ordinal1Based: number, title: string, description: string): INewsletterSnapshotSection => ({
  id: uuid(),
  code: `REFERENCE${ordinal1Based}`,
  name: '',
  type: 'SPECIALIZED',
  order: 0,
  visibility: true,
  fields: {
    title,
    description,
    [USER_ADDED_REFERENCE_SECTION_FIELD]: true,
  },
  blocks: [],
})

/** @deprecated `createUserCustomSnapshotSection` 사용 */
export const createEmptyReferenceSnapshotSection = createUserCustomSnapshotSection

export type ReferenceContentBlockKind = 'text' | 'image'

/** Reference 섹션에 추가하는 사용자 정의 본문 블록 (텍스트 / 이미지) */
export const createReferenceContentBlock = (
  kind: ReferenceContentBlockKind,
  params: { title: string; content?: string; imageBase64?: string; fileName?: string },
): INewsletterSnapshotBlock => {
  const blockTitle = params.title.trim() || 'Block'
  if (kind === 'text') {
    return {
      id: `blk-REFERENCE_CONTENT-${uuid()}`,
      type: 'TEXT',
      order: 0,
      title: blockTitle,
      visibility: true,
      format: 'GENERAL',
      target: '2020',
      state: { removed: false },
      fields: { content: params.content?.trim() ?? '' },
    }
  }
  return {
    id: `blk-REFERENCE_IMAGE-${uuid()}`,
    type: 'IMAGE',
    order: 0,
    title: blockTitle,
    visibility: true,
    format: 'GENERAL',
    target: '2020',
    state: { removed: false },
    fields: {
      imageBase64: params.imageBase64 ?? '',
      fileName: params.fileName ?? '',
      content: params.content?.trim() ?? '',
    },
  }
}

export const chartViewFromBlock = (block: INewsletterSnapshotBlock) => {
  const c = getBlockFields<{
    timestamps?: number[]
    series?: {
      seriesId: string
      label: string
      renderAs: string
      values: number[]
      isVisible: boolean
    }[]
  }>(block)
  const series = (c?.series ?? []).map((s) => ({ ...s, isLineChartDashStyle: null as string | null }))
  return {
    timestamps: c?.timestamps ?? [],
    series,
  }
}

export const tableViewFromBlock = (block: INewsletterSnapshotBlock) => {
  const c = getBlockFields<{
    tableData?: {
      tableId?: string | null
      headers?: { field: string; name: string }[]
      rows?: { cells: string[] }[]
    }
  }>(block)
  const td = c?.tableData
  return {
    tableId: String(td?.tableId ?? ''),
    headers: td?.headers ?? [],
    rows: td?.rows ?? [],
  }
}

export const getSectionsInOrder = (snapshot: INewsletterIssueSnapshotData | null): INewsletterSnapshotSection[] => {
  if (!snapshot?.sections?.length) return []
  return [...snapshot.sections].filter((s) => s.visibility && s.removed !== true).sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

/** COVER·FOOTER는 편집기에서 양 끝 고정 — 순서 변경 diff에서 제외 */
const isFixedEndSectionOrderId = (snapshot: INewsletterIssueSnapshotData, sectionId: string): boolean => {
  const s = snapshot.sections.find((sec) => sec.id === sectionId)
  if (!s) return false
  const c = normSectionCode(s.code)
  return c === normSectionCode(NEWSLETTER_SECTION_CODE.COVER) || c === normSectionCode(NEWSLETTER_SECTION_CODE.FOOTER)
}

/**
 * 이전·현재 스냅샷의 문서 순서를 비교해, "직접 순서가 바뀐" 섹션 id만 반환합니다.
 * - 한 블록을 멀리 끌어다 놓은 경우: 이동 거리(|Δ인덱스|)가 1보다 큰 섹션만 (밀려난 섹션 제외)
 * - 인접 교환처럼 모두 한 칸 이내로만 움직인 경우: 위치가 실제로 바뀐 섹션 전부
 * - COVER·FOOTER는 스냅샷 `order`만 바뀐 경우(고정 슬롯) 변경 이력 순서 배지에 포함하지 않음
 */
export const computeDirectOrderChangeSectionIds = (
  previous: INewsletterIssueSnapshotData | null | undefined,
  current: INewsletterIssueSnapshotData | null | undefined,
): string[] => {
  if (!previous || !current) return []
  const prevIds = getSectionsInOrder(previous).map((s) => s.id)
  const currIds = getSectionsInOrder(current).map((s) => s.id)
  if (prevIds.length === 0 || currIds.length === 0) return []
  if (prevIds.join('\0') === currIds.join('\0')) return []

  const prevIdx = new Map<string, number>()
  prevIds.forEach((id, i) => {
    prevIdx.set(id, i)
  })
  const currIdx = new Map<string, number>()
  currIds.forEach((id, i) => {
    currIdx.set(id, i)
  })

  const candidates = [...new Set([...prevIds, ...currIds])].filter((id) => prevIdx.has(id) && currIdx.has(id))
  if (candidates.length === 0) return []

  const disp = new Map<string, number>()
  for (const id of candidates) {
    disp.set(id, Math.abs(currIdx.get(id)! - prevIdx.get(id)!))
  }
  const maxDisp = Math.max(...disp.values())
  const moved = maxDisp > 1 ? candidates.filter((id) => (disp.get(id) ?? 0) > 1) : candidates.filter((id) => (disp.get(id) ?? 0) > 0)
  return moved.filter((id) => !isFixedEndSectionOrderId(current, id))
}

export const sectionToEditorKey = (section: INewsletterSnapshotSection): string | null => {
  if (isReferenceSnapshotSection(section)) return `ref:${section.id}`
  if (normSectionCode(section.code) === normSectionCode(NEWSLETTER_SECTION_CODE.SIG_NEWS)) {
    return NEWSLETTER_SECTION_CODE.SIG_NEWS
  }
  if (isNewsFlowSectionCode(section.code)) return NEWSLETTER_SECTION_CODE.SECTION
  if (isTitleSectionCode(section.code)) return NEWSLETTER_SECTION_CODE.TITLE
  const c = normSectionCode(section.code)
  if (
    c === normSectionCode(NEWSLETTER_SECTION_CODE.COVER) ||
    c === normSectionCode(NEWSLETTER_SECTION_CODE.DATE_ISSUE) ||
    c === normSectionCode(NEWSLETTER_SECTION_CODE.SUMMARY) ||
    c === normSectionCode(NEWSLETTER_SECTION_CODE.FOOTER)
  ) {
    return c
  }
  return null
}

export const editorKeyToSnapshotSectionId = (snapshot: INewsletterIssueSnapshotData, key: string): string | undefined => {
  if (key.startsWith('ref:')) return key.slice(4)
  const k = normSectionCode(key)
  if (k === normSectionCode(NEWSLETTER_SECTION_CODE.SIG_NEWS)) {
    return findFirstSigNewsSection(snapshot)?.id
  }
  if (k === normSectionCode(NEWSLETTER_SECTION_CODE.SECTION) || k === normSectionCode(NEWSLETTER_SECTION_CODE.NEWS_FLOW))
    return findFirstNewsFlowSection(snapshot)?.id
  if (k === normSectionCode(NEWSLETTER_SECTION_CODE.TITLE)) return snapshot.sections.find((s) => isTitleSectionCode(s.code))?.id
  return snapshot.sections.find((s) => normSectionCode(s.code) === k)?.id
}

export const getEditorSectionOrderKeysFromSnapshot = (snapshot: INewsletterIssueSnapshotData | null): string[] => {
  if (!snapshot) return []
  // EDIT 모드에서는 섹션을 "숨김" 처리해도 unhide 할 수 있어야 하므로
  // `section.visibility` 필터링은 하지 않고 `removed`만 제외합니다.
  return [...snapshot.sections]
    .filter((s) => s.removed !== true)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map(sectionToEditorKey)
    .filter((k): k is string => k !== null)
}

/** 편집 모드 앵커 스크롤용 DOM id (`AnchorNavigation` 항목과 동일 규칙) */
export const newsletterEditAnchorDomId = (editorKey: string): string => {
  if (editorKey === NEWSLETTER_SECTION_CODE.COVER) return 'section-cover'
  if (editorKey === NEWSLETTER_SECTION_CODE.DATE_ISSUE) return 'section-dateAndIssue'
  if (editorKey === NEWSLETTER_SECTION_CODE.TITLE) return 'section-title'
  if (editorKey === NEWSLETTER_SECTION_CODE.SUMMARY) return 'section-summary'
  if (editorKey === NEWSLETTER_SECTION_CODE.SIG_NEWS) return 'section-sigNews'
  if (editorKey === NEWSLETTER_SECTION_CODE.SECTION || editorKey === NEWSLETTER_SECTION_CODE.NEWS_FLOW) return 'section-newsFlow'
  if (editorKey === NEWSLETTER_SECTION_CODE.FOOTER) return 'section-footer'
  if (editorKey.startsWith('ref:')) return `section-ref-${editorKey.slice(4)}`
  return `section-${editorKey.replace(/:/g, '-')}`
}

export const reorderSnapshotByEditorKeys = (
  snapshot: INewsletterIssueSnapshotData,
  orderedEditorKeys: string[],
): INewsletterIssueSnapshotData => {
  const sectionIdsFromKeys = orderedEditorKeys.map((k) => editorKeyToSnapshotSectionId(snapshot, k)).filter((id): id is string => !!id)
  const keySet = new Set(sectionIdsFromKeys)
  const remaining = snapshot.sections
    .filter((s) => !keySet.has(s.id))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map((s) => s.id)
  const fullIds = [...sectionIdsFromKeys, ...remaining]
  return reorderSections(snapshot, fullIds)
}

const parsePublishCycle = (raw?: string): NewsletterFrequency => {
  const u = (raw ?? '').toUpperCase()
  if (u === NewsletterFrequency.WEEKLY) return NewsletterFrequency.WEEKLY
  if (u === NewsletterFrequency.ON_DEMAND) return NewsletterFrequency.ON_DEMAND
  return NewsletterFrequency.DAILY
}

/** 스냅샷 fields의 숫자 필드 (number 또는 숫자 문자열) */
const readNumericField = (v: unknown): number | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

export const getCoverProps = (
  snapshot: INewsletterIssueSnapshotData | null,
  /** 지정 시 해당 섹션만(동일 code 반복 시 각각 렌더링). 생략 시 첫 COVER */
  section?: INewsletterSnapshotSection | null,
): {
  imageBase64: string
  frequency: string
  publishCycle: NewsletterFrequency
  name: string
  description: string
  /** COVER_IMAGE_CARD `fields.showImage` — false 이면 뷰/메일에서 커버 썸네일 비노출 */
  showImage: boolean
} => {
  const empty = {
    imageBase64: '',
    frequency: FREQUENCY_LABEL[NewsletterFrequency.DAILY],
    publishCycle: NewsletterFrequency.DAILY,
    name: '',
    description: '',
    showImage: true,
  }
  if (!snapshot?.sections?.length) return empty
  const resolved = section ?? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.COVER)
  if (!resolved) return empty
  const f = resolved.fields ?? {}
  const imageBlock = getBlockByType(resolved, 'IMAGE')
  const coverInfoBlock =
    resolved.blocks?.find((b) => (b.id ?? '').includes('COVER_INFO') || (b.type === 'TEXT' && (b.id ?? '').includes('COVER'))) ?? undefined
  const coverInfo = getBlockFields<{ publishCycle?: string }>(coverInfoBlock)
  const imageContent = getBlockFields<{ imageBase64?: string; showImage?: boolean }>(imageBlock)
  const publishCycle = parsePublishCycle(coverInfo?.publishCycle)
  return {
    imageBase64: imageContent?.imageBase64 ?? '',
    frequency: FREQUENCY_LABEL[publishCycle],
    publishCycle,
    name: String(f.newsletterName ?? ''),
    description: String(f.newsletterDescription ?? ''),
    showImage: imageContent?.showImage !== false,
  }
}

/** 커버 이미지 노출 토글 — `COVER_IMAGE_CARD` IMAGE 블록 `fields.showImage` */
export const updateCoverShowImage = (snapshot: INewsletterIssueSnapshotData, showImage: boolean): INewsletterIssueSnapshotData => {
  const sec = findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.COVER)
  if (!sec) return snapshot
  const block = getBlockByType(sec, 'IMAGE')
  if (!block) return snapshot
  return updateBlockFields(snapshot, sec.id, block.id, { showImage })
}

export const getDateIssueProps = (
  snapshot: INewsletterIssueSnapshotData | null,
  /** 지정 시 해당 섹션만. 생략 시 첫 DATE_ISSUE */
  section?: INewsletterSnapshotSection | null,
): { date: string; issueNo: string } => {
  if (!snapshot) return { date: '', issueNo: '001' }
  const resolved =
    section ?? (snapshot.sections?.length ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.DATE_ISSUE) : undefined)
  const f = resolved?.fields ?? {}
  const issueNum = f.issueNumber
  const dateFromSection = f.publishDate !== undefined && f.publishDate !== null ? String(f.publishDate) : ''
  return {
    date: dateFromSection,
    issueNo: (issueNum ?? null) === null || issueNum === undefined ? '001' : String(issueNum),
  }
}

export const getTitleProps = (
  snapshot: INewsletterIssueSnapshotData | null,
  /** 지정 시 해당 섹션만. 생략 시 첫 TITLE 계열 */
  section?: INewsletterSnapshotSection | null,
): INewsletterTitleViewProps => {
  const empty: INewsletterTitleViewProps = {
    title: '',
    subtitle: '',
    priceChangeFrom: undefined,
    priceChangeTo: undefined,
  }
  if (!snapshot?.sections?.length) return empty
  const resolved = section ?? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.TITLE)
  if (!resolved) return empty
  const f = resolved.fields ?? {}
  return {
    title: f.title !== undefined && f.title !== null ? String(f.title) : '',
    subtitle: f.subtitle !== undefined && f.subtitle !== null ? String(f.subtitle) : '',
    priceChangeFrom: readNumericField(f.priceChangeFrom),
    priceChangeTo: readNumericField(f.priceChangeTo),
  }
}

export const getSummaryProps = (
  snapshot: INewsletterIssueSnapshotData | null,
  /** 지정 시 해당 섹션만. 생략 시 첫 SUMMARY */
  section?: INewsletterSnapshotSection | null,
): { summary: string } => {
  if (!snapshot?.sections?.length) return { summary: '' }
  const resolved = section ?? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.SUMMARY)
  const f = resolved?.fields ?? {}
  return { summary: String(f.summaryText ?? '') }
}

export const getNewsFlowProps = (
  snapshot: INewsletterIssueSnapshotData | null,
  /** 지정 시 해당 섹션만. 생략 시 첫 `SECTION` / `NEWS_FLOW` / `SIG_NEWS` */
  section?: INewsletterSnapshotSection | null,
): {
  chartData: IChartData
  aggregationTime: string
  title: string
  newsEventItems: IRelatedNewsEventItem[]
} => {
  const emptyChart: IChartData = { timestamps: [], series: [] }
  const empty = { chartData: emptyChart, aggregationTime: '', title: '', newsEventItems: [] as IRelatedNewsEventItem[] }
  if (!snapshot?.sections?.length) return empty

  const resolved = section ?? findPrimaryRelatedNewsSection(snapshot)
  if (!resolved) return empty
  const secFields = resolved.fields ?? {}
  const chartBlock = getBlockByType(resolved, 'CHART')
  const chartContent = getBlockFields<{
    timestamps?: number[]
    series?: {
      seriesId: string
      label: string
      renderAs: string
      values: number[]
      isVisible: boolean
      color?: string | null
      dtick?: number | null
      range?: number[] | null
      isBidirectional?: boolean | null
    }[]
    aggregationTime?: string
    title?: string
  }>(chartBlock)

  const newsCardBlocks = (resolved.blocks ?? []).filter((b) => b.type === 'NEWS_CARD').sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const newsEventItems: IRelatedNewsEventItem[] = newsCardBlocks
    .map((blk) => {
      const c = getBlockFields<{
        newsId: string
        title?: string
        content?: string[]
        timestamp?: number
        createdDate?: string
        createTime?: string
        source?: string | null
        originalUrl?: string | null
        showInChart?: boolean
        trend?: string
      }>(blk)
      if (!c || typeof c.newsId !== 'string') return null
      const softRemoved = blk.state?.removed === true
      const nextVisibility = blk.visibility
      return {
        newsId: c.newsId,
        title: c.title ?? '',
        content: Array.isArray(c.content) ? c.content : [],
        timestamp: c.timestamp,
        createdDate: c.createdDate ?? '',
        createTime: c.createTime ?? '',
        source: c.source ?? '',
        originalLink: c.originalUrl ?? undefined,
        showInChart: c.showInChart ?? false,
        trend: (c.trend ?? '') as IRelatedNewsEventItem['trend'],
        removed: softRemoved,
        visibility: nextVisibility,
        fieldDefs: blk.fieldDefs,
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null && c !== undefined)

  const series = (chartContent?.series ?? []).map((s) => ({
    seriesId: s.seriesId,
    label: s.label,
    renderAs: s.renderAs,
    values: s.values ?? [],
    isVisible: s.isVisible ?? true,
    isLineChartDashStyle: null as string | null,
    color: s.color ?? undefined,
    dtick: s.dtick ?? undefined,
    range: s.range ?? undefined,
    isBidirectional: s.isBidirectional ?? undefined,
  }))

  return {
    chartData: {
      timestamps: chartContent?.timestamps ?? [],
      series,
    },
    aggregationTime: String(chartContent?.aggregationTime ?? secFields.subtitle ?? secFields.aggregationTime ?? ''),
    title: String(chartContent?.title ?? secFields.title ?? ''),
    newsEventItems,
  }
}

/** 비교 스냅샷(직전 버전 등)에서 해당 뉴스가 이미 소프트 삭제였는지 */
export const wasNewsFlowItemRemovedInSnapshot = (
  snapshot: INewsletterIssueSnapshotData | null | undefined,
  newsFlowSectionId: string,
  newsId: string,
): boolean => {
  if (!snapshot?.sections?.length) return false
  const sec = snapshot.sections.find((s) => s.id === newsFlowSectionId)
  if (!sec) return false
  const { newsEventItems } = getNewsFlowProps(snapshot, sec)
  const item = newsEventItems.find((i) => i.newsId === newsId)
  return item?.removed === true
}

export const getFooterProps = (
  snapshot: INewsletterIssueSnapshotData | null,
  /** 지정 시 해당 섹션만. 생략 시 첫 FOOTER */
  section?: INewsletterSnapshotSection | null,
): { footerContent: string; showLogo: boolean } => {
  const resolved =
    section ?? (snapshot?.sections?.length ? findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.FOOTER) : undefined)
  const sf = resolved?.fields ?? {}
  const noticeBlock = resolved?.blocks?.find((b) => (b.id ?? '').includes('FOOTER_NOTICE') || b.type === 'TEXT')
  const noticeFields = getBlockFields<{ showLogo?: boolean }>(noticeBlock)
  return {
    footerContent: String(sf.footerContent ?? ''),
    showLogo: noticeFields?.showLogo !== false,
  }
}

export const getMarketTimes = (_snapshot: INewsletterIssueSnapshotData | null): { marketOpenTime: number; marketCloseTime: number } => ({
  marketOpenTime: 0,
  marketCloseTime: 24 * 60 * 60 * 1000,
})

const isNonEmptyTrimmed = (v: unknown): boolean => String(v ?? '').trim() !== ''

const isNewsFlowCreateTimeFieldValid = (def: ReturnType<typeof getEffectiveFieldDef>, value: unknown): boolean => {
  if (def.disabled) return true
  const t = String(value ?? '').trim()
  if (t === '') return !def.required
  return timeFormat(t) === undefined
}

export const hasNewsCardFieldDefs = (defs: Record<string, INewsletterSnapshotFieldDef> | undefined): boolean =>
  defs !== undefined && Object.keys(defs).length > 0

export type NewsletterEditSnapshotSaveValidationIssue =
  | {
      kind: 'MISSING_REQUIRED'
      path: string
      message: string
    }
  | {
      kind: 'INVALID_FORMAT'
      path: string
      message: string
    }

export type NewsletterEditSnapshotSaveValidationResult = {
  valid: boolean
  issues: NewsletterEditSnapshotSaveValidationIssue[]
}

export const validateNewsletterEditSnapshotForSave = (
  snapshot: INewsletterIssueSnapshotData | null | undefined,
): NewsletterEditSnapshotSaveValidationResult => {
  const issues: NewsletterEditSnapshotSaveValidationIssue[] = []

  const addMissing = (path: string, message: string) => issues.push({ kind: 'MISSING_REQUIRED', path, message })
  const addInvalid = (path: string, message: string) => issues.push({ kind: 'INVALID_FORMAT', path, message })

  if (!snapshot?.sections?.length) {
    addMissing('snapshot.sections', '섹션이 없습니다.')
    return { valid: false, issues }
  }

  const isActiveSection = (s: INewsletterSnapshotSection | undefined): s is INewsletterSnapshotSection =>
    !!s && s.removed !== true && s.visibility

  const coverSection = findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.COVER)
  if (isActiveSection(coverSection)) {
    const cover = getCoverProps(snapshot, coverSection)
    if (!isNonEmptyTrimmed(cover.name)) addMissing('COVER.name', 'Cover 이름이 비어있습니다.')
  }

  const dateIssueSection = findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.DATE_ISSUE)
  if (isActiveSection(dateIssueSection)) {
    const dateIssue = getDateIssueProps(snapshot, dateIssueSection)
    if (!isNonEmptyTrimmed(dateIssue.date)) addMissing('DATE_ISSUE.date', '발행일(date)이 비어있습니다.')
    if (!isNonEmptyTrimmed(dateIssue.issueNo)) addMissing('DATE_ISSUE.issueNo', '회차(issueNo)가 비어있습니다.')
  }

  const titleSection = findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.TITLE)
  if (isActiveSection(titleSection)) {
    const titleProps = getTitleProps(snapshot, titleSection)
    if (!isNonEmptyTrimmed(titleProps.title)) addMissing('TITLE.title', '타이틀(title)이 비어있습니다.')
  }

  const summarySection = findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.SUMMARY)
  if (isActiveSection(summarySection)) {
    const summaryProps = getSummaryProps(snapshot, summarySection)
    if (!isNonEmptyTrimmed(summaryProps.summary)) addMissing('SUMMARY.summary', '요약(summary)이 비어있습니다.')
  }

  const footerSection = findFirstSectionByCanonicalCode(snapshot, NEWSLETTER_SECTION_CODE.FOOTER)
  if (isActiveSection(footerSection)) {
    const footerProps = getFooterProps(snapshot, footerSection)
    if (!isNonEmptyTrimmed(footerProps.footerContent)) addMissing('FOOTER.footerContent', '푸터 내용(footerContent)이 비어있습니다.')
  }

  const relatedNewsSection = findPrimaryRelatedNewsSection(snapshot)
  const newsFlowProps = getNewsFlowProps(snapshot)
  if (isActiveSection(relatedNewsSection)) {
    const dFlowTitle = getEffectiveFieldDef(relatedNewsSection.fieldDefs, 'title')
    const dFlowAgg = getEffectiveFieldDef(relatedNewsSection.fieldDefs, 'aggregationTime')
    if (!dFlowTitle.disabled && dFlowTitle.required && !isNonEmptyTrimmed(newsFlowProps.title)) {
      addMissing('NEWS_FLOW.title', '뉴스플로우 섹션 제목(title)이 비어있습니다.')
    }
    if (!dFlowAgg.disabled && dFlowAgg.required && !isNonEmptyTrimmed(newsFlowProps.aggregationTime)) {
      addMissing('NEWS_FLOW.aggregationTime', '뉴스플로우 집계시간(aggregationTime)이 비어있습니다.')
    }

    const visibleItems = filterVisibleNewsFlowItems(newsFlowProps.newsEventItems).filter((n) => n.visibility !== false)
    for (let idx = 0; idx < visibleItems.length; idx += 1) {
      const item = visibleItems[idx]
      const itemKey = item.newsId ? `newsId=${item.newsId}` : `idx=${idx}`
      const basePath = `NEWS_FLOW.newsEventItems[${itemKey}]`

      const fd = item.fieldDefs
      const useStrictNews = !hasNewsCardFieldDefs(fd)

      if (useStrictNews) {
        if (!isNonEmptyTrimmed(item.createdDate)) addMissing(`${basePath}.createdDate`, '뉴스 발행일(createdDate)이 비어있습니다.')
        if (isNonEmptyTrimmed(item.createTime) && !isNewsFlowCreateTimeFieldValid({ disabled: false, required: false }, item.createTime)) {
          addInvalid(`${basePath}.createTime`, '뉴스 시간(createTime) 형식이 올바르지 않습니다.')
        }
        if (!isNonEmptyTrimmed(item.title)) addMissing(`${basePath}.title`, '제목(title)이 비어있습니다.')
        if (!isNonEmptyTrimmed((item.content ?? []).join('\n\n'))) addMissing(`${basePath}.content`, '내용(content)이 비어있습니다.')
        continue
      }

      const dDate = getEffectiveFieldDef(fd, 'createdDate')
      const dTime = getEffectiveFieldDef(fd, 'createTime')
      const dSource = getEffectiveFieldDef(fd, 'source')
      const dLink = getEffectiveFieldDef(fd, 'originalLink')
      const dTitle = getEffectiveFieldDef(fd, 'title')
      const dContent = getEffectiveFieldDef(fd, 'content')

      if (!dDate.disabled && dDate.required && !isNonEmptyTrimmed(item.createdDate))
        addMissing(`${basePath}.createdDate`, 'createdDate가 비어있습니다.')
      if (!isNonEmptyTrimmed(item.createTime)) {
        if (!dTime.disabled && dTime.required) addMissing(`${basePath}.createTime`, 'createTime이 비어있습니다.')
      } else if (!isNewsFlowCreateTimeFieldValid(dTime, item.createTime)) {
        addInvalid(`${basePath}.createTime`, 'createTime 형식이 올바르지 않습니다.')
      }
      if (!dSource.disabled && dSource.required && !isNonEmptyTrimmed(item.source))
        addMissing(`${basePath}.source`, 'source가 비어있습니다.')
      if (!dLink.disabled && dLink.required && !isNonEmptyTrimmed(item.originalLink))
        addMissing(`${basePath}.originalLink`, 'originalLink가 비어있습니다.')
      if (!dTitle.disabled && dTitle.required && !isNonEmptyTrimmed(item.title)) addMissing(`${basePath}.title`, 'title이 비어있습니다.')
      const contentJoined = (item.content ?? []).join('\n\n')
      if (!dContent.disabled && dContent.required && !isNonEmptyTrimmed(contentJoined))
        addMissing(`${basePath}.content`, 'content가 비어있습니다.')
    }
  }

  for (const section of getOrderedReferenceSections(snapshot)) {
    if (isReferenceSectionRemoved(section) || !section.visibility) continue

    const secId = section.id ? `id=${section.id}` : `code=${String(section.code ?? '')}`
    const secPath = `REFERENCE_SECTION[${secId}]`

    const sf = section.fields ?? {}
    const secTitle = String(sf.title ?? '')
    const secDesc = String(sf.description ?? '')
    const dSecTitle = getEffectiveFieldDef(section.fieldDefs, 'title')
    const dSecDesc = getEffectiveFieldDef(section.fieldDefs, 'description')
    if (!dSecTitle.disabled && dSecTitle.required && !isNonEmptyTrimmed(secTitle))
      addMissing(`${secPath}.title`, '참고자료 섹션 제목(title)이 비어있습니다.')
    if (!dSecDesc.disabled && dSecDesc.required && !isNonEmptyTrimmed(secDesc))
      addMissing(`${secPath}.description`, '참고자료 섹션 설명(description)이 비어있습니다.')

    for (const block of getReferenceContentBlocks(section)) {
      if (isReferenceBlockRemoved(block) || !block.visibility) continue
      const blockId = block.id ? `id=${block.id}` : `type=${block.type}`
      const blockPath = `${secPath}.blocks[${blockId}]`

      if (block.type === 'TEXT') {
        if (!isNonEmptyTrimmed(block.title)) addMissing(`${blockPath}.title`, 'TEXT 블록 제목(title)이 비어있습니다.')
      }
      if (block.type === 'IMAGE') {
        if (!isNonEmptyTrimmed(block.title)) addMissing(`${blockPath}.title`, 'IMAGE 블록 제목(title)이 비어있습니다.')
      }
    }
  }

  return { valid: issues.length === 0, issues }
}

/**
 * 편집 UI(필수 표시·시간 형식)와 맞춘 저장 가능 여부.
 * `fieldDefs`가 없는 뉴스 카드는 {@link AddNewsModal} 기본 모드와 동일하게 처리합니다(시간 비필수, 입력 시 형식만 검사).
 */
export const isNewsletterEditSnapshotValidForSave = (snapshot: INewsletterIssueSnapshotData | null | undefined): boolean =>
  validateNewsletterEditSnapshotForSave(snapshot).valid

export const parseNewsletterIssueSnapshotData = (raw: unknown): INewsletterIssueSnapshotData | null => {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.sections)) return null
  return raw as INewsletterIssueSnapshotData
}

export const emptyNewsletterIssueSnapshotData = (): INewsletterIssueSnapshotData => ({
  meta: {},
  sections: [],
})
