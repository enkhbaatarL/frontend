import { Box, CircularProgress } from '@mui/material'
import { lazy, Suspense } from 'react'

const PositionPlayRemote = lazy(() => import('positionPlayRemote/PositionPlayPage'))

const RemoteLoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" width="100%">
    <CircularProgress />
  </Box>
)

/**
 * Host 전용 셸 페이지. MILayout(헤더·푸터) 아래 Outlet 영역에서
 * Module Federation Remote(Position Play)를 로드합니다.
 */
const PositionPlayRemotePage = () => (
  <Box sx={{ width: '100%', minHeight: '100%', boxSizing: 'border-box' }}>
    <Suspense fallback={<RemoteLoadingFallback />}>
      <PositionPlayRemote />
    </Suspense>
  </Box>
)

export default PositionPlayRemotePage
