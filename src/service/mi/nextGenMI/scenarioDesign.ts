import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { AxiosResponse } from 'axios'

import type { IScenarioEventBundle, IScenarioGroupEvidence, ScenarioRole } from '@/service/mi/nextGenMI/scenarioGroup'

import api from '@/lib/axios'
import i18n from '@/lib/i18n'
import useAuthStore from '@/store/useAuthStore'
import { ICommonResponse } from '@/types/api'

export type ScenarioDesignGroupStatus = 'CREATING' | 'CREATED' | 'REALIZED' | 'creating' | 'created' | 'realized'

export type ScenarioDesignStage = 'READY' | 'SCENARIO_CREATED' | 'SCENARIO_VALIDATED' | 'SIGNPOST_CREATED' | 'COMPLETED'

export type ScenarioDesignStageValue =
  | ScenarioDesignStage
  | 'ready'
  | 'scenario_created'
  | 'scenario_validated'
  | 'signpost_created'
  | 'completed'

export type ScenarioSignpostStrength = 'verystrong' | 'strong' | 'medium' | 'weak' | 'veryweak'

export type ScenarioDesignStatusCode = 'designable' | 'unavailable' | 'creating' | 'created'

export type ScenarioDesignStep = 'step1' | 'step2'

export type ScenarioGroupCreationPhase = 'event_analysis' | 'dimension_design' | 'scenario_synthesis' | 'persistence'

export type ScenarioGroupCreationOperationStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'interrupted'

export interface ScenarioDesignStartV4 {
  miEventIds: number[]
  operationId?: string
  lastSequence?: number
}

export interface GetScenarioDesignStatusParams {
  miEventIds: number[]
}

export interface ScenarioDesignStatus {
  designStatus?: ScenarioDesignStatusCode | string
  designStatusLabel?: string
  scenarioGroupId?: number | null
  designStep?: ScenarioDesignStep | string | null
  designStepLabel?: string | null
  occupied?: boolean
  occupantUserId?: number | null
  occupantUserName?: string | null
  mine?: boolean | null
}

export interface ScenarioDesignStageData {
  scenarioGroupId?: number
  status?: ScenarioDesignGroupStatus
  stage?: ScenarioDesignStageValue
}

export type ScenarioDesignStreamEventType = 'connected' | 'generation' | 'validation' | 'signposts'

export interface ScenarioDesignStreamEventData {
  scenarioGroupId?: number
  type?: 'generation' | 'validation' | 'signposts'
  result?: 'success' | 'failure'
  reason?: string | null
  stage?: ScenarioDesignStageValue
}

export interface ScenarioGroupCreationStreamData {
  operationId?: string
  scenarioGroupId?: number
  sequence?: number
  eventType?: string
  phase?: ScenarioGroupCreationPhase | string
  title?: string | null
  messageMarkdown?: string | null
  snapshotRevision?: number | null
  status?: ScenarioGroupCreationOperationStatus | string | null
}

export interface ScenarioDimensionColumn {
  key?: string
  label?: string
  /** 분기 항목 선정 근거 (헤더 인포 툴팁) */
  description?: string | null
}

export interface ScenarioDimension {
  key?: string
  label?: string
  value?: string | null
  valueLabel?: string | null
  valueId?: string | null
  /** 해당 시나리오에 기준값이 적용된 사유 (셀 인포 툴팁) */
  rationale?: string | null
}

export type ScenarioDesignScenarioType = 'BR' | 'BL' | 'MX'

export type ScenarioPressureBand = 'strong_bullish' | 'bullish' | 'balanced_bearish' | 'strong_bearish'

export interface ScenarioSignpostDefinition {
  signpostId?: number | null
  label?: string | null
  direction?: 'sup' | null
  directionLabel?: string | null
  probabilityImpact?: number | null
  strength?: ScenarioSignpostStrength | null
  strengthLabel?: string | null
  rationale?: string | null
  displayOrder?: number | null
}

export interface DesignScenarioRow {
  scenarioId?: number | null
  isNew?: boolean
  displayOrder?: number
  scenarioName?: string
  baseCase?: boolean
  /** 시나리오 유형 배지 (BR/BL/MX). BC는 baseCase로 표시 */
  scenarioType?: ScenarioDesignScenarioType | null
  /** 유형 구분 사유 (배지 호버 툴팁) */
  scenarioTypeReason?: string | null
  scenarioRole?: ScenarioRole | null
  scenarioRoleLabel?: string | null
  pressureBand?: ScenarioPressureBand | null
  pressureBandLabel?: string | null
  pressureRationale?: string | null
  /** 공통 범위로만 편집 가능한 잠금 시나리오 */
  locked?: boolean
  dimensions?: ScenarioDimension[]
  probability?: number | null
  narrative?: string | null
  signposts?: ScenarioSignpostDefinition[] | null
}

