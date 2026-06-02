import dayjs from 'dayjs'

import type {
  IScenarioWorkbenchEventDetailRes,
  IScenarioWorkbenchEventDriverTreeScoreboardItem,
  IScenarioWorkbenchEventInstitutionOutlook,
  IScenarioWorkbenchEventRelatedRecord,
  IScenarioWorkbenchEventRelatedScenarioGroup,
} from '@/service/mi/scenarioWorkbench/event'

import { EventCategoryLv1, MarketDirection, MarketImpactLevel } from '@/service/mi/scenarioWorkbench/common'

/** 가로 스크롤|페이드 UI 검증용 긴 텍스트 접미사 */
const MOCK_LONG_TEXT_SUFFIX =
  ' - 시장 참가자들은 단기 spot premium, term contract 재협상, 호르무즈 통항 리스크, 보험료 상승, VLGC 운임, 대체 카고 확보 경쟁, 유럽·아시아 간 물량 재배치를 종합적으로 반영해 가격 변동성을 재평가하고 있습니다.'

const withLongAiInsightBody = (body: string) => `${body}${MOCK_LONG_TEXT_SUFFIX}`

const buildDriverTreeRow = (item: IScenarioWorkbenchEventDriverTreeScoreboardItem): IScenarioWorkbenchEventDriverTreeScoreboardItem => ({
  ...item,
  lv2Label: item.lv2Label ? `${item.lv2Label} (LNG supply chain)` : item.lv2Label,
  lv3Label: item.lv3Label ? `${item.lv3Label} / Middle East export hub` : item.lv3Label,
  reason: item.reason ? `${item.reason}${MOCK_LONG_TEXT_SUFFIX}` : item.reason,
})

