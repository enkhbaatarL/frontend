/** #DELETE: Case 1 파라미터 표 - 시나리오 컬럼 상태 포함 목 (API 연동 후 파일 삭제) */

export type ProposalParamColumnStatus = 'completed' | 'generating'

export interface ProposalParamPeriodColumn {
  periodLabel: string
  miBaseValues: string[]
  scenarioValuesById: Record<number, string[]>
}

export interface ProposalParamMatrixMock {
  modelFiles: string[]
  modelSheets: string[]
  modelTables: string[]
  fixedHeaders: string[]
  fixedRows: string[][]
  periods: ProposalParamPeriodColumn[]
}

export const createProposalParamMatrixMock = (scenarioIds: number[]): ProposalParamMatrixMock => {
  // #DELETE: 파라미터 매트릭스 목 데이터 생성
  const rowCount = 12
  const miBaseSeed = [0.153, 0.13, 0.148, 0.121, 0.162, 0.139, 0.155, 0.127, 0.141, 0.118, 0.167, 0.133]
  const scenarioSeeds: Record<number, number[]> = {
    1001: [24.4, 0, 125.32, 18.2, 9.5, 0, 42.1, 3.3, 11.2, 0, 55.0, 7.4],
    1002: [12.1, 4.2, 88.0, 10.5, 6.1, 1.2, 30.4, 2.1, 8.8, 0.5, 40.2, 5.1],
    1003: [0, 0, 15.4, 7.8, 2.2, 0, 11.0, 0.5, 3.1, 0, 18.6, 1.2],
    1004: [5.5, 1.1, 40.0, 9.9, 3.3, 0.8, 20.0, 1.4, 4.4, 0.2, 22.2, 2.0],
    1005: [8.8, 2.0, 55.5, 12.3, 4.4, 0.2, 25.5, 1.8, 6.0, 0.7, 33.3, 2.8],
    1006: [3.3, 0.4, 22.0, 6.6, 1.5, 0, 14.4, 0.9, 2.2, 0, 12.0, 1.0],
  }

  const countries = [
    'Austria',
    'Angola',
    'Australia',
    'Belgium',
    'Brazil',
    'Canada',
    'China',
    'Egypt',
    'France',
    'Germany',
    'India',
    'Japan',
  ]
  const plants = [
    'Plant A',
    'Plant B',
    'Plant C',
    'Plant D',
    'Plant E',
    'Plant F',
    'Plant G',
    'Plant H',
    'Plant I',
    'Plant J',
    'Plant K',
    'Plant L',
  ]

  const buildScenarioValues = (scenarioId: number, periodIndex: number) => {
    const seed = scenarioSeeds[scenarioId] ?? miBaseSeed
    return Array.from({ length: rowCount }, (_, rowIndex) => {
      const value = seed[rowIndex % seed.length] * (1 + periodIndex * 0.02)
      return value.toFixed(value >= 10 ? 1 : 3)
    })
  }

  return {
    modelFiles: ['Demand', 'Supply', 'Trade'],
    modelSheets: ['PowerMix', 'GasDemandGrowth', 'HDD'],
    modelTables: Array.from({ length: 12 }, (_, index) => `Table ${index + 1}`),
    fixedHeaders: ['Country', 'LNG Plant', 'LNG Plant Train', 'Life Cycle Category', 'Nameplate Capacity (MTPA)'],
    fixedRows: Array.from({ length: rowCount }, (_, rowIndex) => [countries[rowIndex], plants[rowIndex], 'Text', 'Text', 'Text']),
    periods: [
      {
        periodLabel: '2026-08 (104)',
        miBaseValues: miBaseSeed.map((value) => value.toFixed(3)),
        scenarioValuesById: Object.fromEntries(scenarioIds.map((scenarioId) => [scenarioId, buildScenarioValues(scenarioId, 0)])),
      },
      {
        periodLabel: '2026-09 (105)',
        miBaseValues: miBaseSeed.map((value) => (value * 0.98).toFixed(3)),
        scenarioValuesById: Object.fromEntries(scenarioIds.map((scenarioId) => [scenarioId, buildScenarioValues(scenarioId, 1)])),
      },
      {
        periodLabel: '2026-10 (106)',
        miBaseValues: miBaseSeed.map((value) => (value * 1.01).toFixed(3)),
        scenarioValuesById: Object.fromEntries(scenarioIds.map((scenarioId) => [scenarioId, buildScenarioValues(scenarioId, 2)])),
      },
    ],
  }
}
