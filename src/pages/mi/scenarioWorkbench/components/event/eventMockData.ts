import type { ScenarioWorkbenchEventRow } from '@/pages/mi/scenarioWorkbench/components/event/types'

/** 시나리오 워크벤치 Events 탭 UI용 목 데이터 (추후 API 연동 시 교체) */
export const SCENARIO_WORKBENCH_EVENT_MOCK_ROWS: ScenarioWorkbenchEventRow[] = [
  {
    id: 'evt-1',
    classification: '신규',
    occurredAtLabel: '04-22 09:00',
    category: '지정학적 리스크',
    eventName: '미국/이스라엘 이란 공습 개시 (Operation Epic Fury)',
    jkmImpact: 3,
    jkmDirection: '상승',
    ttfImpact: 2,
    ttfDirection: '하락',
    hhImpact: 1,
    hhDirection: '보합',
    isActive: true,
  },
  {
    id: 'evt-2',
    classification: '갱신',
    occurredAtLabel: '04-21 18:30',
    category: '수급밸런스',
    eventName: '이벤트명',
    jkmImpact: 2,
    jkmDirection: '하락',
    ttfImpact: 1,
    ttfDirection: '보합',
    hhImpact: 0,
    hhDirection: '보합',
    isActive: false,
  },
  {
    id: 'evt-3',
    classification: '신규',
    occurredAtLabel: '04-20 11:15',
    category: '지정학적 리스크',
    eventName: '이벤트명',
    jkmImpact: 1,
    jkmDirection: '보합',
    ttfImpact: 3,
    ttfDirection: '상승',
    hhImpact: 2,
    hhDirection: '하락',
    isActive: true,
  },
  {
    id: 'evt-4',
    classification: '갱신',
    occurredAtLabel: '04-19 08:00',
    category: '수급밸런스',
    eventName: '이벤트명',
    jkmImpact: 0,
    jkmDirection: '보합',
    ttfImpact: 0,
    ttfDirection: '보합',
    hhImpact: 0,
    hhDirection: '보합',
    isActive: false,
  },
  ...Array.from({ length: 21 }, (_, i) => {
    const n = i + 5
    const classification: ScenarioWorkbenchEventRow['classification'] = n % 2 === 0 ? '신규' : '갱신'
    const impact = (n % 4) as ScenarioWorkbenchEventRow['jkmImpact']
    const directions: ScenarioWorkbenchEventRow['jkmDirection'][] = ['상승', '하락', '보합']
    const d = directions[n % 3]
    return {
      id: `evt-${n}`,
      classification,
      occurredAtLabel: `04-${String(Math.min(22, Math.max(1, 22 - (n % 20)))).padStart(2, '0')} ${String(9 + (n % 8)).padStart(2, '0')}:00`,
      category: n % 3 === 0 ? '지정학적 리스크' : '수급밸런스',
      eventName: n % 5 === 0 ? `샘플 이벤트 ${n}` : '이벤트명',
      jkmImpact: impact,
      jkmDirection: d,
      ttfImpact: ((impact + 1) % 4) as ScenarioWorkbenchEventRow['ttfImpact'],
      ttfDirection: directions[(n + 1) % 3],
      hhImpact: ((impact + 2) % 4) as ScenarioWorkbenchEventRow['hhImpact'],
      hhDirection: directions[(n + 2) % 3],
      isActive: n % 4 !== 0,
    } satisfies ScenarioWorkbenchEventRow
  }),
]