const MOCK_EVENT_DETAIL_BASE: Omit<IScenarioWorkbenchEventDetailRes, 'eventId' | 'eventName'> = {
  status: 'updated',
  statusLabel: '갱신',
  signalType: 'signal',
  signalTypeLabel: '신호',
  createdAt: dayjs('2026-05-04 13:40').toISOString(),
  updatedAt: dayjs('2026-05-11 17:00').toISOString(),
  impactAnalysis: {
    eventCategoryLv1: EventCategoryLv1.INFRASTRUCTURE_FACILITY,
    eventCategoryLv2: 'LNG_Export_Facility',
    sources: ['Reuters', 'Platts', 'QatarEnergy'],
    indexImpacts: [
      {
        indexName: 'JKM',
        shortTermImpactLevel: MarketImpactLevel.HIGH,
        shortTermDirection: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.MEDIUM,
        midLongTermDirection: MarketDirection.BEARISH,
      },
      {
        indexName: 'TTF',
        shortTermImpactLevel: MarketImpactLevel.MEDIUM,
        shortTermDirection: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.LOW,
        midLongTermDirection: MarketDirection.BEARISH,
      },
      {
        indexName: 'HH',
        shortTermImpactLevel: MarketImpactLevel.LOW,
        shortTermDirection: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.LOW,
        midLongTermDirection: MarketDirection.BULLISH,
      },
    ],
    analysisText:
      '카타르 LNG 핵심 설비가 군사 리스크에 노출되면서 단기 TTF/JKM 상방 압력이 확대되고 있습니다. 물리적 공급 차질 규모가 제한적이더라도 보험료·운송 지연·현물 카고 경쟁이 동시에 강화될 수 있어 리스크 프리미엄 반영 폭이 커질 수 있습니다.',
  },
  aiInsights: {
    keySummaries: [
      '5/8 보도: 이란 공적으로 카타르 LNG 수출능력 17% 타격, 액화 설비 2기(Train 2기) 손상 → Ras Laffan 글로벌 LNG 13.5% 공급 차질',
      'Edison(이탈리아)향 LNG 화물 12카고 취소, 2026년 4월~7월 초. QatarEnergy force majeure 진동. 향후 계약 복원 3차 재개 가능성 제기',
      '카타르발 유럽 공급 감소로 TTF/NBP 강세, Asian buyer(Edison·일본·중국) 대체 카고 경쟁 강화로 JKM 강세 압력',
      'Edison CEO: 평화 합의 실패 시 30~45일 내 카타르 LNG 정상화 가능 view. JKM 6월물 $17+ 위험 프리미엄 $5~7 반영 상태',
    ],
    detailedAnalysisBlocks: [
      {
        title: '사건 요약',
        body: withLongAiInsightBody(
          '이스라엘의 카타르 LNG 관련 설비 타격으로 Ras Laffan 인근 가스터빈 12기가 최소 4일간 영향을 받은 것으로 파악되며, 이는 단기적으로 TTF/JKM 가격에 상방 압력을 주는 이벤트입니다. 물리적 공급 차질이 즉시 대규모로 확인되지 않더라도, 카타르 LNG 핵심 인프라가 군사 리스크에 노출되었다는 점 자체가 시장의 경계심을 높이는 요인입니다.',
        ),
      },
      {
        title: '영향 경로',
        body: withLongAiInsightBody(
          'Ras Laffan은 글로벌 LNG 공급의 약 15%를 담당하는 핵심 수출 허브로, 실제 수출 중단 여부와 별개로 설비 안정성 우려만으로도 보험료 상승, 선박 운항 지연, 현물 카고 확보 경쟁을 유발할 수 있습니다. 특히 호르무즈 해협 통항 리스크와 결합될 경우, 시장은 단순 설비 피해보다 운송·보험·재조달 비용 전반의 상승 가능성을 함께 가격에 반영하게 됩니다.',
        ),
      },
      {
        title: '시장 반응',
        body: withLongAiInsightBody(
          '현재 시장은 호르무즈 해협 통항 리스크, 중동발 군사 긴장, 카타르 공급 안정성 재평가를 동시에 반영하고 있으며, 일부 트레이더는 JKM 가격에 기존 전망 대비 $5~7 수준의 프리미엄을 반영하고 있습니다. 이는 실제 공급 감소가 확정되기 전에도 단기 현물 시장에서 선제적 매수, 대체 카고 확보, 아시아·유럽 간 물량 경쟁이 강화될 수 있음을 시사합니다.',
        ),
      },
      {
        title: 'LNG 시장 관점',
        body: withLongAiInsightBody(
          '단기적으로는 물리적 차질보다 리스크 프리미엄이 가격을 끌어올릴 가능성이 크며, 중장기적으로는 일본·중국·인도 등 아시아 주요 수입국의 카타르 의존도가 재평가될 수 있습니다. 이번 이벤트는 카타르 LNG의 구조적 중요성을 다시 부각시키는 계기로, 향후 장기계약 안정성, 공급선 다변화, 중동 경유 물량에 대한 리스크 관리 니즈가 강화될 가능성이 있습니다.',
        ),
      },
    ],
  },
  driverTreeScoreboard: (
    [
      // JKM
      {
        indexName: 'JKM',
        lv1Label: '국가별 LNG 공급량',
        lv2Label: '기존 인프라 공급량',
        lv3Label: 'Liquefaction Rate',
        marketImpactLevel: MarketImpactLevel.HIGH,
        direction: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.MEDIUM,
        midLongTermDirection: MarketDirection.BULLISH,
        reason: 'Ras Laffan Train 2기 손상 가능성 → 수출능력 17% 영향',
      },
      {
        indexName: 'JKM',
        lv1Label: '지역 간 운송',
        lv2Label: '화물 흐름',
        lv3Label: 'Cargo Flow Shift',
        marketImpactLevel: MarketImpactLevel.MEDIUM,
        direction: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.LOW,
        midLongTermDirection: MarketDirection.BULLISH,
        reason: 'Edison향 LNG 12기 지연 가능성 → EU buyer 재조달 수요',
      },
      {
        indexName: 'JKM',
        lv1Label: '수입 수요',
        lv2Label: '아시아 현물 수요',
        lv3Label: 'Spot Competition',
        marketImpactLevel: MarketImpactLevel.HIGH,
        direction: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.MEDIUM,
        midLongTermDirection: MarketDirection.BULLISH,
        reason: '호르무즈 통항 불확실성 → 보험료·운송 리스크 상승',
      },
      // TTF
      {
        indexName: 'TTF',
        lv1Label: '유럽 공급 안정성',
        lv2Label: 'LNG 유입량',
        lv3Label: 'Send-out Volume',
        marketImpactLevel: MarketImpactLevel.HIGH,
        direction: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.MEDIUM,
        midLongTermDirection: MarketDirection.BEARISH,
        reason: '아시아향 물량 전환 시 유럽 LNG 유입량 축소 가능',
      },
      {
        indexName: 'TTF',
        lv1Label: '재고 / 저장 수준',
        lv2Label: '저장률',
        lv3Label: 'Storage Buffer',
        marketImpactLevel: MarketImpactLevel.MEDIUM,
        direction: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.LOW,
        midLongTermDirection: MarketDirection.BULLISH,
        reason: '공급 불확실성 확대 시 유럽 재고 방어 심리 강화',
      },
      {
        indexName: 'TTF',
        lv1Label: '가격 경쟁',
        lv2Label: '아시아-유럽 스프레드',
        lv3Label: 'JKM-TTF Spread',
        marketImpactLevel: MarketImpactLevel.LOW,
        direction: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.MEDIUM,
        midLongTermDirection: MarketDirection.BEARISH,
        reason: 'JKM 프리미엄 확대 시 유럽향 카고 유출 가능성',
      },
      // HH (placeholder)
      {
        indexName: 'HH',
        lv1Label: 'Text',
        lv2Label: 'Text',
        lv3Label: 'Text',
        marketImpactLevel: MarketImpactLevel.MEDIUM,
        direction: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.HIGH,
        midLongTermDirection: MarketDirection.BEARISH,
        reason: 'Text',
      },
      {
        indexName: 'HH',
        lv1Label: 'Text',
        lv2Label: 'Text',
        lv3Label: 'Text',
        marketImpactLevel: MarketImpactLevel.MEDIUM,
        direction: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.LOW,
        midLongTermDirection: MarketDirection.BULLISH,
        reason: 'Text',
      },
      {
        indexName: 'HH',
        lv1Label: 'Text',
        lv2Label: 'Text',
        lv3Label: 'Text',
        marketImpactLevel: MarketImpactLevel.MEDIUM,
        direction: MarketDirection.BULLISH,
        midLongTermImpactLevel: MarketImpactLevel.LOW,
        midLongTermDirection: MarketDirection.BULLISH,
        reason: 'Text',
      },
    ] satisfies IScenarioWorkbenchEventDriverTreeScoreboardItem[]
  ).map(buildDriverTreeRow),
  relatedScenarioGroup: {
    groupName: '카타르 LNG 공급 차질 확산',
    scenarios: [
      {
        scenarioId: 501,
        scenarioName: '외교 정상화 / 물리 점진 복구',
        baseCase: false,
        feasibility: 72,
        duration: '단기(1~3M)',
        transportDisruption: '낮음',
        supplyDisruptionIntensity: '거의 없음',
        supplyRecoveryPattern: `급격한 차질 -> 점진 복구${MOCK_LONG_TEXT_SUFFIX}`,
        normalizationConfirmation: `긴장 완화, 설비 정상화, FM 해제 모니터링${MOCK_LONG_TEXT_SUFFIX}`,
      },
      {
        scenarioId: 502,
        scenarioName: '부분 회복 · 제약 2/3 재개',
        baseCase: true,
        feasibility: 88,
        duration: '중기(3~6M)',
        transportDisruption: '중간',
        supplyDisruptionIntensity: '중간',
        supplyRecoveryPattern: `부분 차질 -> 제한적 복구, spot cargo 재개 순차화${MOCK_LONG_TEXT_SUFFIX}`,
        normalizationConfirmation: `Train 2기 부분 가동, Edison contract 재협상${MOCK_LONG_TEXT_SUFFIX}`,
      },
      {
        scenarioId: 503,
        scenarioName: '장기 FM · 아시아 spot 경쟁 심화',
        baseCase: false,
        feasibility: 55,
        duration: '중기(3~6M)',
        transportDisruption: '중간~높음',
        supplyDisruptionIntensity: '중간~높음',
        supplyRecoveryPattern: `지속 차질 -> 대체 공급, 미국 spot inflow${MOCK_LONG_TEXT_SUFFIX}`,
        normalizationConfirmation: `대체 카고 확보, 아시아 buyer tender 증가${MOCK_LONG_TEXT_SUFFIX}`,
      },
      {
        scenarioId: 504,
        scenarioName: 'Tail Risk: 추가 가격/Force Majeure',
        baseCase: false,
        feasibility: 28,
        duration: '장기(6M+)',
        transportDisruption: '매우 높음',
        supplyDisruptionIntensity: '매우 높음',
        supplyRecoveryPattern: `장기 차질 -> 구조적 재편, term price review${MOCK_LONG_TEXT_SUFFIX}`,
        normalizationConfirmation: `FM 해제 지연, diplomatic channel 불확실${MOCK_LONG_TEXT_SUFFIX}`,
      },
      {
        scenarioId: 505,
        scenarioName: '시나리오명 (placeholder)',
        baseCase: false,
        feasibility: 40,
        duration: '기준값',
        transportDisruption: '기준값',
        supplyDisruptionIntensity: '기준값',
        supplyRecoveryPattern: '기준값',
        normalizationConfirmation: '기준값',
      },
    ],
  } satisfies IScenarioWorkbenchEventRelatedScenarioGroup,
}

