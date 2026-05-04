import type {
  EventDetailFundamentalIndicatorRow,
  EventDetailFundamentalMetricRow,
  EventDetailImpactTableRow,
  EventDetailMiRecordRow,
  EventDetailOutlookRow,
} from '@/pages/mi/scenarioWorkbench/components/event/types'

export const EVENT_DETAIL_IMPACT_NARRATIVE =
  '호르무즈 해협을 통과하는 글로벌 LNG 물동량 약 20%(연간 약 8,700만톤)가 지정학적 충격에 직접 노출된 상태이며, 특히 연간 8,200만톤 규모의 카타르 Ras Laffan 수출 인프라가 이란과 근접한 위치로 인해 물리적 타격 또는 운영 차질 리스크에 포함됩니다. 이는 단일 이벤트 기준으로 글로벌 LNG 공급의 유의미한 비중이 동시적으로 risk exposure에 편입되는 구조로, 실제 생산 차질이 발생하지 않더라도 물류 지연, 보험료 상승, 우회 운송 등으로 단기 공급 가용성이 감소하는 효과를 유발합니다. 수요 측면에서는 일본, 중국, 인도 등 주요 아시아 수입국이 카타르 의존도를 14~30% 수준으로 유지하고 있어, 공급 불확실성 확대 시 현물 시장에서의 물량 확보 경쟁이 가격에 빠르게 전이되는 구조입니다. 과거 Abqaiq(+$2, 단기) 및 러-우 전쟁(+$15, 수개월) 사례에서 확인된 바와 같이, 핵심 에너지 인프라 또는 chokepoint 리스크는 물리적 손상 여부와 무관하게 risk premium을 즉각적으로 반영시키며, 이번 이벤트는 노출 규모와 공급 집중도를 고려할 때 단기적으로 JKM 기준 +$5~15 수준의 가격 상승 압력을 정당화하는 수준으로 판단됩니다.'

export const EVENT_DETAIL_IMPACT_TABLE_ROWS: EventDetailImpactTableRow[] = [
  { id: 'imp-1', target: 'JKM', marketImpact: 3, direction: 'up' },
  { id: 'imp-2', target: 'TTF', marketImpact: 2, direction: 'flat' },
  { id: 'imp-3', target: 'Henry Hub', marketImpact: 3, direction: 'down' },
]

export const EVENT_DETAIL_AI_SUMMARY_BULLETS: string[] = [
  '미국/이스라엘의 이란 타격으로 중동 지정학 리스크가 구조적 긴장 국면으로 전환',
  '호르무즈 해협 통제 리스크 부각 → 글로벌 LNG 물류 chokepoint 불확실성 확대',
  '카타르 Ras Laffan 등 중동 LNG 핵심 인프라의 공급 안정성 프리미엄 상승',
  '아시아 주요 수입국의 카타르 의존 구조상 현물 시장 cargo 확보 경쟁 심화 불가피',
  '단기적으로 물리적 차질 여부와 무관하게 risk premium 중심의 JKM 가격 상승 압력 진입',
]

export const EVENT_DETAIL_AI_DETAIL_PARAGRAPH =
  '이번 이벤트는 단순 군사 충돌이 아니라 호르무즈 해협과 중동 LNG 인프라를 동시에 risk exposure 상태로 전환시킨 구조적 충격입니다. 호르무즈 해협은 글로벌 LNG 물동량의 약 20%가 통과하는 chokepoint로, 실제 봉쇄 없이도 군사적 긴장만으로 보험료 상승·항로 우회·물류 효율 저하가 발생해 단기 공급 가용성을 축소시킵니다. 카타르 Ras Laffan은 글로벌 최대 LNG 수출 허브로 공급 집중도가 매우 높아, 물리적 타격 여부와 관계없이 시장은 해당 인프라의 "정상 운영 지속 가능성"을 리스크 변수로 재평가하게 됩니다. 이는 "공급 불확실성 확대"로 작용하며 가격에 비선형적으로 반영됩니다. 수요 측면에서 일본·중국·인도 등 주요 아시아 수입국은 카타르 의존도가 높아 대체 조달 옵션이 제한적이며, 단기 현물 시장에서 유럽과의 cargo 경쟁이 심화될 가능성이 높습니다. 결과적으로 이번 이벤트는 물리적 공급 차질 여부와 별개로, 글로벌 LNG 핵심 경로와 공급 허브가 동시에 리스크에 노출되었다는 점에서 단기적으로 JKM 변동성 확대 및 상방 편향이 지속될 가능성이 높은 국면으로 판단됩니다.'

