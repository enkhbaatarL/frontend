import { Box, Skeleton, Stack } from '@mui/material'

import type { Theme } from '@mui/material/styles'
import type { SystemStyleObject } from '@mui/system'

const pageSkeletonFrameSx: SystemStyleObject<Theme> = {
  flex: 1,
  width: '100%',
  alignSelf: 'stretch',
  minHeight: 480,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: '24px',
  py: '40px',
  boxSizing: 'border-box',
}

/** 케이스 상세 / Volumes API 로딩 시 공통 페이지형 스켈레톤 (원 + 가로 바 2개) */
const FundamentalModelPageSkeleton = () => (
  <Box sx={pageSkeletonFrameSx}>
    <Stack alignItems="center" gap="12px" sx={{ width: '100%', maxWidth: 360 }}>
      <Skeleton variant="circular" width={64} height={64} />
      <Skeleton variant="rounded" width="70%" height={28} />
      <Skeleton variant="rounded" width="52%" height={18} />
    </Stack>
  </Box>
)

export default FundamentalModelPageSkeleton
