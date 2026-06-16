import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded'

import type { SelectMenuItem } from '@/components/common/menu/MISelectMenu'

export type ScenarioDesignColumnKey =
  | 'period'
  | 'transportDisruption'
  | 'supplyIntensity'
  | 'supplyRecovery'
  | 'branchItem'
  | 'demandAlternativeSupply'
  | 'demandPowerMixAdjustment'
  | 'tradeRestriction'
  | 'generatedBranchItemA'
  | 'generatedBranchItemB'

export const SCENARIO_DESIGN_BASE_EVENT_TABS = [
  { key: 'ai', label: 'AI Insights' },
  { key: 'impact', label: '영향도 분석' },
  { key: 'driverTree', label: 'Index Driver별 영향도 분석' },
  { key: 'outlook', label: '기관 전망' },
  { key: 'records', label: 'MI Records' },
] as const

export type ScenarioDesignBaseEventTabKey = (typeof SCENARIO_DESIGN_BASE_EVENT_TABS)[number]['key']
export type ScenarioDesignConfirmType = 'criteriaReset' | 'cancel' | 'review' | 'deleteRow' | 'deleteCriteriaColumn'

export type ScenarioDesignLocationState = {
  eventName?: string
}

export type ScenarioDesignRow = {
  id: number
  scenarioName: string
  recommended?: boolean
  period: string
  transportDisruption: string
  supplyIntensity: string
  supplyRecovery: string
  branchItem: string
  demandAlternativeSupply: string
  demandPowerMixAdjustment: string
  tradeRestriction: string
  generatedBranchItemA: string
  generatedBranchItemB: string
}

export const SCENARIO_DESIGN_COLUMNS: Array<{ key: ScenarioDesignColumnKey; label: string; width: string }> = [
  { key: 'period', label: '기간', width: '200px' },
  { key: 'transportDisruption', label: '운송 차질', width: '200px' },
  { key: 'supplyIntensity', label: '공급 차질 - 강도', width: '200px' },
  { key: 'supplyRecovery', label: '공급 차질 - 완화/회복...', width: '200px' },
  { key: 'branchItem', label: '분기항목', width: '200px' },
  { key: 'demandAlternativeSupply', label: '수요측 대응 - 타 공급원 경유 LNG 확보', width: '200px' },
  { key: 'demandPowerMixAdjustment', label: '수요측 대응 - PowerMix 조정 LNG 수요 감소', width: '200px' },
  { key: 'tradeRestriction', label: '거래 제한 (계약 취소 등)', width: '200px' },
  { key: 'generatedBranchItemA', label: '분기항목명', width: '200px' },
  { key: 'generatedBranchItemB', label: '분기항목명', width: '200px' },
]

export type ScenarioDesignColumn = (typeof SCENARIO_DESIGN_COLUMNS)[number]

export const SCENARIO_DESIGN_MAX_ROW_COUNT = 15
export const SCENARIO_DESIGN_INITIAL_HIDDEN_COLUMN_KEYS: ScenarioDesignColumnKey[] = [
  'demandAlternativeSupply',
  'demandPowerMixAdjustment',
  'tradeRestriction',
  'generatedBranchItemA',
  'generatedBranchItemB',
]

export const SCENARIO_DESIGN_REVIEW_DEFAULT_NARRATIVE =
  '카타르 Ras Laffan LNG 시설의 피해 범위가 확대될 경우, 시장은 이를 단순한 설비 사고가 아니라 글로벌 LNG 공급망의 핵심 거점 리스크로 해석할 가능성이 높습니다. 피해가 일부 Train이나 부속 설비에 제한되고 재가동 일정이 빠르게 확인되면 수주 내 부분 복구와 카고 일정 조정으로 충격이 흡수될 수 있습니다. 반면 여러 Train의 동시 정지, 저장·선적 인프라 손상, 추가 군사 긴장, 호르무즈 해협 통항 불안이 함께 확인될 경우 카타르산 LNG의 공급 신뢰도와 장기계약 이행 가능성이 재평가될 수 있습니다. 이 경우 아시아·유럽 구매자의 대체 카고 확보 경쟁이 심화되고, JKM·TTF 가격 변동성, 운임·보험료, 목적지 전환 전략까지 연쇄적으로 영향을 받을 수 있습니다.'

export const isScenarioDesignRequiredColumn = (key: ScenarioDesignColumnKey) => key === 'period' || key === 'transportDisruption'

export const SCENARIO_DESIGN_SELECT_COMMON_ACTIONS = {
  agent: {
    value: 'agent',
    label: 'Agent 자동 설정',
  },
  manual: {
    value: 'manual',
    label: '직접 입력값',
    inputLabel: '직접 입력',
  },
  reset: {
    label: '초기화',
  },
} as const

