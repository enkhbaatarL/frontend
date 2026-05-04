export const SCENARIO_WORKBENCH_BASE_PATH = '/mi/scenario-workbench'
import DesignTabPanel from '@/pages/mi/scenarioWorkbench/tabs/DesignTabPanel'
import EventsTabPanel from '@/pages/mi/scenarioWorkbench/tabs/EventsTabPanel'
import OverviewTabPanel from '@/pages/mi/scenarioWorkbench/tabs/OverviewTabPanel'
import ScenariosTabPanel from '@/pages/mi/scenarioWorkbench/tabs/ScenariosTabPanel'

export const SCENARIO_WORKBENCH_TAB_INFO = [
  { key: 'overview', label: 'Overview', segment: 'overview', path: `${SCENARIO_WORKBENCH_BASE_PATH}/overview`, content: OverviewTabPanel },
  { key: 'events', label: 'Events', segment: 'events', path: `${SCENARIO_WORKBENCH_BASE_PATH}/events`, content: EventsTabPanel },
  {
    key: 'scenarios',
    label: 'Scenarios',
    segment: 'scenarios',
    path: `${SCENARIO_WORKBENCH_BASE_PATH}/scenarios`,
    content: ScenariosTabPanel,
  },
  { key: 'design', label: 'Design', segment: 'design', path: `${SCENARIO_WORKBENCH_BASE_PATH}/design`, content: DesignTabPanel },
] as const

export type ScenarioWorkbenchTabInfo = (typeof SCENARIO_WORKBENCH_TAB_INFO)[number]

export type ScenarioWorkbenchTabKey = ScenarioWorkbenchTabInfo['key']

export const getScenarioWorkbenchTabPath = (tabKey: ScenarioWorkbenchTabKey) => {
  const tab = SCENARIO_WORKBENCH_TAB_INFO.find((item) => item.key === tabKey)
  return tab?.path ?? SCENARIO_WORKBENCH_TAB_INFO[0].path
}

export const resolveScenarioWorkbenchTabFromPathname = (pathname: string): ScenarioWorkbenchTabKey => {
  const normalizedPathname = pathname.replace(/\/+$/, '')
  if (normalizedPathname === SCENARIO_WORKBENCH_BASE_PATH) return 'overview'

  const pathPrefix = `${SCENARIO_WORKBENCH_BASE_PATH}/`
  if (!normalizedPathname.startsWith(pathPrefix)) return 'overview'

  const firstSegment = normalizedPathname.slice(pathPrefix.length).split('/')[0]
  return SCENARIO_WORKBENCH_TAB_INFO.find((tab) => tab.segment === firstSegment)?.key ?? 'overview'
}

export const getScenarioWorkbenchTabIndex = (tabKey: ScenarioWorkbenchTabKey) =>
  SCENARIO_WORKBENCH_TAB_INFO.findIndex((tab) => tab.key === tabKey)
