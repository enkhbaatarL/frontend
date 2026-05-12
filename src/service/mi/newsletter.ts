import axios, { AxiosError, AxiosResponse } from 'axios'
import { applyPatch, compare, type Operation } from 'fast-json-patch'
import { cloneDeep } from 'lodash-es'

import api, { apiExplicitBearer } from '@/lib/axios'
import { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse, IPaginationRequest, IPaginationResponse } from '@/types/api'
import { canonicalizeSnapshotLikeServer } from '@/utils/newsletterSnapshotCanonicalize'

export enum NewsletterDetailPageMode {
  VIEW = 'view',
  EDIT = 'edit',
  CAPTURE = 'capture',
  REVISION = 'revision',
}

export enum NewsletterStatus {
  PUBLISHED = 'PUBLISHED',
  BLANK = 'BLANK',
}

export enum NewsletterFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  ON_DEMAND = 'ON_DEMAND',
}

export const FREQUENCY_LABEL: Record<NewsletterFrequency, string> = {
  [NewsletterFrequency.DAILY]: 'Daily',
  [NewsletterFrequency.WEEKLY]: 'Weekly',
  [NewsletterFrequency.ON_DEMAND]: 'On Demand',
}

export interface INewsletterItem {
  newsletterId: string
  date: string
  issueNo: string
  name: string
  title: string
  status: NewsletterStatus
}

export interface INewsletterListRequest extends IPaginationRequest {
  companyNo: number
  keyword?: string
  dateFilter?: string
}

export interface IFeaturedNewsletterListRequest extends IPaginationRequest {
  companyNo: number
}

export interface IFeaturedNewsletterItem {
  newsletterId: string
  frequency: NewsletterFrequency
  name: string
  description: string
  subscribed: boolean
  issueNo: string
  imageBase64: string
  enabled: boolean
}

export interface INewsletterIssue {
  date: string
  no: string
}

export interface INewsletterIssueResponse {
  newsletterId: string
  issuedList: INewsletterIssue[]
}

export interface ISeriesData {
  seriesId: string
  label: string
  renderAs: string
  values: number[]
  isVisible: boolean
  isLineChartDashStyle: string | null
  color?: string
  dtick?: number
  range?: number[]
  isBidirectional?: boolean
}

export interface IChartData {
  timestamps: number[]
  series: ISeriesData[]
}

export interface INewsFlowChartData {
  title: string
  aggregationTime: string
  chartData: IChartData
}

/** 스냅샷 필드 정의 (API `fieldDefs` 항목) */
export interface INewsletterSnapshotFieldDef {
  editable: boolean
  required: boolean
}

export interface IRelatedNewsEventItem {
  newsId: string
  title: string
  content: string[]
  timestamp?: number
  createdDate: string
  createTime: string
  source: string
  /** 원문 링크 (Figma: 원문 링크 필드) */
  originalLink?: string
  showInChart: boolean
  trend?: 'UP' | 'DOWN' | 'NONE' | ''
  /**
   * 소프트 삭제 — 블록 `state.removed`·`visibility`와 동기. 제거 시 스냅샷에서 행을 지우지 않음(백엔드 JSON Patch·리플레이 대응).
   */
  removed?: boolean
  /**
   * 편집기 눈 아이콘 숨김 처리.
   * - `false`면 view/미리보기/이메일에서 렌더에서 제외됩니다.
   * - `removed`와는 별개로 존재할 수 있지만, 현재 저장 로직에서는 보통 같이 동기화됩니다.
   */
  visibility?: boolean
  /** 뉴스 카드 블록 `fieldDefs` — 필드별 editable/required */
  fieldDefs?: Record<string, INewsletterSnapshotFieldDef>
}

/** 참고자료 TABLE 블록 `INewsletterSnapshotBlock.fields.tableData` 형태 */
export interface IReferenceTableData {
  tableId: string
  headers: { field: string; name: string }[]
  rows: { cells: string[] }[]
}

export type NewsletterSnapshotBlockType = 'IMAGE' | 'TEXT' | 'TITLE' | 'CHART' | 'NEWS_CARD' | 'TABLE'

/** 스냅샷 블록 (`snapshot.data.sections[].blocks[]`) */
export interface INewsletterSnapshotBlock {
  id: string
  type: NewsletterSnapshotBlockType
  order: number
  title: string
  fields?: Record<string, unknown>
  format?: string
  fieldDefs?: Record<string, INewsletterSnapshotFieldDef>
  visibility: boolean
  state?: { removed?: boolean }
  target?: string
  plotOnChart?: boolean
}

