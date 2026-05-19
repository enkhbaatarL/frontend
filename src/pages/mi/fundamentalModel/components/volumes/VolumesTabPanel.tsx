import { Stack } from '@mui/material'
import { useState } from 'react'

import type {
  FundamentalModelGlobalVolumesData,
  FundamentalModelMetricRow,
  FundamentalModelScopeKey,
} from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import FundamentalModelGlobalVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelGlobalVolumesTable'
import FundamentalModelSegmentToolbar from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSegmentToolbar'
import FundamentalModelVolumesMatrix from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelVolumesMatrix'

/** Volumes 탭에 필요한 표 데이터 */
export interface VolumesTabPanelProps {
  /** 월 컬럼 라벨(요약 표) */
  monthLabels: string[]
  /** 요약 행 */
  summaryRows: FundamentalModelMetricRow[]
  /** LNG/Trade 상세 행 */
  detailRows: FundamentalModelMetricRow[]
  /** Global 본문 표 */
  globalVolumes: FundamentalModelGlobalVolumesData
  /** 상세·표 로딩 */
  detailLoading: boolean
}

/** Volumes 탭 본문(툴바·매트릭스 — 레이아웃은 FundamentalModelPage) */
const VolumesTabPanel = ({ monthLabels, summaryRows, detailRows, globalVolumes, detailLoading }: VolumesTabPanelProps) => {
  const [scope, setScope] = useState<FundamentalModelScopeKey>('global')

  return (
    <Stack sx={{ gap: '16px' }}>
      <FundamentalModelSegmentToolbar loading={detailLoading} scope={scope} onScopeChange={setScope} />

      {scope === 'global' ? (
        <Stack gap="10px">
          <FundamentalModelVolumesMatrix monthLabels={monthLabels} rows={summaryRows} loading={detailLoading} compact />
          <FundamentalModelGlobalVolumesTable data={globalVolumes} loading={detailLoading} />
        </Stack>
      ) : (
        <Stack gap="10px">
          <FundamentalModelVolumesMatrix monthLabels={monthLabels} rows={summaryRows} loading={detailLoading} compact />
          <FundamentalModelVolumesMatrix monthLabels={monthLabels} rows={detailRows} loading={detailLoading} />
        </Stack>
      )}
    </Stack>
  )
}

export default VolumesTabPanel
