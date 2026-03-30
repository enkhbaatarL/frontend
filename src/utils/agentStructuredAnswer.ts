import type { ParsedTable, Source } from '@/utils/agentMarkdownExtractor'

import { StreamEventType, type RelatedDataType } from '@/service/mi/agent'

export interface StructuredTableHeader {
  field: string
  name: string
}

export interface StructuredTableRow {
  cells: string[]
}

export interface StructuredTable {
  tableId: string | null
  headers: StructuredTableHeader[]
  rows: StructuredTableRow[]
}

export interface StructuredRelatedDataItem {
  type: RelatedDataType | string
  goodsNo: number
  goodsDataNo: number
  displayNm: string
}

export interface StructuredSourceItem {
  url: string
  sourceNm: string
}

export interface StructuredSeriesItem {
  order: number
  type: string
  legend: string
  timestamps: string[]
  values: number[]
}

export interface StructuredAgentData {
  tables?: StructuredTable[]
  /** API에 따라 단일 객체 또는 배열로 올 수 있음 */
  relatedData?: StructuredRelatedDataItem | StructuredRelatedDataItem[]
  sources?: StructuredSourceItem[]
  series?: StructuredSeriesItem[]
  content?: string
}

export interface StructuredAgentPayload {
  qnaNo?: number
  data: StructuredAgentData
}

/**
 * SSE/REST에서 message 필드가 JSON 문자열이 아니라 이미 파싱된 객체로 올 때가 있음.
 * parseStructuredAgentMessage 가 기대하는 봉투(`data` 포함) 형태의 문자열로 맞춘다.
 */
export const normalizeAgentMessagePayload = (streamData: unknown): string => {
  if (streamData === null || streamData === undefined) return ''
  if (typeof streamData === 'string') return streamData
  if (typeof streamData !== 'object') return ''

  const o = streamData as Record<string, unknown>
  if ('data' in o && o.data !== null && typeof o.data === 'object') {
    return JSON.stringify(streamData)
  }
  if ('content' in o || 'sources' in o || 'tables' in o || 'series' in o || 'relatedData' in o) {
    return JSON.stringify({ data: streamData })
  }
  return ''
}

/**
 * QnA 히스토리/REST 응답에서 `answer.message`만 쓰지 않고, 본문이 `answer` 루트의 content·sources 등과 같이 올 수 있음.
 * 스트리밍 FULLTEXT와 동일하게 파싱 가능한 단일 문자열로 합친다.
 */
export const resolveChatAnswerMessageString = (answer: null | undefined | Record<string, unknown>): string => {
  if (!answer) return ''
  const msg = answer[StreamEventType.MESSAGE]
  let s = normalizeAgentMessagePayload(msg)
  if (s) return s
  s = normalizeAgentMessagePayload(answer)
  if (s) return s
  if (typeof msg === 'string') return msg
  return ''
}

export const parseStructuredAgentMessage = (raw: string): StructuredAgentPayload | null => {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{')) return null

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const root = parsed as Record<string, unknown>
    if (!('data' in root) || root.data === null || typeof root.data !== 'object') return null

    return parsed as StructuredAgentPayload
  } catch {
    return null
  }
}

/** 스트리밍 중 JSON이 아직 닫히지 않았을 때 본문에 원문 JSON이 깜빡이지 않도록 판별 */
export const isIncompleteStructuredAgentEnvelope = (raw: string): boolean => {
  if (!raw?.trim().startsWith('{') || parseStructuredAgentMessage(raw)) return false
  return /"qnaNo"\s*:/.test(raw) && /"data"\s*:\s*\{/.test(raw)
}

export const structuredSourcesToSources = (items: StructuredSourceItem[]): Source[] =>
  items.map((s, i) => ({
    index: `web_${i + 1}`,
    sourceNm: s.sourceNm,
    url: s.url,
  }))

export const structuredTablesToParsedTables = (tables: StructuredTable[]): ParsedTable[] =>
  tables.map((table, tableIndex) => ({
    tableId:
      table.tableId !== null && table.tableId !== undefined && String(table.tableId) !== ''
        ? String(table.tableId)
        : `structured-table-${tableIndex}`,
    headers: table.headers.map((h) => h.name),
    rows: table.rows.map((r) => [...r.cells]),
  }))

const isValidRelatedDataItem = (item: unknown): item is StructuredRelatedDataItem => {
  if (item === null || item === undefined || typeof item !== 'object') return false
  const o = item as Record<string, unknown>
  return typeof o.displayNm === 'string'
}

export const normalizeStructuredRelatedData = (
  related: StructuredRelatedDataItem | StructuredRelatedDataItem[] | undefined,
): StructuredRelatedDataItem[] => {
  if (related === null || related === undefined) return []
  const list = Array.isArray(related) ? related : [related]
  return list.filter(isValidRelatedDataItem)
}