export interface DesignTable {
  dimensionColumns?: ScenarioDimensionColumn[]
  scenarios?: DesignScenarioRow[]
}

export interface OneView {
  groupName?: string
  summary?: string
  description?: string
  table?: DesignTable | null
}

export interface Validation {
  isValid?: boolean
  reason?: string | null
}

export interface ScenarioDesignState {
  scenarioGroupId?: number
  status?: ScenarioDesignGroupStatus
  statusLabel?: string
  stage?: ScenarioDesignStageValue
  stageLabel?: string
  occupied?: boolean
  occupantUserId?: number | null
  step1?: DesignTable | null
  step2?: OneView | null
  validation?: Validation | null
}

export interface DesignDimensionValueOption {
  valueId?: string
  label?: string
  rationale?: string | null
}

export interface ScenarioGroupCreationState {
  operationStatus?: ScenarioGroupCreationOperationStatus | string
  operationStatusLabel?: string
  currentPhase?: ScenarioGroupCreationPhase | string
  currentPhaseLabel?: string
  snapshotRevision?: number
  lastError?: {
    code?: string
    message?: string
  } | null
}

export interface ScenarioGroupMeta {
  title?: string
  summary?: string
  description?: string
}

export interface ScenarioGroupRefinementState {
  stage?: ScenarioDesignStageValue
  stageLabel?: string
  occupied?: boolean
  mine?: boolean | null
  occupantUserId?: number | null
  validation?: Validation | null
  scenarioGroupMeta?: ScenarioGroupMeta | null
}

export interface ScenarioDesignPresentation {
  scenarioGroupId?: number
  eventBundles?: IScenarioEventBundle[]
  evidence?: IScenarioGroupEvidence | null
  creationState?: ScenarioGroupCreationState | null
  refinementState?: ScenarioGroupRefinementState | null
  table?: DesignTable | null
  dimensionValueOptions?: Record<string, DesignDimensionValueOption[]>
}

export type AdditionalDimensionGenerationStatus = 'not_requested' | 'queued' | 'running' | 'ready' | 'failed' | 'interrupted' | 'discarded'

export interface AdditionalDimensionCandidateValue {
  valueId?: string
  label?: string
  rationale?: string | null
  pressureContribution?: string
}

export interface AdditionalDimensionCandidate {
  key?: string
  label?: string
  description?: string | null
  rationale?: string | null
  modelSupportStatus?: string
  values?: AdditionalDimensionCandidateValue[]
}

export interface AdditionalDimensions {
  scenarioGroupId?: number
  generationStatus?: AdditionalDimensionGenerationStatus | string | null
  generationStatusLabel?: string
  candidates?: AdditionalDimensionCandidate[]
  availableCount?: number
  updatedAt?: string
  errorCode?: string
}

export const isAdditionalDimensionGenerating = (status?: string | null) => status === 'queued' || status === 'running'

export const isAdditionalDimensionReady = (status?: string | null) => status === 'ready'

export interface ScenarioDimensionTemplateItem {
  dimKey?: string
  label?: string
  required?: boolean
  displayOrder?: number
  valueEnums?: string[]
  /** 분기 항목 선정 근거 */
  description?: string | null
  /** 분기 기준값별 설명 (메뉴 인포 툴팁) */
  valueEnumDescriptions?: Record<string, string>
  /** 분기 기준값 ID -> 표시 라벨 */
  valueEnumLabels?: Record<string, string>
}

export interface ScenarioDimensionTemplate {
  dimensions?: ScenarioDimensionTemplateItem[]
}

export interface DesignEditRow {
  scenarioId?: number | null
  displayOrder?: number
  scenarioName?: string
  dimensions?: ScenarioDimension[]
}

export interface DesignEditTable {
  dimensionColumns?: ScenarioDimensionColumn[]
  scenarios?: DesignEditRow[]
}

export interface ScenarioValidation {
  table: DesignEditTable
}

export interface ScenarioSignposts {
  table: DesignEditTable
}

export interface GroupEdit {
  title?: string
  summary?: string
  description?: string
}

export interface DesignConfirmSignpost {
  signpostId?: number | null
  label?: string | null
  direction?: 'sup' | null
  rationale?: string | null
  strength?: ScenarioSignpostStrength | null
  displayOrder?: number | null
  used?: boolean
}

