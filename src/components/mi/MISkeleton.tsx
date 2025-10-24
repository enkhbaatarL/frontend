import { ReactNode } from 'react'

import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import { MIPageSkeletons } from '@/components/mi/MIPageSkeletons'

interface Props {
  loading?: boolean
  children?: ReactNode
  variant?:
    | 'dashboard'
    | 'marketData'
    | 'insights'
    | 'signalMap'
    | 'dataDetail'
    | 'newsDetail'
    | 'boardPage'
    | 'boardDetail'
    | 'helpCenter'
    | 'table'
    | 'form'
    | 'dailyChart'
    | 'dashboardSummary'
    | 'newsletter'
  itemCount?: number
  rows?: number
  columns?: number
  fieldCount?: number
  custom?: ReactNode
}

const MISkeleton = ({ loading, children, variant = 'dashboard', rows, columns, fieldCount, custom }: Props) => {
  if (!loading) {
    return children
  }

  if (custom) {
    return custom
  }

  // variant에 따른 스켈레톤 렌더링
  switch (variant) {
    case 'dashboard':
      return <MIPageSkeletons.Dashboard />
    case 'marketData':
      return <MIPageSkeletons.MarketData />
    case 'insights':
      return <MIPageSkeletons.Insights />
    case 'signalMap':
      return <MIPageSkeletons.SignalMap />
    case 'dataDetail':
      return <MIPageSkeletons.DataDetail />
    case 'newsDetail':
      return <MIPageSkeletons.NewsDetail />
    case 'boardPage':
      return <MIPageSkeletons.BoardPageSkeleton />
    case 'boardDetail':
      return <MIPageSkeletons.BoardDetailPageSkeleton />
    case 'table':
      return <MIPageSkeletons.Table rows={rows} columns={columns} />
    case 'form':
      return <MIPageSkeletons.Form fieldCount={fieldCount} />
    case 'dailyChart':
      return <MIPageSkeletons.DailyChart />
    case 'dashboardSummary':
      return <MIBaseSkeleton.BaseElement2 width={'1028px'} height={'275px'} sx={{ mt: '40px', mb: '24px' }} />
    case 'newsletter':
      return <MIPageSkeletons.Newsletter />
    default:
      return <MIPageSkeletons.Dashboard />
  }
}

export default MISkeleton
