// #DELETE: API 적용후엔 목데이터 삭제
import type {
  ScenarioDesignStageData,
  ScenarioDesignStartV4,
  ScenarioDesignState,
  ScenarioDimensionTemplate,
} from '@/service/mi/nextGenMI/scenarioDesign'

const MOCK_SCENARIO_GROUP_ID_BASE = 88000

export const getMockScenarioGroupId = (miEventId: number) => MOCK_SCENARIO_GROUP_ID_BASE + (miEventId % 1000)

/** #DELETE: API 적용후엔 목데이터 삭제 - 시나리오 설계 시작 응답 */
export const buildMockScenarioDesignStart = (payload: ScenarioDesignStartV4): ScenarioDesignStageData => ({
  scenarioGroupId: getMockScenarioGroupId(payload.miEventIds[0] ?? 0),
  status: 'CREATING',
  stage: 'SCENARIO_CREATED',
})

/** #DELETE: API 적용후엔 목데이터 삭제 - 분기항목 템플릿 (인포 툴팁 포함) */
export const buildMockScenarioDimensionTemplate = (): ScenarioDimensionTemplate => ({
  dimensions: [
    {
      dimKey: 'period',
      label: '기간',
      required: true,
      displayOrder: 1,
      description: '시나리오 영향이 시장에 반영되는 시간 범위를 구분하기 위해 선정했습니다.',
      valueEnums: ['단기 (1-3M)', '중기 (3-6M)', '장기 (6-12M)'],
      valueEnumDescriptions: {
        '단기 (1-3M)': '단기 수급 충격이 가격에 즉시 반영되는 구간입니다.\n해당 기준값 범위는 1~3개월 관측 구간을 기준으로 설정했습니다.',
        '중기 (3-6M)':
          '중기 조정 경로에서 재고·운송 정상화 속도를 반영합니다.\n해당 기준값 범위는 3~6개월 관측 구간을 기준으로 설정했습니다.',
        '장기 (6-12M)':
          '장기 구조 변화(공급 재편·수요 전환)를 반영하는 구간입니다.\n해당 기준값 범위는 6~12개월 관측 구간을 기준으로 설정했습니다.',
      },
    },
    {
      dimKey: 'transport_disruption',
      label: '운송 차질',
      required: true,
      displayOrder: 2,
      description: '해상 운송 제약 강도가 스팟 가격과 도착 지연에 미치는 영향을 구분하기 위해 선정했습니다.',
      valueEnums: ['정상', '부분 차질', '전면 차질'],
      valueEnumDescriptions: {
        정상: '우회·지연 없이 기존 항로가 유지되는 상태입니다.',
        '부분 차질': '일부 항로 제약으로 운임·도착 지연이 제한적으로 발생합니다.',
        '전면 차질': '주요 항로 차단으로 우회 운송과 도착 지연이 광범위하게 발생합니다.',
      },
    },
    {
      dimKey: 'supply_shock',
      label: '공급 차질 - 강도',
      required: true,
      displayOrder: 3,
      description: '공급 충격의 강도에 따라 Bearish/Bullish/Mixed 분기 기준을 구분하기 위해 선정했습니다.',
      valueEnums: ['경미', '중간', '심각'],
      valueEnumDescriptions: {
        경미: '단기간 내 대체 공급으로 완충 가능한 수준의 차질입니다.',
        중간: '지역 수급 타이트가 수주~수개월 지속되는 수준의 차질입니다.',
        심각: '글로벌 스팟 가격에 유의미한 상방 압력을 주는 수준의 차질입니다.',
      },
    },
    {
      dimKey: 'supply_recovery',
      label: '공급 차질 - 완화/회복',
      required: false,
      displayOrder: 4,
      description: '공급 정상화 속도가 시나리오 경로를 가르는 핵심 변수여서 선정했습니다.',
      valueEnums: ['빠른 회복', '점진 회복', '지연 회복'],
      valueEnumDescriptions: {
        '빠른 회복': '1개월 내 운영 정상화가 가능한 경로입니다.',
        '점진 회복': '2~3개월에 걸쳐 단계적으로 정상화되는 경로입니다.',
        '지연 회복': '설비·외교 제약으로 회복이 분기 단위로 지연되는 경로입니다.',
      },
    },
    {
      dimKey: 'demand_response',
      label: '수요 반응',
      required: false,
      displayOrder: 5,
      description: '가격 상승에 대한 수요 반응 강도를 시나리오별로 비교하기 위해 선정했습니다.',
      valueEnums: ['약함', '중립', '강함'],
      valueEnumDescriptions: {
        약함: '가격 상승에도 수요 감소가 제한적입니다.',
        중립: '가격과 수요가 균형적으로 조정됩니다.',
        강함: '가격 상승에 수요가 민감하게 반응합니다.',
      },
    },
  ],
})

