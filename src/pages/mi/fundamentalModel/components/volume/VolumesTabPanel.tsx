import { Stack } from '@mui/material'

import type { FundamentalModelMetricRow } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import FundamentalModelSegmentToolbar from '@/pages/mi/fundamentalModel/components/volume/FundamentalModelSegmentToolbar'
import FundamentalModelVolumesMatrix from '@/pages/mi/fundamentalModel/components/volume/FundamentalModelVolumesMatrix'

/** Volumes 탭에 필요한 표 데이터 */
export interface VolumesTabPanelProps {
  /** 월 컬럼 라벨 */
  monthLabels: string[]
  /** 요약 행 */
  summaryRows: FundamentalModelMetricRow[]
  /** 상세 행 */
  detailRows: FundamentalModelMetricRow[]
  /** 상세·표 로딩 */
  detailLoading: boolean
}

/** Volumes 탭 본문(툴바·매트릭스 — 레이아웃은 FundamentalModelPage) */
const VolumesTabPanel = ({ monthLabels, summaryRows, detailRows, detailLoading }: VolumesTabPanelProps) => (
  <Stack sx={{ gap: '16px' }}>
    <FundamentalModelSegmentToolbar loading={detailLoading} />
    <Stack gap="10px">
      <FundamentalModelVolumesMatrix monthLabels={monthLabels} rows={summaryRows} loading={detailLoading} compact />
      <FundamentalModelVolumesMatrix monthLabels={monthLabels} rows={detailRows} loading={detailLoading} />
    </Stack>
  </Stack>
)

export default VolumesTabPanel