export interface DesignConfirmRow {
  scenarioId?: number | null
  displayOrder?: number
  scenarioName?: string
  baseCase?: boolean
  dimensions?: ScenarioDimension[]
  probability?: number
  narrative?: string
  signposts?: DesignConfirmSignpost[]
}

export interface DesignConfirmTable {
  dimensionColumns?: ScenarioDimensionColumn[]
  scenarios?: DesignConfirmRow[]
}

export interface ScenarioConfirmation {
  scenarioGroup?: GroupEdit
  table: DesignConfirmTable
}

type ScenarioDesignQueryParamValue = string | number | boolean

const appendScenarioDesignParam = (usp: URLSearchParams, key: string, value: unknown) => {
  if (value === undefined || value === null || value === '') return
  if (typeof value === 'string') {
    usp.append(key, value)
    return
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    usp.append(key, value.toString())
  }
}

const serializeScenarioDesignParams = (params: Record<string, unknown>): string => {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v: ScenarioDesignQueryParamValue) => appendScenarioDesignParam(usp, key, v))
      return
    }
    appendScenarioDesignParam(usp, key, value)
  })
  return usp.toString()
}

type ScenarioGroupCreationCursor = {
  operationId?: string
  lastSequence?: number
  scenarioGroupId?: number
}

const getScenarioGroupCreationCursorKey = (miEventIds: number[]) =>
  `nextGenMI.scenarioGroupCreationCursor:${[...miEventIds].sort((a, b) => a - b).join(',')}`