const withLongOutlookSummary = (summary: string) => `${summary}${MOCK_LONG_TEXT_SUFFIX}`

export const MOCK_EVENT_INSTITUTION_OUTLOOKS: IScenarioWorkbenchEventInstitutionOutlook[] = [
  {
    publishedAt: dayjs('2026-05-10 09:00').toISOString(),
    institutionName: 'Goldman Sachs',
    outlookSummary: withLongOutlookSummary(
      'JKM spot은 중동 리스크 프리미엄으로 단기 $16~18 구간 테스트 가능. TTF는 유럽 재고 대비 상대적 강세 지속 전망.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-09 14:30').toISOString(),
    institutionName: 'Energy Aspects',
    outlookSummary: withLongOutlookSummary(
      '카타르 Train 복구 시나리오별 JKM curve steepening. FM 발동 시 아시아 spot premium $4~6 추가 반영 가능.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-08 11:00').toISOString(),
    institutionName: 'ICIS',
    outlookSummary: withLongOutlookSummary(
      'Ras Laffan 물량 재배치로 TTF-NBP spread 확대. Edison 취소 물량은 미국 spot 또는 대체 중동 cargo로 대체될 가능성.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-07 16:45').toISOString(),
    institutionName: 'Wood Mackenzie',
    outlookSummary: withLongOutlookSummary(
      '2026 Q2 LNG balance 타이트닝. 카타르 이벤트는 구조적 premium보다 이벤트 드리븐 spike 성격이 강함.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-06 10:20').toISOString(),
    institutionName: 'Rystad Energy',
    outlookSummary: withLongOutlookSummary(
      '호르무즈 리스크와 결합 시 운임·보험 비용 상승이 JKM에 전이. 45일 내 부분 정상화 시 premium 일부 반납 예상.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-05 08:15').toISOString(),
    institutionName: 'BloombergNEF',
    outlookSummary: withLongOutlookSummary('아시아 수입국 카타르 의존도 재평가. 중장기 term contract 재협상 pressure 증가 가능.'),
  },
  {
    publishedAt: dayjs('2026-05-04 13:40').toISOString(),
    institutionName: 'Platts Analytics',
    outlookSummary: withLongOutlookSummary('초기 market reaction: JKM front-month +8% spike. Physical cargo 재배치 lag 2~3주 가정.'),
  },
  {
    publishedAt: dayjs('2026-05-03 09:00').toISOString(),
    institutionName: 'FGE',
    outlookSummary: withLongOutlookSummary('TTF HH spread vs JKM arbitrage 창 축소. 유럽 buyers 아시아 spot competition intensifies.'),
  },
  {
    publishedAt: dayjs('2026-05-02 15:30').toISOString(),
    institutionName: 'S&P Global',
    outlookSummary: withLongOutlookSummary(
      'Force majeure probability medium-high for Q2 cargoes. Recovery path hinges on diplomatic channel.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-01 12:00').toISOString(),
    institutionName: 'Macquarie',
    outlookSummary: withLongOutlookSummary('LNG portfolio managers increase hedge ratio. Vol surface steepening in Jun-Aug contracts.'),
  },
  {
    publishedAt: dayjs('2026-04-30 10:00').toISOString(),
    institutionName: 'Morgan Stanley',
    outlookSummary: withLongOutlookSummary('Base case: partial recovery 4~6 weeks. Bull case: prolonged disruption supports $18+ JKM.'),
  },
]

