/** #DELETE: 수급모델 팝업 - 추천 파라미터 생성 리스트 UI용 목 (API 연동 후 파일 삭제) */

export type ModelParamProposalRowStatus = 'idle' | 'generating' | 'completed' | 'failed' | 'retryable'

export interface ModelParamProposalScenarioRow {
  scenarioId: number
  displayOrder: number
  scenarioName: string
  dimensionValues: string[]
  possibility: number
  status: ModelParamProposalRowStatus
  /** 완료/생성 중 시나리오명 우측 On/Off(눈) 표시 */
  showVisibilityToggle?: boolean
  failureReason?: string
}

export interface ModelParamProposalScenarioGroupMock {
  createdAtLabel: string
  groupName: string
  dimensionColumns: string[]
  scenarios: ModelParamProposalScenarioRow[]
}

/** #DELETE: Case 1 - 완료/생성/생성중/실패/재시도 상태 확인용 목 (API 연동 후 삭제) */
export const createModelParamProposalScenarioGroupMock = (): ModelParamProposalScenarioGroupMock => ({
  createdAtLabel: '03-01 00:00',
  groupName: '중동 리스크 완화와 아프리카 LNG 공급 상쇄',
  dimensionColumns: ['호르무즈 항행 차질 규모', 'LNG 직접 피해 확인 범위', '이집트 LNG 수출 감소', '아프리카 대체 화물 범위'],
  scenarios: [
    {
      scenarioId: 1001,
      displayOrder: 1,
      scenarioName: '항행 차질과 아프리카 공급 훼손 결합',
      dimensionValues: ['전면 봉쇄급', '다수 터미널 피해', '수출 급감', '대체 제한'],
      possibility: 15,
      status: 'completed',
      showVisibilityToggle: true,
    },
    {
      scenarioId: 1002,
      displayOrder: 2,
      scenarioName: '재긴장과 중기 계약 우세',
      dimensionValues: ['부분 봉쇄', '일부 터미널 피해', '수출 감소', '대체 일부'],
      possibility: 15,
      status: 'idle',
    },
    {
      scenarioId: 1003,
      displayOrder: 3,
      scenarioName: '보험료 재가격을 물량 상쇄가 흡수',
      dimensionValues: ['항행 지연', '피해 경미', '수출 소폭 감소', '대체 원활'],
      possibility: 15,
      status: 'generating',
      showVisibilityToggle: true,
    },
    {
      scenarioId: 1004,
      displayOrder: 4,
      scenarioName: '단기 완화 우세와 램프업 지연',
      dimensionValues: ['정상 항행', '피해 없음', '수출 유지', '대체 충분'],
      possibility: 15,
      status: 'failed',
      failureReason: '파라미터 생성에 실패했습니다. 입력 조건을 확인해 주세요.',
    },
    {
      scenarioId: 1005,
      displayOrder: 5,
      scenarioName: '완화 지속과 중기 공급확대 결합',
      dimensionValues: ['일시 차질', '조기 복구', '수출 회복', '대체 가능'],
      possibility: 15,
      status: 'retryable',
      failureReason: '네트워크/시스템 일시 오류가 발생했습니다. 재시도해 주세요.',
    },
  ],
})
