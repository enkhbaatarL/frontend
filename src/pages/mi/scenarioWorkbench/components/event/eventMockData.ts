import type { ScenarioWorkbenchEventRow } from './types'

/** 시나리오 워크벤치 Events 탭 UI용 목 데이터 (추후 API 연동 시 교체) */
export const SCENARIO_WORKBENCH_EVENT_MOCK_ROWS: ScenarioWorkbenchEventRow[] = [
  {
    id: 'evt-1',
    classification: '신규',
    occurredAtLabel: '04-22 09:00',
    category: '지정학적 리스크',
    eventName: '미국/이스라엘 이란 공습 개시 (Operation Epic Fury)',
    marketImpact: 3,
    marketDirection: '상승',
    isActive: true,
  },
  {
    id: 'evt-2',
    classification: '갱신',
    occurredAtLabel: '04-21 18:30',
    category: '수급밸런스',
    eventName: '이벤트명',
    marketImpact: 2,
    marketDirection: '하락',
    isActive: false,
  },
  {
    id: 'evt-3',
    classification: '신규',
    occurredAtLabel: '04-20 11:15',
    category: '지정학적 리스크',
    eventName: '이벤트명',
    marketImpact: 1,
    marketDirection: '보합',
    isActive: true,
  },
  {
    id: 'evt-4',
    classification: '갱신',
    occurredAtLabel: '04-19 08:00',
    category: '수급밸런스',
    eventName: '이벤트명',
    marketImpact: 0,
    marketDirection: '보합',
    isActive: false,
  },
  ...Array.from({ length: 21 }, (_, i) => {
    const n = i + 5
    const classification: ScenarioWorkbenchEventRow['classification'] = n % 2 === 0 ? '신규' : '갱신'
    const impact = (n % 4) as ScenarioWorkbenchEventRow['marketImpact']
    const directions: ScenarioWorkbenchEventRow['marketDirection'][] = ['상승', '하락', '보합']
    return {
      id: `evt-${n}`,
      classification,
      occurredAtLabel: `04-${String(Math.min(22, Math.max(1, 22 - (n % 20)))).padStart(2, '0')} ${String(9 + (n % 8)).padStart(2, '0')}:00`,
      category: n % 3 === 0 ? '지정학적 리스크' : '수급밸런스',
      eventName: n % 5 === 0 ? `샘플 이벤트 ${n}` : '이벤트명',
      marketImpact: impact,
      marketDirection: directions[n % 3],
      isActive: n % 4 !== 0,
    } satisfies ScenarioWorkbenchEventRow
  }),
]
