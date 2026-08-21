import type { EventDesignStep } from '@/service/mi/nextGenMI/event'
import type { ScenarioDesignStatus, ScenarioDesignStatusCode } from '@/service/mi/nextGenMI/scenarioDesign'

/** 멀티 선택 액션바 - 동일 이벤트 조합 기준 상태 분기 */
export type MultiEventSelectionDesignMode = 'designable' | 'creating' | 'created'

export type MultiEventSelectionDesignState = {
  mode: MultiEventSelectionDesignMode
  locked: boolean
  designStep?: EventDesignStep
  designStepLabel?: string | null
  scenarioGroupId?: number | null
  occupantUserName?: string | null
  primaryEventId: number
  primaryEventName: string
}

export const EVENT_SCENARIO_DESIGN_UNAVAILABLE_TOOLTIP_TITLE =
  '본 이벤트 유형에 대한 시나리오설계 지원은 Phase #2 릴리즈에 예정되어 있습니다 (현재 시나리오화를 지원하는 이벤트유형을 기준으로, Agent의 시나리오 설계 품질 향상을 먼저 수행)'

export const normalizeEventDesignStep = (step?: EventDesignStep | string | null): EventDesignStep | undefined => {
  const normalized = step?.toLowerCase()
  if (normalized === 'step1' || normalized === 'step2') return normalized
  return undefined
}

export const getEventDesignOccupiedMessage = (occupantUserName?: string | null) => {
  const name = occupantUserName?.trim()
  if (name) {
    return `다른 사용자(${name})가 현재 시나리오 설계를 진행 중입니다. 해당 작업이 완료된 후 다시 시도해 주세요.`
  }
  return '다른 사용자가 현재 시나리오 설계를 진행 중입니다. 해당 작업이 완료된 후 다시 시도해 주세요.'
}

export const getEventDesignStepTooltipTitle = (step?: EventDesignStep | string | null, stepLabel?: string | null) => {
  const normalizedStep = normalizeEventDesignStep(step)

  if (normalizedStep === 'step1') return '시나리오 분기항목 및 분기기준 검토 중입니다.'
  if (normalizedStep === 'step2') return '시나리오 One-view 검토 중입니다.'

  const label = stepLabel?.trim()
  if (label) return `${label} 진행 중입니다.`
  return '시나리오 설계를 진행 중입니다.'
}

export const normalizeScenarioDesignStatusCode = (
  status?: ScenarioDesignStatusCode | string | null,
): ScenarioDesignStatusCode | undefined => {
  const normalized = status?.toLowerCase()
  if (normalized === 'designable' || normalized === 'creating' || normalized === 'created' || normalized === 'unavailable') {
    return normalized
  }
  return undefined
}

export const isScenarioDesignStatusMine = (status: ScenarioDesignStatus | undefined) => status?.mine === true

export const isScenarioDesignStatusOccupiedByOther = (status: ScenarioDesignStatus | undefined) => {
  if (!status) return false
  if (status.mine === true) return false
  const designStatus = normalizeScenarioDesignStatusCode(status.designStatus)
  if (status.mine === false) return designStatus === 'creating' || status.occupied === true
  return designStatus === 'creating' || status.occupied === true
}

export const resolveSelectionDesignStateFromStatus = (
  status: ScenarioDesignStatus | undefined,
  selectedEvents: Array<{ eventId: number; eventName: string }>,
): MultiEventSelectionDesignState | null => {
  if (selectedEvents.length === 0) return null

  const primary = selectedEvents[0]
  const designStatus = normalizeScenarioDesignStatusCode(status?.designStatus)
  const mode: MultiEventSelectionDesignMode = designStatus === 'creating' || designStatus === 'created' ? designStatus : 'designable'

  return {
    mode,
    locked: isScenarioDesignStatusOccupiedByOther(status),
    designStep: normalizeEventDesignStep(status?.designStep),
    designStepLabel: status?.designStepLabel,
    scenarioGroupId: status?.scenarioGroupId,
    occupantUserName: status?.occupantUserName,
    primaryEventId: primary.eventId,
    primaryEventName: primary.eventName,
  }
}
