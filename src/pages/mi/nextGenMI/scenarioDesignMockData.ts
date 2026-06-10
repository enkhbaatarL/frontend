export type ScenarioDesignBranchField = string

export interface ScenarioDesignBranchItem {
  field: ScenarioDesignBranchField
  headerName: string
  mandatory: boolean
}

export interface ScenarioDesignBranchRow {
  id: string
  scenarioName: string
  baseCase?: boolean
  period: string
  transportDisruption: string
  supplyDisruptionIntensity: string
  supplyRecoveryPattern: string
  branchCriteria: string
  agentAutoFields?: ScenarioDesignBranchField[]
  directInputFields?: ScenarioDesignBranchField[]
  placeholder?: boolean
  extraCriteria?: Record<string, string>
}

export const SCENARIO_DESIGN_MAX_SCENARIO_COUNT = 15

export const SCENARIO_DESIGN_DUPLICATE_NAME_ERROR = '중복된 시나리오명은 사용할 수 없습니다.'

export const SCENARIO_DESIGN_ALL_AGENT_FIELDS: ScenarioDesignBranchField[] = [
  'period',
  'transportDisruption',
  'supplyDisruptionIntensity',
  'supplyRecoveryPattern',
  'branchCriteria',
]

export const SCENARIO_DESIGN_SELECTED_BRANCH_ITEMS: ScenarioDesignBranchItem[] = [
  { field: 'period', headerName: '기간', mandatory: true },
  { field: 'transportDisruption', headerName: '운송 차질', mandatory: true },
  { field: 'supplyDisruptionIntensity', headerName: '공급 차질 - 강도', mandatory: false },
  { field: 'supplyRecoveryPattern', headerName: '공급 차질 - 완화/회복 패턴', mandatory: false },
  { field: 'branchCriteria', headerName: '분기항목', mandatory: false },
]

export const SCENARIO_DESIGN_UNSELECTED_BRANCH_ITEMS: ScenarioDesignBranchItem[] = [
  { field: 'demandLngSupply', headerName: '수요측 대응 - 타 공급원 경유 LNG 확보', mandatory: false },
  { field: 'demandPowerMix', headerName: '수요측 대응 - PowerMix 조정 LNG 수요 감소', mandatory: false },
  { field: 'tradeRestriction', headerName: '거래 제한 (계약 취소 등)', mandatory: false },
  { field: 'branchItemName1', headerName: '분기항목명', mandatory: false },
  { field: 'branchItemName2', headerName: '분기항목명', mandatory: false },
]

export const SCENARIO_DESIGN_ALL_BRANCH_ITEMS: ScenarioDesignBranchItem[] = [
  ...SCENARIO_DESIGN_SELECTED_BRANCH_ITEMS,
  ...SCENARIO_DESIGN_UNSELECTED_BRANCH_ITEMS,
]

export const SCENARIO_DESIGN_DEFAULT_VISIBLE_FIELDS: ScenarioDesignBranchField[] = SCENARIO_DESIGN_SELECTED_BRANCH_ITEMS.map(
  (item) => item.field,
)