/** 스냅샷 섹션 (`snapshot.data.sections[]`) */
export interface INewsletterSnapshotSection {
  id: string
  code: string
  name: string
  type: 'FIXED' | 'SPECIALIZED' | 'GENERAL'
  order: number
  blocks: INewsletterSnapshotBlock[]
  fields?: Record<string, unknown>
  /** 생략 시 미삭제로 간주 */
  removed?: boolean
  fieldDefs?: Record<string, INewsletterSnapshotFieldDef>
  visibility: boolean
  target?: string
}

export interface INewsletterIssueSnapshotMeta {
  emailSubject?: string
}

/**
 * 발행호 상세의 `snapshot.data` — 메일 본문·편집기 상태의 단일 소스.
 */
export interface INewsletterIssueSnapshotData {
  meta?: INewsletterIssueSnapshotMeta
  sections: INewsletterSnapshotSection[]
}

/**
 * Title 섹션 `sections[].fields` — API 스냅샷 키와 동일.
 * `INewsletterIssueDetail.snapshot.data` 안의 해당 섹션 fields에 대응합니다.
 */
export interface INewsletterTitleSectionFields {
  title?: string
  subtitle?: string
  priceChangeFrom?: number
  priceChangeTo?: number
}

/** `getTitleProps()` 결과 — 메일·툴바·편집기에 넘기기 위한 정규화 뷰 */
export type INewsletterTitleViewProps = {
  title: string
  subtitle: string
  priceChangeFrom: number | undefined
  priceChangeTo: number | undefined
}

/** JSON Patch 한 건 — 백엔드 JsonPatchOpRes / 히스토리 델타와 동일 */
export interface IJsonPatchOpRes {
  op: string
  path: string
  value?: unknown
  /** move / copy 연산의 소스 경로 */
  from?: string
}

/** 발행호 상세의 `revision` — 백엔드 NewsletterDetailV2Res.RevisionStateRes */
export interface INewsletterIssueRevisionState {
  revisionId: number
  editStatus: string
  currentRevisionNo: number | null
  hasDraft: boolean
  draftRevisionNo: number | null
}

export interface INewsletterIssueLatestSnapshot {
  revisionNo: number
  data: INewsletterIssueSnapshotData
  savedAt: string
}

/**
 * 발행호 상세 API 응답 (GET /mi/newsletter/{newsletterId}/{issueNo})
 * 본문은 `snapshot.data`(sections/blocks, `fields` 기반)에만 존재합니다.
 */
export interface INewsletterIssueDetail {
  newsletterId: number
  issueNo: number
  publishedAt: string
  subscribed: boolean
  revision: INewsletterIssueRevisionState | null
  snapshot: INewsletterIssueLatestSnapshot
  deltaCount: number
  deltaChanges: IJsonPatchOpRes[] | null
}

/** GET .../original-snapshot — 백엔드 NewsletterIssueOriginalSnapshotRes */
export interface INewsletterIssueOriginalSnapshotRes {
  newsletterId: number
  issueNo: number
  source: string
  snapshot: INewsletterIssueSnapshotData
}

export const getOriginalSnapshotRoot = (res: INewsletterIssueOriginalSnapshotRes | null | undefined): INewsletterIssueSnapshotData | null =>
  res?.snapshot ?? null

/** 수정 이력 API용 — `revision.revisionId` */
export const getNewsletterIssueRevisionId = (detail: INewsletterIssueDetail): number | undefined => {
  const id = detail.revision?.revisionId
  return typeof id === 'number' ? id : undefined
}

/**
 * 발행호 상세·원본 스냅샷 API 등 `INewsletterIssueDetail` 래퍼에서 본문 스냅샷만 꺼냅니다.
 * 편집·뷰·저장의 단일 소스는 항상 `snapshot.data`(sections/blocks)입니다.
 */
export const getIssueDetailSnapshotData = (detail: INewsletterIssueDetail | null | undefined): INewsletterIssueSnapshotData | null =>
  detail?.snapshot?.data ?? null

const toOperations = (deltas: IJsonPatchOpRes[]): Operation[] =>
  deltas.map((d) => {
    const op = d.op as Operation['op']
    const base: Record<string, unknown> = { op, path: d.path }
    if (d.value !== undefined) base.value = d.value
    if (d.from !== undefined) base.from = d.from
    return base as unknown as Operation
  })

const decodeJsonPointerToken = (token: string): string => token.replaceAll('~1', '/').replaceAll('~0', '~')

const hasJsonPointerPath = (document: unknown, path: string): boolean => {
  if (path === '' || path === '/') return true
  if (!path.startsWith('/')) return false

  const tokens = path.slice(1).split('/').map(decodeJsonPointerToken)
  let current = document

  for (const token of tokens) {
    if (Array.isArray(current)) {
      const index = Number(token)
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return false
      current = current[index]
      continue
    }

    if (current !== null && typeof current === 'object') {
      const obj = current as Record<string, unknown>
      if (!Object.hasOwn(obj, token)) return false
      current = obj[token]
      continue
    }

    return false
  }

  return true
}