/** #DELETE: API 적용후엔 목데이터 삭제 - 시나리오 설계 상태(1단계 테이블 포함) */
export const buildMockScenarioDesignState = (scenarioGroupId: string | number): ScenarioDesignState => {
  const numericId = Number(scenarioGroupId)
  const templates = buildMockScenarioDimensionTemplate().dimensions ?? []

  return {
    scenarioGroupId: Number.isFinite(numericId) ? numericId : MOCK_SCENARIO_GROUP_ID_BASE,
    status: 'CREATING',
    statusLabel: '생성 중',
    stage: 'scenario_created',
    stageLabel: '시나리오 생성 완료',
    occupied: false,
    step1: {
      dimensionColumns: templates.map((template) => ({
        key: template.dimKey,
        label: template.label,
        description: template.description,
      })),
      scenarios: [
        {
          scenarioId: 1,
          displayOrder: 1,
          scenarioName: '공급 차질 심화',
          baseCase: false,
          scenarioType: 'BR',
          scenarioTypeReason: '공급·운송 차질이 동시에 확대되어 가격 상승(Bearish for consumer / Bullish price) 경로로 분류했습니다.',
          probability: 0.22,
          dimensions: [
            {
              key: 'period',
              label: '기간',
              value: '단기 (1-3M)',
              valueLabel: '단기 (1-3M)',
              rationale: '단기 수급 충격이 가격에 즉시 반영되는 구간입니다.\n해당 기준값 범위는 1~3개월 관측 구간을 기준으로 설정했습니다.',
            },
            {
              key: 'transport_disruption',
              label: '운송 차질',
              value: '전면 차질',
              valueLabel: '전면 차질',
              rationale: '주요 항로 차단으로 우회 운송과 도착 지연이 광범위하게 발생합니다.',
            },
            {
              key: 'supply_shock',
              label: '공급 차질 - 강도',
              value: '심각',
              valueLabel: '심각',
              rationale: '글로벌 스팟 가격에 유의미한 상방 압력을 주는 수준의 차질입니다.',
            },
            {
              key: 'supply_recovery',
              label: '공급 차질 - 완화/회복',
              value: '지연 회복',
              valueLabel: '지연 회복',
              rationale: '설비·외교 제약으로 회복이 분기 단위로 지연되는 경로입니다.',
            },
            {
              key: 'demand_response',
              label: '수요 반응',
              value: '강함',
              valueLabel: '강함',
              rationale: '가격 상승에 수요가 민감하게 반응합니다.',
            },
          ],
          narrative: '설비 피해와 물류 병목이 겹치며 JKM/TTF 상승 압력이 뚜렷해집니다.',
        },
        {
          scenarioId: 2,
          displayOrder: 2,
          scenarioName: '단기 외교 해결',
          baseCase: false,
          scenarioType: 'BL',
          scenarioTypeReason: '외교 합의와 운송 정상화로 공급 압력이 완화되는 하락/완화 경로로 분류했습니다.',
          probability: 0.28,
          dimensions: [
            {
              key: 'period',
              label: '기간',
              value: '단기 (1-3M)',
              valueLabel: '단기 (1-3M)',
              rationale: '단기 수급 충격이 가격에 즉시 반영되는 구간입니다.\n해당 기준값 범위는 1~3개월 관측 구간을 기준으로 설정했습니다.',
            },
            {
              key: 'transport_disruption',
              label: '운송 차질',
              value: '정상',
              valueLabel: '정상',
              rationale: '우회·지연 없이 기존 항로가 유지되는 상태입니다.',
            },
            {
              key: 'supply_shock',
              label: '공급 차질 - 강도',
              value: '경미',
              valueLabel: '경미',
              rationale: '단기간 내 대체 공급으로 완충 가능한 수준의 차질입니다.',
            },
            {
              key: 'supply_recovery',
              label: '공급 차질 - 완화/회복',
              value: '빠른 회복',
              valueLabel: '빠른 회복',
              rationale: '1개월 내 운영 정상화가 가능한 경로입니다.',
            },
            {
              key: 'demand_response',
              label: '수요 반응',
              value: '중립',
              valueLabel: '중립',
              rationale: '가격과 수요가 균형적으로 조정됩니다.',
            },
          ],
          narrative: '외교 협의와 운영 정상화로 공급 차질이 빠르게 완화되는 경로입니다.',
        },
        {
          scenarioId: 3,
          displayOrder: 3,
          scenarioName: '우회 운송 장기화',
          baseCase: false,
          scenarioType: 'MX',
          scenarioTypeReason: '운송 차질은 지속되지만 수요 반응과 대체 공급이 혼재되어 Mixed로 분류했습니다.',
          probability: 0.25,
          dimensions: [
            {
              key: 'period',
              label: '기간',
              value: '중기 (3-6M)',
              valueLabel: '중기 (3-6M)',
              rationale:
                '중기 조정 경로에서 재고·운송 정상화 속도를 반영합니다.\n해당 기준값 범위는 3~6개월 관측 구간을 기준으로 설정했습니다.',
            },
            {
              key: 'transport_disruption',
              label: '운송 차질',
              value: '부분 차질',
              valueLabel: '부분 차질',
              rationale: '일부 항로 제약으로 운임·도착 지연이 제한적으로 발생합니다.',
            },
            {
              key: 'supply_shock',
              label: '공급 차질 - 강도',
              value: '중간',
              valueLabel: '중간',
              rationale: '지역 수급 타이트가 수주~수개월 지속되는 수준의 차질입니다.',
            },
            {
              key: 'supply_recovery',
              label: '공급 차질 - 완화/회복',
              value: '점진 회복',
              valueLabel: '점진 회복',
              rationale: '2~3개월에 걸쳐 단계적으로 정상화되는 경로입니다.',
            },
            {
              key: 'demand_response',
              label: '수요 반응',
              value: '강함',
              valueLabel: '강함',
              rationale: '가격 상승에 수요가 민감하게 반응합니다.',
            },
          ],
          narrative: '우회 운송과 도착 지연이 지속되며 아시아 스팟 가격 변동성이 확대됩니다.',
        },
        {
          scenarioId: 4,
          displayOrder: 4,
          scenarioName: '기준 경로 유지',
          baseCase: true,
          scenarioType: null,
          scenarioTypeReason: null,
          probability: 0.15,
          dimensions: [
            {
              key: 'period',
              label: '기간',
              value: '중기 (3-6M)',
              valueLabel: '중기 (3-6M)',
              rationale: '중기 조정 경로에서 재고·운송 정상화 속도를 반영합니다.',
            },
            {
              key: 'transport_disruption',
              label: '운송 차질',
              value: '부분 차질',
              valueLabel: '부분 차질',
              rationale: '일부 항로 제약으로 운임·도착 지연이 제한적으로 발생합니다.',
            },
            {
              key: 'supply_shock',
              label: '공급 차질 - 강도',
              value: '중간',
              valueLabel: '중간',
              rationale: '지역 수급 타이트가 수주~수개월 지속되는 수준의 차질입니다.',
            },
            {
              key: 'supply_recovery',
              label: '공급 차질 - 완화/회복',
              value: '점진 회복',
              valueLabel: '점진 회복',
              rationale: '2~3개월에 걸쳐 단계적으로 정상화되는 경로입니다.',
            },
            {
              key: 'demand_response',
              label: '수요 반응',
              value: '중립',
              valueLabel: '중립',
              rationale: '가격과 수요가 균형적으로 조정됩니다.',
            },
          ],
          narrative: '기존 Base Case 시나리오를 유지하며 공통 관측 범위를 제공합니다.',
        },
        {
          scenarioId: 5,
          displayOrder: 5,
          scenarioName: '공통 범위 시나리오',
          baseCase: false,
          scenarioType: 'MX',
          scenarioTypeReason: '복수 이벤트 공통 범위로 잠겨 개별 편집이 제한됩니다.',
          locked: true,
          probability: 0.1,
          dimensions: [
            {
              key: 'period',
              label: '기간',
              value: '장기 (6-12M)',
              valueLabel: '장기 (6-12M)',
              rationale: '장기 구조 변화(공급 재편·수요 전환)를 반영하는 구간입니다.',
            },
            {
              key: 'transport_disruption',
              label: '운송 차질',
              value: '부분 차질',
              valueLabel: '부분 차질',
              rationale: '일부 항로 제약으로 운임·도착 지연이 제한적으로 발생합니다.',
            },
            {
              key: 'supply_shock',
              label: '공급 차질 - 강도',
              value: '중간',
              valueLabel: '중간',
              rationale: '지역 수급 타이트가 수주~수개월 지속되는 수준의 차질입니다.',
            },
            {
              key: 'supply_recovery',
              label: '공급 차질 - 완화/회복',
              value: '지연 회복',
              valueLabel: '지연 회복',
              rationale: '설비·외교 제약으로 회복이 분기 단위로 지연되는 경로입니다.',
            },
            {
              key: 'demand_response',
              label: '수요 반응',
              value: '약함',
              valueLabel: '약함',
              rationale: '가격 상승에도 수요 감소가 제한적입니다.',
            },
          ],
          narrative: '공통 범위로 잠긴 시나리오입니다. 개별 셀 편집 대신 공통 범위 편집을 사용하세요.',
        },
        {
          scenarioId: 6,
          displayOrder: 6,
          scenarioName: '추가 관측 시나리오',
          baseCase: false,
          scenarioType: null,
          scenarioTypeReason: null,
          probability: null,
          dimensions: [
            { key: 'period', label: '기간', value: '', valueLabel: null, rationale: null },
            { key: 'transport_disruption', label: '운송 차질', value: '', valueLabel: null, rationale: null },
            { key: 'supply_shock', label: '공급 차질 - 강도', value: '', valueLabel: null, rationale: null },
            { key: 'supply_recovery', label: '공급 차질 - 완화/회복', value: '', valueLabel: null, rationale: null },
            { key: 'demand_response', label: '수요 반응', value: '', valueLabel: null, rationale: null },
          ],
          narrative: null,
        },
      ],
    },
    step2: null,
    validation: {
      isValid: true,
      reason: null,
    },
  }
}

