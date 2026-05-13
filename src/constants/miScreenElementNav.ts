import { ComponentType } from 'react'

import DashboardIcon from '@/components/common/icons/gnb/DashboardIcon'
import ForecastIcon from '@/components/common/icons/gnb/ForecastIcon'
import FundamentalModelIcon from '@/components/common/icons/gnb/FundamentalModelIcon'
import MetricsIcon from '@/components/common/icons/gnb/MetricsIcon'
import NewsIcon from '@/components/common/icons/gnb/NewsIcon'
import ParallelIcon from '@/components/common/icons/gnb/ParallelIcon'
import PositionPlayIcon from '@/components/common/icons/gnb/PositionPlayIcon'
import ReportIcon from '@/components/common/icons/gnb/ReportIcon'
import ScenarioWorkbenchIcon from '@/components/common/icons/gnb/ScenarioWorkbenchIcon'
import SignalIcon from '@/components/common/icons/gnb/SignalIcon'

export interface MiMenuItemDef {
  label: string
  path: string
  desc?: string // i18n key (miMenuItem.forecast.desc)
  IconComponent?: ComponentType
}

export const toMiLocationPath = (relativePath: string): string => `/mi/${relativePath.replace(/^\/+/, '')}`

/** MENU_TOP — 대메뉴 */
export const MI_MENU_TOP_REGISTRY = {
  DASHBOARD: { label: 'Dashboard' },
  AI_FORECAST: { label: 'AI Forecast' },
  MARKET_DATA: { label: 'Market Data' },
} as const satisfies Record<string, { label: string }>

/** MENU_GROUP — 섹션 타이틀 */
export const MI_MENU_GROUP_REGISTRY = {
  DASHBOARD_SVC_GRP: { label: 'Services' },
  MARKET_DATA_SVC_GRP: { label: 'Services' },
} as const satisfies Record<string, { label: string }>

/** MENU_ITEM */
export const MI_MENU_ITEM_REGISTRY = {
  DASHBOARD_BRIEF: {
    label: 'Dashboard',
    path: 'dashboard',
    desc: 'miMenuItem.dashboard.desc',
    IconComponent: DashboardIcon,
  },
  AI_MARKET_SUMMARY: { label: 'AI Market Summary', path: 'ai-market-summary' },
  TOPIC_TRACKER: { label: 'Topic Tracker', path: 'topic-tracker' },
  ECONOMIC_CALENDAR: { label: 'Economic Calendar', path: 'economic-calendar' },
  NEWSLETTERS: { label: 'Newsletters', path: 'newsletters' },
  AI_FORECAST_MODEL: {
    label: 'AI Forecast Model',
    path: 'forecast',
    desc: 'miMenuItem.forecast.desc',
    IconComponent: ForecastIcon,
  },
  SIGNAL_MAP: {
    label: 'Signal Map',
    path: 'signal-map',
    desc: 'miMenuItem.signalMap.desc',
    IconComponent: SignalIcon,
  },
  SCENARIO_WORKBENCH: {
    label: 'MI Scenario Workbench',
    path: 'scenario-workbench',
    desc: 'miMenuItem.scenarioWorkbench.desc',
    IconComponent: ScenarioWorkbenchIcon,
  },
  FUNDAMENTAL_MODEL: {
    label: 'MI Fundamental Model',
    path: 'fundamental-model',
    desc: 'miMenuItem.fundamentalModel.desc',
    IconComponent: FundamentalModelIcon,
  },
  PARALLEL_COORDINATES: {
    label: 'Parallel Coordinates',
    path: 'parallel-coordinates',
    desc: 'miMenuItem.parallelCoordinates.desc',
    IconComponent: ParallelIcon,
  },
  POSITION_PLAY: {
    label: 'Position Play',
    path: 'position-play',
    IconComponent: PositionPlayIcon,
  },
  MARKET_METRICS: {
    label: 'Market Metrics',
    path: 'market-data',
    desc: 'miMenuItem.marketMetrics.desc',
    IconComponent: MetricsIcon,
  },
  MARKET_REPORTS: {
    label: 'Market Reports',
    path: 'insights',
    desc: 'miMenuItem.marketReports.desc',
    IconComponent: ReportIcon,
  },
  MARKET_NEWS: {
    label: 'Market News',
    path: 'market-news',
    desc: 'miMenuItem.marketNews.desc',
    IconComponent: NewsIcon,
  },
  QUALITATIVE_ANALYSIS: { label: 'Qualitative Analysis', path: 'custom' },
  SALES_ANALYSIS: {
    label: 'Sales Analysis',
    path: 'sales-analysis',
    desc: 'miMenuItem.salesAnalysis.desc',
    IconComponent: MetricsIcon,
  },
  MARKET_MAP: {
    label: 'Market Map',
    path: 'market-map',
    desc: 'miMenuItem.marketMap.desc',
    IconComponent: MetricsIcon,
  },
  MI_ACTIVITY_LOG: { label: 'MI Activity Log', path: 'mi-activity-log' },
  SALES_ACTIVITY_LOG: { label: 'Sales Activity Log', path: 'sales-activity-log' },
} as const satisfies Record<string, MiMenuItemDef>

export const getMiMenuTopLabel = (screenElementCd: string): string | undefined =>
  (MI_MENU_TOP_REGISTRY as Record<string, { label: string }>)[screenElementCd]?.label

export const getMiMenuGroupLabel = (screenElementCd: string): string | undefined =>
  (MI_MENU_GROUP_REGISTRY as Record<string, { label: string }>)[screenElementCd]?.label

export const getMiMenuItemDef = (screenElementCd: string): MiMenuItemDef | undefined =>
  (MI_MENU_ITEM_REGISTRY as Record<string, MiMenuItemDef>)[screenElementCd]

/** `/mi/{segment}/...` 의 `segment`가 레지스트리 `path`와 일치할 때 해당 MENU_ITEM의 `screenElementCd` */
export const getMiMenuItemScreenElementCdByPathSegment = (segment: string): string | undefined => {
  if (!segment) return undefined
  for (const [cd, def] of Object.entries(MI_MENU_ITEM_REGISTRY) as [string, MiMenuItemDef][]) {
    const base = def.path.replace(/^\/+/, '').split('/')[0]
    if (base === segment) return cd
  }
  return undefined
}