const getJsonPointerParentPath = (path: string): string => {
  const lastSlashIndex = path.lastIndexOf('/')
  return lastSlashIndex <= 0 ? '' : path.slice(0, lastSlashIndex)
}

const getJsonPointerLastToken = (path: string): string => {
  const lastSlashIndex = path.lastIndexOf('/')
  return lastSlashIndex < 0 ? path : decodeJsonPointerToken(path.slice(lastSlashIndex + 1))
}

const NEWS_CARD_OPTIONAL_MISSING_REMOVE_FIELDS = new Set(['plotOnChart', 'timestamp'])

const getJsonPointerValue = (document: unknown, path: string): { found: boolean; value: unknown } => {
  if (path === '' || path === '/') return { found: true, value: document }
  if (!path.startsWith('/')) return { found: false, value: undefined }

  const tokens = path.slice(1).split('/').map(decodeJsonPointerToken)
  let current = document

  for (const token of tokens) {
    if (Array.isArray(current)) {
      const index = Number(token)
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return { found: false, value: undefined }
      current = current[index]
      continue
    }

    if (current !== null && typeof current === 'object') {
      const obj = current as Record<string, unknown>
      if (!Object.hasOwn(obj, token)) return { found: false, value: undefined }
      current = obj[token]
      continue
    }

    return { found: false, value: undefined }
  }

  return { found: true, value: current }
}

const getContentArrayParentPathFromItemPatchPath = (path: string): string | null => {
  const match = RegExp(/^(\/sections\/\d+\/blocks\/\d+\/fields\/content)\/\d+$/).exec(path)
  return match?.[1] ?? null
}

const coalesceContentArrayItemDeltas = (
  deltas: IJsonPatchOpRes[],
  baseSnapshot: INewsletterIssueSnapshotData,
  currentSnapshot: INewsletterIssueSnapshotData,
): IJsonPatchOpRes[] => {
  const contentParentPaths = new Set<string>()
  for (const delta of deltas) {
    const parentPath = getContentArrayParentPathFromItemPatchPath(delta.path)
    if (parentPath) contentParentPaths.add(parentPath)
  }

  if (contentParentPaths.size === 0) return deltas

  const contentReplacements = new Map<string, IJsonPatchOpRes>()
  const nextDeltas: IJsonPatchOpRes[] = []

  for (const delta of deltas) {
    const childParentPath = getContentArrayParentPathFromItemPatchPath(delta.path)
    const isDirectParentPatch = contentParentPaths.has(delta.path)
    if (!childParentPath && !isDirectParentPatch) {
      nextDeltas.push(delta)
      continue
    }

    const parentPath = childParentPath ?? delta.path
    if (contentReplacements.has(parentPath)) continue

    const currentValue = getJsonPointerValue(currentSnapshot, parentPath)
    if (currentValue.found) {
      contentReplacements.set(parentPath, {
        op: hasJsonPointerPath(baseSnapshot, parentPath) ? 'replace' : 'add',
        path: parentPath,
        value: cloneDeep(currentValue.value),
      })
    } else if (hasJsonPointerPath(baseSnapshot, parentPath)) {
      contentReplacements.set(parentPath, { op: 'remove', path: parentPath })
    }
  }

  return [...nextDeltas, ...contentReplacements.values()]
}

const getBlockPathFromPatchPath = (path: string): string | null => {
  const match = RegExp(/^(.*\/blocks\/\d+)(?:\/|$)/).exec(path)
  return match?.[1] ?? null
}

const isNewsletterSnapshotBlock = (value: unknown): value is { type?: unknown } =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isMissingPlotOnChartRemove = (document: unknown, operation: Operation): boolean =>
  operation.op === 'remove' &&
  operation.path.endsWith('/plotOnChart') &&
  hasJsonPointerPath(document, getJsonPointerParentPath(operation.path)) &&
  !hasJsonPointerPath(document, operation.path)

const isMissingNewsContentItemRemove = (document: unknown, operation: Operation): boolean => {
  if (operation.op !== 'remove' || !/\/fields\/content\/\d+$/.test(operation.path)) return false

  const parent = getJsonPointerValue(document, getJsonPointerParentPath(operation.path))
  if (!parent.found || !Array.isArray(parent.value)) return false

  const index = Number(getJsonPointerLastToken(operation.path))
  return Number.isInteger(index) && index >= parent.value.length
}