export const SCENARIO_DESIGN_CRITERIA_OPTIONS: Record<string, string[]> = {
  period: ['단기 (1-3M)', '중기 (3-6M)', '장기 (6M+)'],
  transportDisruption: [
    '낮음',
    '중간',
    '높음',
    '매우 높음',
    '분기기준값 1',
    '분기기준값 2',
    '분기기준값 3',
    '분기기준값 4',
    '분기기준값 5',
  ],
  supplyDisruptionIntensity: ['거의 없음', '낮음', '중간', '높음', '매우 높음'],
  supplyRecoveryPattern: [
    '신속 차질 → 신속 회복',
    '지연 발생 → 점진 회복',
    '점진 차질 → 점진 회복',
    '급락 피해 → 장기 재고',
    '분기기준값 1',
    '분기기준값 2',
    '분기기준값 3',
    '분기기준값 4',
    '분기기준값 5',
  ],
  branchCriteria: ['분기기준값', '분기기준값 1', '분기기준값 2', '분기기준값 3', '분기기준값 4', '분기기준값 5'],
  demandLngSupply: ['분기기준값 1', '분기기준값 2', '분기기준값 3', '분기기준값 4', '분기기준값 5'],
  demandPowerMix: ['분기기준값 1', '분기기준값 2', '분기기준값 3', '분기기준값 4', '분기기준값 5'],
  tradeRestriction: ['분기기준값 1', '분기기준값 2', '분기기준값 3', '분기기준값 4', '분기기준값 5'],
  branchItemName1: ['분기기준값 1', '분기기준값 2', '분기기준값 3', '분기기준값 4', '분기기준값 5'],
  branchItemName2: ['분기기준값 1', '분기기준값 2', '분기기준값 3', '분기기준값 4', '분기기준값 5'],
}

export const SCENARIO_DESIGN_MOCK_RATIONALE =
  '11주 차에는 트럼프 평화안이 거부되면서 분쟁 리스크가 다시 부각되었고, 이에 따라 DMZ 위험 프리미엄이 배럴당 5~7달러 수준으로 강화될 가능성이 있습니다. 향후 분쟁이 단기 평화 국면으로 전환되는지, 장기화되는지, 혹은 휴전으로 이어지는지에 따라 운송 차질과 공급 차질의 강도, 그리고 회복 시점은 서로 다르게 나타날 수 있습니다. 이에 따라 Agent는 4-A 표본을 기준으로 총 5개의 시나리오를 분기합니다.'

export const SCENARIO_DESIGN_MOCK_BRANCH_ROWS: ScenarioDesignBranchRow[] = [
  {
    id: '1',
    scenarioName: '단기 휴전-위험 프리미엄 해소',
    period: '단기 (1-3M)',
    transportDisruption: '낮음',
    supplyDisruptionIntensity: '거의 없음',
    supplyRecoveryPattern: '신속 차질 → 신속 회복',
    branchCriteria: '분기기준값',
  },
  {
    id: '2',
    scenarioName: '분쟁 장기화·LNG 시장 경직 확대',
    baseCase: true,
    period: '중기 (3-6M)',
    transportDisruption: '중간',
    supplyDisruptionIntensity: '중간',
    supplyRecoveryPattern: '지연 발생 → 점진 회복',
    branchCriteria: '분기기준값',
  },
  {
    id: '3',
    scenarioName: '신규형 정착·위험 프리미엄 영구화',
    period: '장기 (6M+)',
    transportDisruption: '중간',
    supplyDisruptionIntensity: '중간',
    supplyRecoveryPattern: '점진 차질 → 점진 회복',
    branchCriteria: '분기기준값',
  },
  {
    id: '4',
    scenarioName: '확전·호르무즈 전면 봉쇄 (Tail Risk)',
    period: '장기 (6M+)',
    transportDisruption: '매우 높음',
    supplyDisruptionIntensity: '매우 높음',
    supplyRecoveryPattern: '급락 피해 → 장기 재고',
    branchCriteria: '분기기준값 분기기준값 분기기준값',
  },
  {
    id: '5',
    scenarioName: '시나리오명',
    placeholder: true,
    period: '',
    transportDisruption: '',
    supplyDisruptionIntensity: '',
    supplyRecoveryPattern: '',
    branchCriteria: '',
    agentAutoFields: ['period', 'transportDisruption'],
    directInputFields: ['supplyRecoveryPattern', 'branchCriteria'],
  },
  {
    id: '6',
    scenarioName: '시나리오명',
    placeholder: true,
    period: '',
    transportDisruption: '',
    supplyDisruptionIntensity: '',
    supplyRecoveryPattern: '',
    branchCriteria: '',
    agentAutoFields: ['period', 'transportDisruption'],
    directInputFields: ['supplyRecoveryPattern', 'branchCriteria'],
  },
]