export const EVENT_DETAIL_MI_RECORD_ROWS: EventDetailMiRecordRow[] = [
  {
    id: 'mr-1',
    atLabel: '2026-02-28 09:00',
    kind: '뉴스',
    title: 'US targets several vessels, entities under new Iran-related sanctions',
    summary:
      '미국은 4월 15일 재무부 웹사이트 공지를 통해 이란 관련 및 대테러 제재를 새로 발표했다. 이번 제재는 개인 3명, 단체 17곳, 선박 9척을 대상으로 한다. 로이터는 재무부 공지를 근거로 해당 내용을 보도했다.',
  },
  ...Array.from({ length: 24 }, (_, i) => ({
    id: `mr-${i + 2}`,
    atLabel: `2026-02-${String(27 - (i % 20)).padStart(2, '0')} 09:00`,
    kind: i % 2 === 0 ? '뉴스' : '리포트',
    title: `MI Records 샘플 타이틀 ${i + 2}`,
    summary: '요약 텍스트는 API 연동 후 표시됩니다.',
  })),
]

export const EVENT_DETAIL_OUTLOOK_ROWS: EventDetailOutlookRow[] = [
  { id: 'out-1', dateLabel: '2026-02-28 09:00', institution: 'Uniper', summary: '재고 부족 대응, Spot 물량 조기 확보' },
  { id: 'out-2', dateLabel: '2026-02-28 09:00', institution: 'Engie', summary: '장기 계약 기반 안정 조달 유지' },
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `out-${i + 3}`,
    dateLabel: `2026-02-${String(26 - (i % 15)).padStart(2, '0')} 10:00`,
    institution: `기관 ${i + 3}`,
    summary: '전망 요약 샘플',
  })),
]

export const EVENT_DETAIL_FUNDAMENTAL_METRICS: EventDetailFundamentalMetricRow[] = [
  { id: 'fm-1', item: 'EU 총 저장 용량', currentValue: '약 1,100 TWh', criteria: 'EU 전체 저장 capacity 기준', source: 'GIE' },
  { id: 'fm-2', item: 'EU 평균 재고율', currentValue: '39.2%', criteria: '5년 평균 63% 대비 낮음', source: 'GIE' },
  { id: 'fm-3', item: '독일 재고율', currentValue: '약 35%', criteria: '주요 수입국 중 낮은 수준', source: 'GIE/AGSI' },
  { id: 'fm-4', item: '이탈리아 재고율', currentValue: '약 42%', criteria: '독일보다 높으나 여전히 낮은 수준', source: 'GIE/AGSI' },
  { id: 'fm-5', item: '4월 초 예상 재고율', currentValue: '약 34%', criteria: '난방 시즌 종료 기준 추정치', source: 'IEA' },
]

export const EVENT_DETAIL_FUNDAMENTAL_INDICATORS: EventDetailFundamentalIndicatorRow[] = [
  {
    id: 'fi-1',
    indicator: 'Q1 순인출 증가',
    currentValue: '+50% YoY',
    implication: '겨울 이후 재고 부담 확대',
    source: 'IEA Gas Market Report',
  },
  {
    id: 'fi-2',
    indicator: 'TTF-JKM 스프레드',
    currentValue: '-€8/MWh',
    implication: '아시아향 유럽 물량 유입 유인',
    source: 'CME/ICE (1월말)',
  },
  {
    id: 'fi-3',
    indicator: '11월 목표 대비 부족분',
    currentValue: '약 35%',
    implication: '여름 주입 수요 확대 필요',
    source: 'EU 규정 / 내부 계산',
  },
  {
    id: 'fi-4',
    indicator: '목표 달성 필요 주입량',
    currentValue: '약 25 bcm',
    implication: '여름 LNG 조달 압력 증가 가능',
    source: '내부 계산',
  },
]