const isMissingNewsCardOptionalFieldRemove = (document: unknown, operation: Operation): boolean => {
  if (operation.op !== 'remove') return false
  const fieldName = getJsonPointerLastToken(operation.path)
  if (!NEWS_CARD_OPTIONAL_MISSING_REMOVE_FIELDS.has(fieldName)) return false

  const parent = getJsonPointerValue(document, getJsonPointerParentPath(operation.path))
  if (!parent.found || parent.value === null || typeof parent.value !== 'object' || Array.isArray(parent.value)) return false
  if (Object.hasOwn(parent.value as Record<string, unknown>, fieldName)) return false

  const blockPath = getBlockPathFromPatchPath(operation.path)
  const block = blockPath ? getJsonPointerValue(document, blockPath) : { found: false, value: undefined }
  return block.found && isNewsletterSnapshotBlock(block.value) && block.value.type === 'NEWS_CARD'
}

export const applyNewsletterSnapshotPatch = (
  base: INewsletterIssueSnapshotData,
  deltas: IJsonPatchOpRes[],
): INewsletterIssueSnapshotData => {
  let current: unknown = cloneDeep(base)
  const operations = toOperations(deltas)

  for (const operation of operations) {
    if (
      isMissingPlotOnChartRemove(current, operation) ||
      isMissingNewsContentItemRemove(current, operation) ||
      isMissingNewsCardOptionalFieldRemove(current, operation)
    ) {
      continue
    }
    const result = applyPatch(current as object, [operation], true)
    current = result.newDocument ?? result
  }

  return current as INewsletterIssueSnapshotData
}

/**
 * 발행호 상세 응답에서 "최신 스냅샷"을 계산합니다.
 * - `snapshot.data`: 서버가 저장한 기준 스냅샷(풀 스냅샷일 수도 있고 아닐 수도 있음)
 * - `deltaChanges`: 기준 스냅샷 이후 누적된 JSON Patch
 *
 * 화면 표시/편집 기준은 이 결과를 사용해야 최신 상태를 반영합니다.
 */
export const getIssueDetailEffectiveSnapshotData = (
  detail: INewsletterIssueDetail | null | undefined,
): INewsletterIssueSnapshotData | null => {
  const base = detail?.snapshot?.data ?? null
  const deltas = detail?.deltaChanges ?? null
  if (!base) return null
  if (!deltas || deltas.length === 0) return base

  try {
    return applyNewsletterSnapshotPatch(base, deltas)
  } catch (err) {
    console.warn('[newsletter] getIssueDetailEffectiveSnapshotData applyPatch 실패 — base snapshot을 사용합니다.', err)
    return base
  }
}

/**
 * 최종저장(`PUT .../revisions/save`)에 `snapshotPayload`를 넣을지 — 서버는 payload가 있을 때만 스냅샷 히스토리를 저장합니다.
 * 백엔드 설계(`newsletter-v2-design.md`): 상세 GET의 `deltaCount`로 판단, 권장 `deltaCount > 8`, 운영 조정 범위 6~10.
 */
export const NEWSLETTER_REVISION_SNAPSHOT_DELTA_THRESHOLD = 8

export const shouldAttachSnapshotPayloadOnFinalSave = (deltaCount: number): boolean =>
  deltaCount > NEWSLETTER_REVISION_SNAPSHOT_DELTA_THRESHOLD

/** 최종저장(리비전 저장) 요청 — 백엔드 RevisionSaveReq */
export interface ISaveRevisionRequest {
  revisionNo?: number | null
  deltas: IJsonPatchOpRes[]
  snapshotPayload?: INewsletterIssueSnapshotData | Record<string, unknown>
}

/** 최종저장(리비전 저장) 응답 — 백엔드 RevisionSaveRes */
export interface ISaveRevisionResponse {
  revisionId: number
  revisionNo: number
  editStatus: string
  savedAt: string | null
  lastAutoSavedAt: string | null
  snapshotSaved: boolean | null
}

/** GET .../revisions/draft — 백엔드 RevisionDraftRes */
export interface IRevisionDraftRes {
  revisionNo: number
  content: INewsletterIssueSnapshotData
  revisionType: string
  updatedAt: string
  modifier: string
}

/** 최종저장 시 동시성 충돌(409) */
export class SaveRevisionConcurrencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SaveRevisionConcurrencyError'
    Object.setPrototypeOf(this, SaveRevisionConcurrencyError.prototype)
  }
}

/** 저장 기준 revisionNo가 서버 최신 버전과 맞지 않는 경우 */
export class SaveRevisionVersionConflictError extends Error {
  constructor(
    message: string,
    public readonly responseData?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'SaveRevisionVersionConflictError'
    Object.setPrototypeOf(this, SaveRevisionVersionConflictError.prototype)
  }
}