export const getScenarioGroupCreationCursor = (miEventIds: number[]): ScenarioGroupCreationCursor | null => {
  if (miEventIds.length === 0 || typeof sessionStorage === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(getScenarioGroupCreationCursorKey(miEventIds))
    if (!raw) return null
    const parsed = JSON.parse(raw) as ScenarioGroupCreationCursor
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export const saveScenarioGroupCreationCursor = (miEventIds: number[], cursor: ScenarioGroupCreationCursor) => {
  if (miEventIds.length === 0 || typeof sessionStorage === 'undefined') return

  try {
    sessionStorage.setItem(getScenarioGroupCreationCursorKey(miEventIds), JSON.stringify(cursor))
  } catch {
    // sessionStorage 용량/접근 실패 시 재연결만 포기
    return
  }
}

export const clearScenarioGroupCreationCursor = (miEventIds: number[]) => {
  if (miEventIds.length === 0 || typeof sessionStorage === 'undefined') return

  try {
    sessionStorage.removeItem(getScenarioGroupCreationCursorKey(miEventIds))
  } catch {
    // sessionStorage 접근 실패 시 커서 삭제만 포기
    return
  }
}

const createScenarioDesignStreamHeaders = (contentType?: string) => {
  const { token, user, accessCompanyInfo } = useAuthStore.getState()
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Accept-Language': i18n.language || 'ko',
  }

  if (contentType) headers['Content-Type'] = contentType
  if (token) headers.Authorization = `Bearer ${token}`
  if (user?.isOtherServiceAccessPossible && accessCompanyInfo?.customerCompanyNo) {
    headers['X-Company-No'] = accessCompanyInfo.customerCompanyNo.toString()
  }

  return headers
}

const nextGenMIScenarioDesignService = {
  async getScenarioDesignStatus(params: GetScenarioDesignStatusParams): Promise<ScenarioDesignStatus> {
    const response: AxiosResponse<ICommonResponse<ScenarioDesignStatus>> = await api.get('mi/next-gen/scenario-groups/design-status', {
      params: {
        miEventIds: params.miEventIds,
      },
      paramsSerializer: (p) => serializeScenarioDesignParams(p as Record<string, unknown>),
    })

    return response.data.data
  },

  async createScenarioGroupStream(
    payload: ScenarioDesignStartV4,
    onMessage: (event: EventSourceMessage) => void,
    signal: AbortSignal,
  ): Promise<void> {
    await fetchEventSource('/api/v1/mi/next-gen/scenario-groups/creation/stream', {
      method: 'POST',
      headers: createScenarioDesignStreamHeaders('application/json'),
      body: JSON.stringify(payload),
      credentials: 'include',
      openWhenHidden: true,
      signal,
      onmessage: onMessage,
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) return
        throw new Error(`시나리오 그룹 생성 스트림 연결 실패: ${response.status} ${response.statusText}`)
      },
      onerror(error) {
        // 기본 재시도는 같은 body를 다시 써서 lastSequence가 갱신되지 않음. 호출 측에서 커서를 넣어 재연결
        throw error
      },
    })
  },

  async getScenarioDesignPresentation(
    scenarioGroupId: string | number,
    params?: { operationId?: string },
  ): Promise<ScenarioDesignPresentation> {
    const response: AxiosResponse<ICommonResponse<ScenarioDesignPresentation>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/presentation`,
      {
        params: {
          operationId: params?.operationId,
        },
      },
    )

    return response.data.data
  },

  async getAdditionalDimensions(scenarioGroupId: string | number): Promise<AdditionalDimensions> {
    const response: AxiosResponse<ICommonResponse<AdditionalDimensions>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/design/additional-dimensions`,
      {
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.get>[1] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },

  async validateScenarioDesign(scenarioGroupId: string | number, payload: ScenarioValidation): Promise<ScenarioDesignStageData> {
    const response: AxiosResponse<ICommonResponse<ScenarioDesignStageData>> = await api.post(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/design/validation`,
      payload,
    )

    return response.data.data
  },

  async streamScenarioRefinement(
    scenarioGroupId: string | number,
    onMessage: (event: EventSourceMessage) => void,
    signal: AbortSignal,
  ): Promise<void> {
    await fetchEventSource(`/api/v1/mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/refinement/stream`, {
      method: 'GET',
      headers: createScenarioDesignStreamHeaders(),
      credentials: 'include',
      openWhenHidden: true,
      signal,
      onmessage: onMessage,
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) return
        throw new Error(`시나리오 정련 스트림 연결 실패: ${response.status} ${response.statusText}`)
      },
    })
  },

  async createScenarioSignposts(scenarioGroupId: string | number, payload: ScenarioSignposts): Promise<ScenarioDesignStageData> {
    const response: AxiosResponse<ICommonResponse<ScenarioDesignStageData>> = await api.post(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/design/signposts`,
      payload,
    )

    return response.data.data
  },

  async confirmScenarioDesign(scenarioGroupId: string | number, payload: ScenarioConfirmation): Promise<ScenarioDesignStageData> {
    const response: AxiosResponse<ICommonResponse<ScenarioDesignStageData>> = await api.post(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/design/confirmation`,
      payload,
    )

    return response.data.data
  },

  async resetScenarioDesign(scenarioGroupId: string | number): Promise<void> {
    // v1.3.0: 응답 본문 없음. 이후 presentation 재조회
    await api.post(`mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/design/reset`)
  },
}

export const mapScenarioDesignPresentationToState = (presentation: ScenarioDesignPresentation): ScenarioDesignState => {
  const meta = presentation.refinementState?.scenarioGroupMeta
  const table = presentation.table ?? null

  return {
    scenarioGroupId: presentation.scenarioGroupId,
    stage: presentation.refinementState?.stage,
    stageLabel: presentation.refinementState?.stageLabel,
    occupied: presentation.refinementState?.occupied,
    occupantUserId: presentation.refinementState?.occupantUserId,
    step1: table,
    step2: table
      ? {
        groupName: meta?.title,
        summary: meta?.summary,
        description: meta?.description,
        table,
      }
      : null,
    validation: presentation.refinementState?.validation ?? null,
  }
}

export const mapDimensionValueOptionsToTemplates = (presentation: ScenarioDesignPresentation): ScenarioDimensionTemplateItem[] => {
  const optionsByKey = presentation.dimensionValueOptions ?? {}
  const columns = presentation.table?.dimensionColumns ?? []
  const keys = [...new Set([...columns.map((column) => column.key?.trim() ?? '').filter(Boolean), ...Object.keys(optionsByKey)])]

  return keys.map((dimKey, index) => {
    const column = columns.find((item) => item.key === dimKey)
    const options = optionsByKey[dimKey] ?? []
    const valueEnumDescriptions: Record<string, string> = {}
    const valueEnumLabels: Record<string, string> = {}
    const valueEnums = options.flatMap((option) => {
      const enumValue = option.valueId?.trim() || option.label?.trim() || ''
      if (!enumValue) return []
      const label = option.label?.trim() || enumValue
      valueEnumLabels[enumValue] = label
      const description = option.rationale?.trim()
      if (description) valueEnumDescriptions[enumValue] = description
      return [enumValue]
    })

    return {
      dimKey,
      label: column?.label?.trim() || dimKey,
      displayOrder: index,
      valueEnums,
      description: column?.description?.trim() || null,
      valueEnumDescriptions,
      valueEnumLabels,
    }
  })
}

export default nextGenMIScenarioDesignService
