import type { EventDesignStep } from '@/service/mi/nextGenMI/event'
import type { SameCombinationScenarioGroup, ScenarioDesignStatus, ScenarioDesignStatusCode } from '@/service/mi/nextGenMI/scenarioDesign'

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
  const occupant = occupantUserName?.trim() || '-'
  return `다른 사용자(${occupant})가 현재 시나리오 설계를 진행하고 있습니다. 설계가 완료될 때까지 진행 중인 내용은 조회만 가능하며, 수정할 수 없습니다.`
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

export const getSameCombinationGroups = (status?: ScenarioDesignStatus | null): SameCombinationScenarioGroup[] => {
  if (!status) return []
  if (Array.isArray(status.sameCombinationGroups)) return status.sameCombinationGroups
  return []
}

export const getSameCombinationGroupCount = (status?: ScenarioDesignStatus | null): number => {
  if (!status) return 0
  if (typeof status.sameCombinationGroupCount === 'number' && Number.isFinite(status.sameCombinationGroupCount)) {
    return status.sameCombinationGroupCount
  }
  return getSameCombinationGroups(status).length
}

export const isSameCombinationGroupInProgress = (group: SameCombinationScenarioGroup) => {
  const status = (group.status ?? '').toLowerCase()
  return status === 'creating'
}

export const isSameCombinationGroupCompleted = (group: SameCombinationScenarioGroup) => {
  const status = (group.status ?? '').toLowerCase()
  return status === 'created' || status === 'realized'
}

export const getOwnInProgressScenarioGroup = (status: ScenarioDesignStatus | undefined) => {
  if (!status) return undefined

  if (status.sameCombinationGroups !== undefined || status.sameCombinationGroupCount !== undefined) {
    return getSameCombinationGroups(status).find((group) => group.mine === true && isSameCombinationGroupInProgress(group))
  }

  // 구 응답도 본인이 설계 중인 그룹만 이어서 표시한다.
  if (status.mine === true && normalizeScenarioDesignStatusCode(status.designStatus) === 'creating') return status
  return undefined
}

/**
 * 멀티 선택 액션바 상태.
 * 본인이 설계 중인 그룹은 이어서 표시하고, 그 외에는 새 그룹을 생성한다.
 * 동일 조합 안내/목록 UI는 sameCombinationGroups를 액션바에서 별도 렌더.
 */
export const resolveSelectionDesignStateFromStatus = (
  status: ScenarioDesignStatus | undefined,
  selectedEvents: Array<{ eventId: number; eventName: string }>,
): MultiEventSelectionDesignState | null => {
  if (selectedEvents.length === 0) return null

  const primary = selectedEvents[0]
  const ownGroup = getOwnInProgressScenarioGroup(status)

  return {
    mode: ownGroup ? 'creating' : 'designable',
    locked: false,
    designStep: normalizeEventDesignStep(ownGroup?.designStep),
    designStepLabel: ownGroup?.designStepLabel,
    scenarioGroupId: ownGroup?.scenarioGroupId ?? null,
    occupantUserName: null,
    primaryEventId: primary.eventId,
    primaryEventName: primary.eventName,
  }
}