export const scenarioDesignAgentItem: SelectMenuItem<string> = {
  value: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
  label: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.label,
  icon: <AutoAwesomeRoundedIcon sx={{ fontSize: '18px', color: 'contentIcon.Enabled' }} />,
}

export const scenarioDesignManualItem: SelectMenuItem<string> = {
  value: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.value,
  label: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
  icon: <DriveFileRenameOutlineRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />,
}

const periodItems: SelectMenuItem<string>[] = [
  { value: 'short', label: '단기 (1~3M)' },
  { value: 'mid', label: '중기 (3~6M)' },
  { value: 'long', label: '장기 (6M+)' },
]

const impactLevelItems: SelectMenuItem<string>[] = [
  { value: 'none', label: '거의 없음' },
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '중간' },
  { value: 'high', label: '매우 높음' },
]

const recoveryItems: SelectMenuItem<string>[] = [
  { value: 'immediate', label: '신속 차질 → 신속 회복' },
  { value: 'delayed', label: '지연 발생 → 점진 회복' },
  { value: 'extended', label: '급락 피해 → 장기 재고' },
]

const branchItems: SelectMenuItem<string>[] = [
  { value: 'quarter', label: '분기기준값' },
  { value: 'quarterBase', label: '분기기준값 분기기준값 분기기준값' },
]

export const createScenarioDesignGeneratedBranchDefaults = () => ({
  demandAlternativeSupply: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
  demandPowerMixAdjustment: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
  tradeRestriction: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
  generatedBranchItemA: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
  generatedBranchItemB: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
})

const SCENARIO_DESIGN_INITIAL_ROWS: ScenarioDesignRow[] = [
  {
    id: 1,
    scenarioName: '단기 휴전-위험 프리미엄 해소',
    period: 'short',
    transportDisruption: 'low',
    supplyIntensity: 'none',
    supplyRecovery: 'immediate',
    branchItem: 'quarter',
    ...createScenarioDesignGeneratedBranchDefaults(),
  },
  {
    id: 2,
    scenarioName: '분쟁 장기화·LNG 시장 경직 확대',
    recommended: true,
    period: 'mid',
    transportDisruption: 'medium',
    supplyIntensity: 'medium',
    supplyRecovery: 'delayed',
    branchItem: 'quarter',
    ...createScenarioDesignGeneratedBranchDefaults(),
  },
  {
    id: 3,
    scenarioName: '신규형 정착·위험 프리미엄 영구화',
    period: 'long',
    transportDisruption: 'medium',
    supplyIntensity: 'medium',
    supplyRecovery: 'delayed',
    branchItem: 'quarter',
    ...createScenarioDesignGeneratedBranchDefaults(),
  },
  {
    id: 4,
    scenarioName: '확전·호르무즈 전면 봉쇄 (Tail Risk)',
    period: 'long',
    transportDisruption: 'high',
    supplyIntensity: 'high',
    supplyRecovery: 'extended',
    branchItem: 'quarterBase',
    ...createScenarioDesignGeneratedBranchDefaults(),
  },
  {
    id: 5,
    scenarioName: '시나리오명',
    period: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
    transportDisruption: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
    supplyIntensity: 'medium',
    supplyRecovery: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
    branchItem: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
    ...createScenarioDesignGeneratedBranchDefaults(),
  },
  {
    id: 6,
    scenarioName: '시나리오명',
    period: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
    transportDisruption: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value,
    supplyIntensity: 'medium',
    supplyRecovery: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
    branchItem: SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.manual.label,
    ...createScenarioDesignGeneratedBranchDefaults(),
  },
]

export const createInitialScenarioDesignRows = (): ScenarioDesignRow[] => SCENARIO_DESIGN_INITIAL_ROWS.map((row) => ({ ...row }))

export const getScenarioDesignColumnItems = (key: ScenarioDesignColumnKey) => {
  if (key === 'period') return periodItems
  if (key === 'supplyRecovery') return recoveryItems
  if (key === 'branchItem' || SCENARIO_DESIGN_INITIAL_HIDDEN_COLUMN_KEYS.includes(key)) return branchItems
  return impactLevelItems
}

export const getScenarioDesignColumnDisplayValue = (key: ScenarioDesignColumnKey, value: string) => {
  if (value === SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value) return SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.label

  return String(getScenarioDesignColumnItems(key).find((item) => item.value === value)?.label ?? value)
}

export const getInitialScenarioDesignColumnValue = (rowId: number, key: ScenarioDesignColumnKey, fallbackValue: string) =>
  SCENARIO_DESIGN_INITIAL_ROWS.find((row) => row.id === rowId)?.[key] ?? fallbackValue

export const SCENARIO_DESIGN_SECTIONS = [
  { id: 'scenario-design-section-base-event', label: 'Base Event' },
  { id: 'scenario-design-section-rationale', label: '설계 근거' },
  { id: 'scenario-design-section-criteria', label: '분기 항목 및 분기 기준 검토' },
]
