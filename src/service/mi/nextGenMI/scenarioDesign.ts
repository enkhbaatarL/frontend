import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { AxiosResponse } from 'axios'

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

export interface ScenarioDesignStart {
  miEventId: number
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

export interface ScenarioDimensionColumn {
  key?: string
  label?: string
}

export interface ScenarioDimension {
  key?: string
  label?: string
  value?: string | null
  valueLabel?: string | null
}

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

export interface ScenarioDimensionTemplateItem {
  dimKey?: string
  label?: string
  required?: boolean
  displayOrder?: number
  valueEnums?: string[]
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

const createScenarioDesignStreamHeaders = () => {
  const { token, user, accessCompanyInfo } = useAuthStore.getState()
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Accept-Language': i18n.language || 'ko',
  }

  if (token) headers.Authorization = `Bearer ${token}`
  if (user?.isOtherServiceAccessPossible && accessCompanyInfo?.customerCompanyNo) {
    headers['X-Company-No'] = accessCompanyInfo.customerCompanyNo.toString()
  }

  return headers
}

const nextGenMIScenarioDesignService = {
  async startScenarioDesign(payload: ScenarioDesignStart): Promise<ScenarioDesignStageData> {
    const response: AxiosResponse<ICommonResponse<ScenarioDesignStageData>> = await api.post('mi/next-gen/scenario-groups', payload)

    return response.data.data
  },

  async getScenarioDesign(scenarioGroupId: string | number): Promise<ScenarioDesignState> {
    const response: AxiosResponse<ICommonResponse<ScenarioDesignState>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/design`,
    )

    return response.data.data
  },

  async getScenarioDimensionTemplates(scenarioGroupId: string | number): Promise<ScenarioDimensionTemplate> {
    const response: AxiosResponse<ICommonResponse<ScenarioDimensionTemplate>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/dimension-templates`,
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

  async streamScenarioDesign(
    scenarioGroupId: string | number,
    onMessage: (event: EventSourceMessage) => void,
    signal: AbortSignal,
  ): Promise<void> {
    await fetchEventSource(`/api/v1/mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/design/stream`, {
      method: 'GET',
      headers: createScenarioDesignStreamHeaders(),
      credentials: 'include',
      openWhenHidden: true,
      signal,
      onmessage: onMessage,
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) return
        throw new Error(`시나리오 설계 스트림 연결 실패: ${response.status} ${response.statusText}`)
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

  async resetScenarioDesign(scenarioGroupId: string | number): Promise<ScenarioDesignState> {
    const response: AxiosResponse<ICommonResponse<ScenarioDesignState>> = await api.post(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/design/reset`,
    )

    return response.data.data
  },
}

export default nextGenMIScenarioDesignService