const withLongRecordFields = (title: string, summary: string) => ({
  title: `${title}${MOCK_LONG_TEXT_SUFFIX}`,
  summary: `${summary}${MOCK_LONG_TEXT_SUFFIX}`,
})

export const MOCK_EVENT_MI_RECORDS: IScenarioWorkbenchEventRelatedRecord[] = [
  {
    publishedAt: dayjs('2026-05-11 08:00').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields(
      'QatarEnergy confirms Ras Laffan maintenance extension',
      'Train 2 복구 일정 2주 연장 가능성 언급. 시장은 추가 premium 반영.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-10 17:30').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields(
      'Edison seeks alternative LNG cargoes for summer delivery',
      '이탈리아 utility, 카타르 FM 이후 미국·알제리 spot cargo 검토 중.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-09 11:15').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields(
      'JKM front-month rises on Middle East supply fears',
      '아시아 spot LNG 가격 6거래일 연속 상승. trader들 risk premium 확대.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-08 09:45').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields(
      'Israel-Iran tensions escalate near Gulf energy routes',
      '호르무즈 인근 해상 traffic monitoring 강화. insurance cost 상승.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-07 14:00').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields('TTF strengthens as European buyers compete for spot LNG', '유럽 재고 대비 spot demand 견조. NBP 동반 강세.'),
  },
  {
    publishedAt: dayjs('2026-05-06 10:30').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields('12 Qatar cargoes to Italy cancelled: sources', 'Edison 계약 cargo 4~7월 delivery 취소. FM 협상 진행 중.'),
  },
  {
    publishedAt: dayjs('2026-05-05 16:20').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields(
      'Ras Laffan facility hit: market assesses supply impact',
      '글로벌 LNG supply 13.5% 영향 추정. physical disruption 확인 중.',
    ),
  },
  {
    publishedAt: dayjs('2026-05-04 13:40').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields('Initial reports: Qatar LNG export capacity affected', '이란 공격 관련 보도. Train 2기 손상 first reports.'),
  },
  {
    publishedAt: dayjs('2026-05-03 08:00').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields('Asian LNG importers review supply security plans', '일본·한국·중국 utilities emergency supply protocol 점검.'),
  },
  {
    publishedAt: dayjs('2026-05-02 12:00').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields('LNG shipping rates tick higher on Gulf risk', 'VLGC freight mid-East route premium 확대.'),
  },
  {
    publishedAt: dayjs('2026-05-01 09:30').toISOString(),
    recordType: 'NEWS',
    ...withLongRecordFields('Analysts flag $5~7 JKM risk premium', 'major banks, event-driven spike vs structural shortage 구분 강조.'),
  },
]

export const buildMockEventDetail = (eventId: string, eventName?: string): IScenarioWorkbenchEventDetailRes => ({
  eventId,
  eventName: eventName ?? '[카타르 LNG 차질] 설비 타격·이탈리아 12카고 취소 → TTF/JKM 강세',
  ...MOCK_EVENT_DETAIL_BASE,
})
