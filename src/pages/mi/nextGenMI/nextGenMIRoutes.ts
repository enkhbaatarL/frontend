export const NEXT_GEN_MI_BASE_PATH = '/mi/next-gen-mi'
import EventsTabPanel from '@/pages/mi/nextGenMI/tabs/EventsTabPanel'
import ScenarioGroupsTabPanel from '@/pages/mi/nextGenMI/tabs/ScenarioGroupsTabPanel'

export const NEXT_GEN_MI_TAB_INFO = [
  { key: 'events', label: 'Event List', segment: 'events', path: `${NEXT_GEN_MI_BASE_PATH}/events`, content: EventsTabPanel },
  {
    key: 'scenarios',
    label: 'Scenario Group List',
    segment: 'scenarios',
    path: `${NEXT_GEN_MI_BASE_PATH}/scenarios`,
    content: ScenarioGroupsTabPanel,
  },
] as const

export type NextGenMITabInfo = (typeof NEXT_GEN_MI_TAB_INFO)[number]

export type NextGenMITabKey = 'events' | 'scenarios'

export const getNextGenMITabPath = (tabKey: NextGenMITabKey) => {
  const tab = NEXT_GEN_MI_TAB_INFO.find((item) => item.key === tabKey)
  return tab?.path ?? NEXT_GEN_MI_TAB_INFO[0].path
}

export const getNextGenMIScenarioGroupDetailPath = (scenarioGroupId: string | number, scenarioId?: string | number) => {
  const base = `${NEXT_GEN_MI_BASE_PATH}/scenarios/group/${encodeURIComponent(String(scenarioGroupId))}`
  if (scenarioId === undefined || scenarioId === null || scenarioId === '') return base
  return `${base}?scenarioId=${encodeURIComponent(String(scenarioId))}`
}

export const getNextGenMIScenarioDesignPath = ({
  eventIds,
  scenarioGroupId,
}: {
  eventIds: Array<string | number>
  scenarioGroupId?: string | number | null
}) => {
  if (scenarioGroupId !== undefined && scenarioGroupId !== null) {
    return `${NEXT_GEN_MI_BASE_PATH}/scenario-design/groups/${encodeURIComponent(String(scenarioGroupId))}`
  }

  const searchParams = new URLSearchParams()
  Array.from(new Set(eventIds.map(String))).forEach((eventId) => searchParams.append('eventId', eventId))

  const query = searchParams.toString()
  return query ? `${NEXT_GEN_MI_BASE_PATH}/scenario-design?${query}` : `${NEXT_GEN_MI_BASE_PATH}/scenario-design`
}

export const resolveNextGenMITabFromPathname = (pathname: string): NextGenMITabKey => {
  const defaultKey = NEXT_GEN_MI_TAB_INFO[0].key
  const normalizedPathname = pathname.replace(/\/+$/, '')
  if (normalizedPathname === NEXT_GEN_MI_BASE_PATH) return defaultKey

  const pathPrefix = `${NEXT_GEN_MI_BASE_PATH}/`
  if (!normalizedPathname.startsWith(pathPrefix)) return defaultKey

  const firstSegment = normalizedPathname.slice(pathPrefix.length).split('/')[0]
  return NEXT_GEN_MI_TAB_INFO.find((tab) => tab.segment === firstSegment)?.key ?? defaultKey
}

export const getNextGenMITabIndex = (tabKey: NextGenMITabKey) => NEXT_GEN_MI_TAB_INFO.findIndex((tab) => tab.key === tabKey)

export const getNextGenMIEventDetailPath = (eventId: string | number) =>
  `${NEXT_GEN_MI_BASE_PATH}/events/${encodeURIComponent(String(eventId))}`
