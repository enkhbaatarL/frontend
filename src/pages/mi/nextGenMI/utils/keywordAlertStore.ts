export interface KeywordAlertHistoryItem {
  id: string
  keyword: string
  eventName: string
  eventId: string
  date: string
  isRead: boolean
  statusLabel: string
  categoryLabel: string
  occurredAt: string
}

// #DELETE
export const KEYWORD_ALERT_HISTORY: KeywordAlertHistoryItem[] = [
  {
    id: 'keyword-history-qatar',
    keyword: '카타르',
    eventName: '[카타르 LNG 공급 제약] 불가항력 9월 말까지 연장, 유럽 대체조달 부담 유지',
    eventId: 'keyword-event-qatar-lng',
    date: '2025-03-28',
    isRead: false,
    statusLabel: '갱신',
    categoryLabel: '공급 차질',
    occurredAt: '2025-03-28 09:10',
  },
  {
    id: 'keyword-history-hormuz-navy',
    keyword: '호르무즈',
    eventName: '호르무즈 해협 이란 해군 훈련 발표, 유조선·LNG선 우회 검토 확산',
    eventId: 'keyword-event-hormuz-navy',
    date: '2026-09-28',
    isRead: true,
    statusLabel: '신규',
    categoryLabel: '지정학적 리스크',
    occurredAt: '2026-09-28 09:40',
  },
  {
    id: 'keyword-history-hormuz-tanker',
    keyword: '호르무즈',
    eventName: '호르무즈 \'압축 유조선\' 급증...원유 공급망 긴장 전 60% 직격',
    eventId: 'keyword-event-hormuz-tanker',
    date: '2025-03-28',
    isRead: true,
    statusLabel: '신규',
    categoryLabel: '공급 차질',
    occurredAt: '2025-03-28 08:20',
  },
]

// #DELETE
export const USE_HEADER_ALERT_MOCK = true

export const HEADER_KEYWORD_ALERT_HISTORY = KEYWORD_ALERT_HISTORY.filter((item) => item.id === 'keyword-history-qatar')

// #DELETE
export const HEADER_PRICE_ALERT_MOCK = [
  { id: 1, trend: 'down', title: 'DRAM Price Index', valueLabel: '112$/MMbtu', date: '2025-03-28', isRead: false },
  { id: 2, trend: 'down', title: 'DRAM Price Index', valueLabel: '112$/MMbtu', date: '2025-03-28', isRead: true },
  { id: 3, trend: 'up', title: 'DRAM Price Index', valueLabel: '112$/MMbtu', date: '2025-03-28', isRead: true },
  { id: 4, trend: 'up', title: 'DRAM Price Index', valueLabel: '112$/MMbtu', date: '2025-03-28', isRead: true },
  { id: 5, trend: 'up', title: 'DRAM Price Index', valueLabel: '112$/MMbtu', date: '2025-03-28', isRead: true },
  { id: 6, trend: 'up', title: 'DRAM Price Index', valueLabel: '112$/MMbtu', date: '2025-03-28', isRead: true },
  { id: 7, trend: 'up', title: 'DRAM Price Index', valueLabel: '112$/MMbtu', date: '2025-03-28', isRead: true },
] as const

export const findKeywordAlertHistory = (eventId: string | undefined) => KEYWORD_ALERT_HISTORY.find((item) => item.eventId === eventId)

export const buildKeywordAlertEmailSubject = (keyword: string) => `[AI Market Insights] 키워드 알람 발생 - ${keyword}`

export const getKeywordAlertDetailPath = (eventId: string) => `/mi/next-gen-mi/events/${encodeURIComponent(eventId)}`
