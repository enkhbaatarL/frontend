import type { EventDetail, EventListItem } from '@/service/mi/nextGenMI/event'
import type { IScenarioEventBundle } from '@/service/mi/nextGenMI/scenarioGroup'

const DUMMY_LIST_COUNT = 2
const DUMMY_REGISTRANT_NAME = '홍길동'
const STORAGE_KEY = 'next-gen-mi-user-registered-dummy'

interface DummyStore {
  eventIds: number[]
  mineEventIds: number[]
}

const emptyStore = (): DummyStore => ({ eventIds: [], mineEventIds: [] })

const readStore = (): DummyStore => {
  if (typeof sessionStorage === 'undefined') return emptyStore()

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as DummyStore
    return {
      eventIds: Array.isArray(parsed.eventIds) ? parsed.eventIds.filter((id) => typeof id === 'number') : [],
      mineEventIds: Array.isArray(parsed.mineEventIds) ? parsed.mineEventIds.filter((id) => typeof id === 'number') : [],
    }
  } catch {
    return emptyStore()
  }
}

const writeStore = (store: DummyStore) => {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

const clearStore = () => {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}

/** 응답에 사용자 등록 플래그가 없을 때 목록 앞 2건만 임시 표기한다. 맨 위에는 말줄임 확인용 행을 한 줄 더 붙인다. */
export const applyUserRegisteredEventListDummy = (items: EventListItem[], page: number): EventListItem[] => {
  if (page !== 1) return items
  if (items.some((item) => item.userRegistered === true)) {
    clearStore()
    return items
  }

  const eventIds: number[] = []
  const mineEventIds: number[] = []
  const next = items.map((item, index) => {
    if (index >= DUMMY_LIST_COUNT) return item
    eventIds.push(item.eventId)
    if (index === 0) mineEventIds.push(item.eventId)
    return {
      ...item,
      ...(index === 0
        ? {
          eventName: '[중동 지정학 리스크] 미-이란 공격 중단 뒤 긴장 완화 유럽 가스가격 추가 하락 이벤트 말줄임 처리',
        }
        : {}),
      userRegistered: true,
      registeredByMe: index === 0,
    }
  })

  const source = next[0]
  if (source) {
    const ellipsisEventId = -Math.abs(source.eventId)
    eventIds.unshift(ellipsisEventId)
    mineEventIds.unshift(ellipsisEventId)
    next.unshift({
      ...source,
      eventId: ellipsisEventId,
      eventName:
        '[중동 지정학 리스크] 미-이란 공격 중단 뒤 긴장 완화 유럽 가스가격 추가 하락 이벤트 말줄임 처리 [중동 지정학 리스크] 미-이란 공격 중단 뒤 긴장 완화 유럽 가스가격 추가 하락 이벤트 말줄임 처리',
      userRegistered: true,
      registeredByMe: true,
    })
  }

  writeStore({ eventIds, mineEventIds })
  return next
}

/** 상세 응답이 없어도 목록에서 더미로 표시한 이벤트면 배지와 등록자를 보여 준다. */
export const findUserRegisteredEventDummy = (eventId: number): { registrantName: string } | undefined => {
  const store = readStore()
  if (!store.eventIds.includes(eventId)) return undefined
  return { registrantName: DUMMY_REGISTRANT_NAME }
}

/** 목록에서 더미로 표시한 이벤트의 상세에 등록자 이름을 붙인다. */
export const applyUserRegisteredEventDetailDummy = (detail: EventDetail): EventDetail => {
  if (detail.userRegistered === true) return detail

  const store = readStore()
  if (!store.eventIds.includes(detail.eventId)) return detail

  return {
    ...detail,
    userRegistered: true,
    registrantName: detail.registrantName?.trim() || DUMMY_REGISTRANT_NAME,
  }
}

/** 기반 이벤트 목록에서 응답 플래그가 없으면 첫 행만 배지를 붙인다. */
export const applyUserRegisteredEventBundleDummy = (items: IScenarioEventBundle[]): IScenarioEventBundle[] => {
  if (items.length === 0 || items.some((item) => item.userRegistered === true)) return items

  const [first, ...rest] = items
  return [{ ...first, userRegistered: true }, ...rest]
}