/** #DELETE: API 적용후엔 목데이터 삭제 - 도출 근거 팝업 샘플 (노출 형식 미정) */
export const MOCK_SCENARIO_DESIGN_RATIONALE_SECTIONS: Array<{
  title: string
  blocks: Array<{
    heading?: string
    paragraphs?: string[]
    bullets?: string[]
  }>
}> = [
  {
    title: '이벤트 역할',
    blocks: [
      {
        bullets: [
          '평화안 거부 → LNG 프리미엄 상승: 프리미엄 상승을 직접 유발하는 축',
          '호르무즈 통항 제한 : 강화, 1번과 같은 방향으로 공급 축소를 가속함',
          '미·이란 협상 재개설: 상충, 1번과 반대 방향으로 프리미엄 하락 압력',
        ],
      },
    ],
  },
  {
    title: '이벤트 간 관계',
    blocks: [
      {
        heading: '평화안 거부 → LNG 프리미엄 상승 + 호르무즈 통항 제한',
        bullets: ['같은 방향. 2번이 실현되면 1번의 상승 강도가 커짐'],
      },
      {
        heading: '호르무즈 통항 제한 + 미·이란 협상 재개설',
        bullets: ['반대 방향. 3번이 실현되면 2번이 무력화되어 방향이 뒤집힐 수 있음'],
      },
      {
        heading: '종합',
        bullets: [
          '평화안 거부 → LNG 프리미엄 상승 + 호르무즈 통항 제한은 상방',
          '호르무즈 통항 제한 + 미·이란 협상 재개설은 하방으로 작동하며 세 이벤트가 한 시나리오의 상·하방을 구성함',
        ],
      },
    ],
  },
]