/** 최종저장 시 검증 실패(400) */
export class SaveRevisionValidationError extends Error {
  constructor(
    public readonly code: string,
    public readonly responseData?: Record<string, unknown>,
  ) {
    super('저장 데이터 검증에 실패했습니다.')
    this.name = 'SaveRevisionValidationError'
    Object.setPrototypeOf(this, SaveRevisionValidationError.prototype)
  }
}

/** 최종저장 시 네트워크 오류 */
export class SaveRevisionNetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SaveRevisionNetworkError'
    Object.setPrototypeOf(this, SaveRevisionNetworkError.prototype)
  }
}

/** 수정 이력 항목 */
export interface IRevisionChangeItem {
  seq: number
  revisionType: string
  updatedAt: string
  modifier: string
}

/** 수정 이력 목록 응답 */
export interface IRevisionChangesResponse {
  items: IRevisionChangeItem[]
  hasNext: boolean
  nextCursor: number
}

/** 특정 수정 이력 조회 응답 — 백엔드 RevisionReplayRes */
export interface IRevisionChangeDetailResponse {
  baseSnapshot: {
    seq: number
    data: INewsletterIssueSnapshotData
  }
  fromSeq: number
  toSeq: number
  histories: Array<{
    seq: number
    deltas: IJsonPatchOpRes[]
  }>
}

/**
 * POST /mi/newsletter/{newsletterId}/{issueNo}/send-mail — multipart `request` JSON
 * (백엔드 NewsletterMailSendReq)
 */
export interface INewsletterMailSendReq {
  /** 메일 제목 */
  subject: string
  /** 메일 HTML 본문 */
  htmlBody: string
  /** To 수신자. 미입력 시 요청 사용자 이메일로 발송 */
  recipientEmails?: string[]
  /** CC 참조 */
  ccEmails?: string[]
  /** BCC 숨은 참조 */
  bccEmails?: string[]
  /**
   * 예약 발송 시각(ISO-8601). 과거/미입력은 즉시 발송, 미래 값은 API 미지원.
   */
  scheduledAt?: string | null
}

/** GET/PUT/DELETE /mi/newsletter/{newsletterId}/subscription — 현재 사용자 구독 상태 */
export interface INewsletterSubscriptionStatus {
  newsletterId: string
  subscribed: boolean
  /** 구독한 적 없으면 생략될 수 있음 */
  subscribedAt?: string | null
  /** 미구독 상태에서만 의미; 없으면 생략될 수 있음 */
  unsubscribedAt?: string | null
}

const buildRevisionSaveBody = (params: {
  baseSnapshot: INewsletterIssueSnapshotData
  currentState: INewsletterIssueSnapshotData
  revisionNo?: number | null
  includeSnapshotPayload?: boolean
}): ISaveRevisionRequest => {
  const { baseSnapshot, currentState, revisionNo, includeSnapshotPayload } = params
  const baseNorm = canonicalizeSnapshotLikeServer(baseSnapshot)
  const currentNorm = canonicalizeSnapshotLikeServer(currentState)

  const rawDeltas = compare(cloneDeep(baseNorm) as object, cloneDeep(currentNorm) as object) as IJsonPatchOpRes[]
  const deltas = coalesceContentArrayItemDeltas(rawDeltas, baseNorm, currentNorm)

  const body: ISaveRevisionRequest = {
    ...(revisionNo !== undefined && revisionNo !== null ? { revisionNo } : {}),
    deltas: deltas.map(({ op, path, value }) => {
      const patch: IJsonPatchOpRes = { op, path }
      if (value !== undefined) {
        patch.value = value
      } else if (op !== 'remove') {
        patch.value = null
      }
      return patch
    }),
  }

  if (includeSnapshotPayload) {
    body.snapshotPayload = cloneDeep(currentNorm) as unknown as INewsletterIssueSnapshotData
  }

  return body
}

const isRevisionVersionConflictResponse = (data: unknown): data is Record<string, unknown> => {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return false
  const { code, message } = data as { code?: unknown; message?: unknown }
  return code === 'REVISION_VERSION_CONFLICT' || (typeof message === 'string' && message.includes('REVISION_VERSION_CONFLICT'))
}

const mapRevisionSaveAxiosError = (err: unknown): never => {
  if (err instanceof AxiosError) {
    const status = err.response?.status
    const responseData = err.response?.data as Record<string, unknown> | undefined
    const code = (err.response?.data as { code?: string })?.code
    if (isRevisionVersionConflictResponse(responseData)) {
      throw new SaveRevisionVersionConflictError('최신 버전과 맞지 않는 임시저장본입니다.', responseData)
    }
    if (status === 409) {
      throw new SaveRevisionConcurrencyError('다른 사용자가 수정한 내용과 충돌했습니다. 페이지를 새로고침 후 다시 시도해 주세요.')
    }
    if (status === 400) {
      throw new SaveRevisionValidationError(code ?? 'VALIDATION_ERROR', err.response?.data as Record<string, unknown>)
    }
    if (err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      throw new SaveRevisionNetworkError('네트워크 연결을 확인해 주세요.')
    }
  }
  throw err
}

