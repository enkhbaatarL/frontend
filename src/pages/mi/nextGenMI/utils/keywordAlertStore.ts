export interface KeywordAlertItem {
  id: string
  keyword: string
  enabled: boolean
}

export const KEYWORD_ALERT_MAX_COUNT = 20
export const KEYWORD_ALERT_MAX_LENGTH = 30
export const KEYWORD_ALERT_MIN_LENGTH = 2

const STORAGE_KEY = 'next-gen-mi-keyword-alerts'

const listeners = new Set<() => void>()
let sequence = 1

const readItems = (): KeywordAlertItem[] => {
  if (typeof sessionStorage === 'undefined') return []

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as KeywordAlertItem[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => typeof item?.id === 'string' && typeof item.keyword === 'string')
  } catch {
    return []
  }
}

let items = readItems()

items.forEach((item) => {
  const matched = /^kw-(\d+)$/.exec(item.id)
  if (matched) {
    sequence = Math.max(sequence, Number(matched[1]) + 1)
  }
})

const emit = () => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }
  listeners.forEach((listener) => listener())
}

export const subscribeKeywordAlerts = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getKeywordAlerts = () => items

export const addKeywordAlert = (keyword: string) => {
  const nextKeyword = keyword.trim()
  if (nextKeyword.length < KEYWORD_ALERT_MIN_LENGTH || items.length >= KEYWORD_ALERT_MAX_COUNT) return
  if (items.some((item) => item.keyword.toLowerCase() === nextKeyword.toLowerCase())) return

  items = [{ id: `kw-${sequence}`, keyword: nextKeyword, enabled: true }, ...items]
  sequence += 1
  emit()
}

export const toggleKeywordAlert = (id: string) => {
  items = items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
  emit()
}

export const removeKeywordAlert = (id: string) => {
  items = items.filter((item) => item.id !== id)
  emit()
}

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
