import { ComponentType } from 'react'

import DashboardIcon from '@/components/common/icons/gnb/DashboardIcon'
import ForecastIcon from '@/components/common/icons/gnb/ForecastIcon'
import MetricsIcon from '@/components/common/icons/gnb/MetricsIcon'
import NewsIcon from '@/components/common/icons/gnb/NewsIcon'
import ReportIcon from '@/components/common/icons/gnb/ReportIcon'
import SignalIcon from '@/components/common/icons/gnb/SignalIcon'

export interface SubMenuItem {
  label: string
  to: string // '/mi/' 제외한 경로 (예: '/mi/dashboard' -> 'dashboard')
  desc?: string // i18n 키
  disable?: boolean
  show?: boolean
  IconComponent?: ComponentType
  section?: 'SERVICES' | 'DEFAULT'
}

export interface MainMenuItem {
  label: string
  index: string
  subItems: SubMenuItem[]
}

export const MENU_CONFIG: MainMenuItem[] = [
  {
    label: 'Dashboard',
    index: 'dashboard',
    subItems: [
      {
        label: 'Dashboard',
        to: 'dashboard',
        desc: 'submenu.dashboard.desc',
        IconComponent: DashboardIcon,
      },
      {
        label: 'AI Market Summary',
        to: 'ai-market-summary',
        section: 'SERVICES',
      },
      {
        label: 'Topic Tracker',
        to: 'topic-tracker',
      },
      {
        label: 'Economic Calendar',
        to: 'economic-calendar',
      },
      {
        label: 'Newsletters',
        to: 'newsletters',
      },
    ],
  },
  {
    label: 'AI Forecast',
    index: 'forecast',
    subItems: [
      {
        label: 'AI Forecast Model',
        to: 'forecast',
        desc: 'submenu.forecast.desc',
        IconComponent: ForecastIcon,
      },
      {
        label: 'Signal Map',
        to: 'signal-map',
        desc: 'submenu.signalMap.desc',
        IconComponent: SignalIcon,
      },
    ],
  },
  {
    label: 'Market Data',
    index: 'market',
    subItems: [
      {
        label: 'Market Metrics',
        to: 'market-data',
        desc: 'submenu.marketMetrics.desc',
        IconComponent: MetricsIcon,
      },
      {
        label: 'Sales Analysis',
        to: 'sales-analysis',
        desc: 'submenu.salesAnalysis.desc',
        IconComponent: MetricsIcon,
      },
      {
        label: 'Market Map',
        to: 'market-map',
        desc: 'submenu.marketMap.desc',
        IconComponent: MetricsIcon,
      },
      {
        label: 'Market Reports',
        to: 'insights',
        desc: 'submenu.marketReports.desc',
        IconComponent: ReportIcon,
      },
      {
        label: 'Market News',
        to: 'market-news',
        desc: 'submenu.marketNews.desc',
        IconComponent: NewsIcon,
      },
      {
        label: 'Qualitative Analysis',
        to: 'custom',
        section: 'SERVICES',
      },
      {
        label: 'MI Activity Log',
        to: 'mi-activity-log',
        section: 'SERVICES',
      },
      {
        label: 'Sales Activity Log',
        to: 'sales-activity-log',
      },
    ],
  },
]

export const ACTIVE_MENU_PATHS = [
  ...MENU_CONFIG.map((menu) => menu.index),
  ...MENU_CONFIG.flatMap((menu) => menu.subItems.map((item) => item.to)),
] as const

export type MiPagesType = (typeof ACTIVE_MENU_PATHS)[number]

export const SUBMENU_MAP = MENU_CONFIG.reduce(
  (acc, menu) => {
    acc[menu.index] = menu.subItems.map((item) => ({
      label: item.label,
      to: `/mi/${item.to}`,
      desc: item.desc,
      disable: item.disable,
      show: false,
      IconComponent: item.IconComponent,
      section: item.section,
    }))
    return acc
  },
  {} as Record<string, SubMenuItem[]>,
)