/**
 * 뉴스레터 서비스
 */
const newsletterService = {
  /**
   * 뉴스레터 목록을 조회합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수, keyword: 검색어 }
   */
  async getNewsletterList(params: Partial<INewsletterListRequest>): Promise<IPaginationResponse<INewsletterItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INewsletterItem>>> = await api.get('mi/newsletter', {
      params,
    })

    return response.data.data
  },

  /**
   * 뉴스레터 featured(추천) 목록을 조회합니다.
   * 각 뉴스레터별로 가장 최근 발행된 호를 반환합니다.
   * @param params - { page: 페이지 번호, size: 페이지당 항목 수 }
   */
  async getFeaturedNewsletters(params?: Partial<IFeaturedNewsletterListRequest>): Promise<IPaginationResponse<IFeaturedNewsletterItem>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IFeaturedNewsletterItem>>> = await api.get(
      '/mi/newsletter/featured',
      {
        params,
      },
    )
    return response.data.data
  },

  /**
   * 특정 뉴스레터의 발행 리스트를 조회합니다.
   * @param {number} companyNo - 회사 번호
   * @param {string} newsletterId - 뉴스레터 ID
   * @returns {Promise<{ date: string; no: string }[]>} 발행 리스트
   */
  async getNewsletterIssues(companyNo: number, newsletterId: string): Promise<INewsletterIssueResponse> {
    const response: AxiosResponse<ICommonResponse<INewsletterIssueResponse>> = await api.get(`/mi/newsletter/${newsletterId}/issues`, {
      params: {
        companyNo,
      },
    })
    return response.data.data
  },

  /**
   * 특정 뉴스레터의 특정 발행호 상세 정보를 조회합니다.
   * @param {number} companyNo - 회사 번호
   * @param {string} newsletterId - 뉴스레터 ID
   * @param {string} issueNo - 발행호 번호
   * @returns {Promise<INewsletterIssueDetail>} 뉴스레터 발행호 상세 정보
   */
  async getNewsletterIssueDetail(companyNo: number, newsletterId: string, issueNo: string): Promise<INewsletterIssueDetail> {
    const response: AxiosResponse<ICommonResponse<INewsletterIssueDetail>> = await api.get(
      withCustomBaseUrl(`mi/newsletter/${newsletterId}/${issueNo}`),
      {
        params: {
          companyNo,
        },
      },
    )
    return response.data.data
  },

  /**
   * 발행된 호의 org_snpsht_json 원본 스냅샷만 조회합니다.
   * 본문은 `snapshot`에만 있으며 상세 GET의 `snapshot.data` 래퍼와 다릅니다.
   */
  async getNewsletterOriginalSnapshot(
    companyNo: number,
    newsletterId: string,
    issueNo: string,
  ): Promise<INewsletterIssueOriginalSnapshotRes> {
    const response: AxiosResponse<ICommonResponse<INewsletterIssueOriginalSnapshotRes>> = await api.get(
      withCustomBaseUrl(`mi/newsletter/${newsletterId}/${issueNo}/original-snapshot`),
      {
        params: {
          companyNo,
        },
      },
    )

    return response.data.data
  },

  /**
   * PUT /mi/newsletter/{newsletterId}/subscription — 현재 사용자를 구독 상태로 변경합니다. 멱등합니다.
   * @param newsletterId - 뉴스레터 마스터 ID
   */
  async subscribeNewsletter(newsletterId: string | number): Promise<INewsletterSubscriptionStatus> {
    const response = await api.put<ICommonResponse<INewsletterSubscriptionStatus>>(
      `/mi/newsletter/${newsletterId}/subscription`,
      {},
      { headers: { 'Content-Type': 'application/json' } },
    )
    return response.data.data
  },

  /**
   * DELETE /mi/newsletter/{newsletterId}/subscription — 현재 사용자를 미구독 상태로 변경합니다. 멱등합니다.
   * @param newsletterId - 뉴스레터 마스터 ID
   */
  async unsubscribeNewsletter(newsletterId: string | number): Promise<INewsletterSubscriptionStatus> {
    const response = await api.delete<ICommonResponse<INewsletterSubscriptionStatus>>(`/mi/newsletter/${newsletterId}/subscription`)
    return response.data.data
  },

  /**
   * 구독/해제 토글용 — 구독 시 {@link subscribeNewsletter}, 해제 시 {@link unsubscribeNewsletter}를 호출합니다.
   */
  async updateNewsletterSubscribed(newsletterId: string, subscribed: boolean): Promise<boolean> {
    const data = subscribed ? await this.subscribeNewsletter(newsletterId) : await this.unsubscribeNewsletter(newsletterId)
    return data.subscribed
  },

  /**
   * 편집본(리비전 저장본) 메일을 발송합니다.
   * `multipart/form-data`: `request`(NewsletterMailSendReq JSON) + `images`.
   * recipientEmails(To) 미입력 시 요청 사용자 이메일로 발송합니다.
   */
  async sendEditionMail(
    newsletterId: number,
    issueNo: string,
    params: {
      subject: string
      htmlBody: string
      recipientEmails?: string[]
      ccEmails?: string[]
      bccEmails?: string[]
      images?: File[]
      scheduledAt?: string | null
    },
  ): Promise<void> {
    const { htmlBody, images, subject, recipientEmails, ccEmails, bccEmails, scheduledAt } = params
    const formData = new FormData()

    const request: INewsletterMailSendReq = {
      subject,
      htmlBody,
      ...(recipientEmails && recipientEmails.length > 0 ? { recipientEmails } : {}),
      ...(ccEmails && ccEmails.length > 0 ? { ccEmails } : {}),
      ...(bccEmails && bccEmails.length > 0 ? { bccEmails } : {}),
      ...(typeof scheduledAt === 'string' && scheduledAt.length > 0 ? { scheduledAt } : {}),
    }

    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }), 'request.json')

    if (images && images.length > 0) {
      images.forEach((image) => formData.append('images', image))
    }

    await api.post<ICommonResponse<string>>(`/mi/newsletter/${newsletterId}/${issueNo}/send-mail`, formData, {
      timeout: 0,
    })
  },

  /**
   * 뉴스레터 리비전을 최종저장합니다.
   * @param newsletterId - 뉴스레터 ID
   * @param issueNo - 발행호 번호
   * @param body - revisionNo, deltas(JSON Patch), snapshotPayload
   * @returns 저장된 리비전 정보
   */
  async saveRevisions(newsletterId: string | number, issueNo: string | number, body: ISaveRevisionRequest): Promise<ISaveRevisionResponse> {
    const response = await api.put<ICommonResponse<ISaveRevisionResponse>>(
      `/mi/newsletter/${newsletterId}/${issueNo}/revisions/save`,
      body,
      { headers: { 'Content-Type': 'application/json' } },
    )
    return response.data.data
  },

  /**
   * 임시저장(리비전 draft) — 백엔드 RevisionSaveReq와 동일 본문.
   */
  async saveRevisionsDraft(
    newsletterId: string | number,
    issueNo: string | number,
    body: ISaveRevisionRequest,
  ): Promise<ISaveRevisionResponse> {
    const response = await api.put<ICommonResponse<ISaveRevisionResponse>>(
      `/mi/newsletter/${newsletterId}/${issueNo}/revisions/draft`,
      body,
      { headers: { 'Content-Type': 'application/json' } },
    )
    return response.data.data
  },

  /**
   * 최신 임시저장본 조회 — `revision.hasDraft === true`일 때 편집 진입 시 명시적으로 불러올 때 사용.
   */
  async getRevisionDraft(newsletterId: string | number, issueNo: string | number): Promise<IRevisionDraftRes> {
    const response = await api.get<ICommonResponse<IRevisionDraftRes>>(`/mi/newsletter/${newsletterId}/${issueNo}/revisions/draft`)
    return response.data.data
  },

  /**
   * Delta(JSON Patch) 추출 후 임시저장 API를 호출합니다.
   */
  async saveDraftRevision(params: {
    baseSnapshot: INewsletterIssueSnapshotData
    currentState: INewsletterIssueSnapshotData
    newsletterId: string | number
    issueNo: string | number
    revisionNo?: number | null
  }): Promise<ISaveRevisionResponse> {
    const { baseSnapshot, currentState, newsletterId, issueNo, revisionNo } = params
    const body = buildRevisionSaveBody({ baseSnapshot, currentState, revisionNo, includeSnapshotPayload: false })
    try {
      return await this.saveRevisionsDraft(newsletterId, issueNo, body)
    } catch (err: unknown) {
      throw mapRevisionSaveAxiosError(err)
    }
  },

  /**
   * Delta(JSON Patch) 추출 후 최종저장 API를 호출합니다.
   * `deltaCount`가 {@link shouldAttachSnapshotPayloadOnFinalSave}일 때만 `snapshotPayload`를 넣어 스냅샷 히스토리를 갱신합니다.
   */
  async saveFinalRevision(params: {
    baseSnapshot: INewsletterIssueSnapshotData
    currentState: INewsletterIssueSnapshotData
    newsletterId: string | number
    issueNo: string | number
    /** 서버 `REVISION_VERSION_CONFLICT` 방지 — 상세 `snapshot.revisionNo` 전달 */
    revisionNo?: number | null
    /** 발행호 상세 GET의 `deltaCount`(누적 델타 수). 미전달 시 0으로 간주 */
    deltaCount?: number | null
  }): Promise<ISaveRevisionResponse> {
    const { baseSnapshot, currentState, newsletterId, issueNo, revisionNo, deltaCount } = params

    const includeSnapshotPayload = shouldAttachSnapshotPayloadOnFinalSave(deltaCount ?? 0)

    const body = buildRevisionSaveBody({
      baseSnapshot,
      currentState,
      revisionNo,
      includeSnapshotPayload,
    })
    try {
      return await this.saveRevisions(newsletterId, issueNo, body)
    } catch (err: unknown) {
      throw mapRevisionSaveAxiosError(err)
    }
  },

  /**
   * 수정 이력 목록을 조회합니다.
   * @param newsletterId - 뉴스레터 ID
   * @param issueNo - 발행호 번호
   * @param revisionId - 리비전 ID
   * @returns 수정 이력 목록 (items, hasNext, nextCursor)
   */
  async getRevisionChanges(
    newsletterId: string | number,
    issueNo: string | number,
    revisionId: string | number,
  ): Promise<IRevisionChangesResponse> {
    const response = await api.get<ICommonResponse<IRevisionChangesResponse>>(
      `/mi/newsletter/${newsletterId}/${issueNo}/revisions/${revisionId}/changes`,
    )
    return response.data.data
  },

  /**
   * 특정 수정 이력을 조회합니다.
   * @param newsletterId - 뉴스레터 ID
   * @param issueNo - 발행호 번호
   * @param revisionId - 리비전 ID
   * @param seq - 시퀀스 번호
   * @returns baseSnapshot, fromSeq, toSeq, histories
   */
  async getRevisionChangeDetail(
    newsletterId: string | number,
    issueNo: string | number,
    revisionId: string | number,
    seq: string | number,
  ): Promise<IRevisionChangeDetailResponse> {
    const response = await api.get<ICommonResponse<IRevisionChangeDetailResponse>>(
      `/mi/newsletter/${newsletterId}/${issueNo}/revisions/${revisionId}/changes/${seq}`,
    )
    return response.data.data
  },

  /**
   * 현재 사용자의 뉴스레터 구독 상태를 조회합니다.
   * @param newsletterId - 뉴스레터 마스터 ID
   */
  async getNewsletterSubscription(newsletterId: string | number): Promise<INewsletterSubscriptionStatus> {
    const response = await api.get<ICommonResponse<INewsletterSubscriptionStatus>>(`/mi/newsletter/${newsletterId}/subscription`)
    return response.data.data
  },
}

/**
 * GET /api/v1/mi/internal/newsletter/render-data
 * Authorization: Bearer JWT — 발행 대상은 토큰으로 서버가 판별 (newsletterId, issueNo)
 */
export const normalizeInternalRenderDataPayload = (body: unknown): INewsletterIssueSnapshotData => {
  const root = body as ICommonResponse<unknown> | undefined
  const d = root?.data
  if (!d || typeof d !== 'object') {
    throw new Error('render-data 응답에 data가 없습니다.')
  }
  const obj = d as Record<string, unknown>
  if (Array.isArray(obj.sections)) {
    return obj as unknown as INewsletterIssueSnapshotData
  }
  const snap = obj.snapshot as { data?: INewsletterIssueSnapshotData } | undefined
  if (snap?.data && Array.isArray(snap.data.sections)) {
    return snap.data
  }
  throw new Error('render-data 응답 형식이 올바르지 않습니다. sections가 필요합니다.')
}

export const fetchInternalNewsletterRenderData = async (bearerToken: string): Promise<INewsletterIssueSnapshotData> => {
  try {
    const { data: body } = await apiExplicitBearer.get<ICommonResponse<unknown>>('mi/internal/newsletter/render-data', {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: 'application/json',
      },
    })
    return normalizeInternalRenderDataPayload(body)
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const payload = e.response?.data as { message?: string; data?: { message?: string } } | undefined
      const msg = payload?.message ?? payload?.data?.message ?? `render-data 요청 실패 (${e.response?.status ?? 'network'})`
      throw new Error(msg)
    }
    throw e
  }
}

export default newsletterService
