import { Box, CircularProgress } from '@mui/material'
import { lazy, Suspense, useEffect } from 'react'

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
const PositionPlayRemotePage = () => {
  /** Remote CssBaseline 등이 body 배경을 남기는 경우 Host 레이아웃 복구 */
  useEffect(
    () => () => {
      document.body.style.removeProperty('background-color')
      document.body.style.removeProperty('background')
    },
    [],
  )

  return (
    <Box sx={{ width: '100%', minHeight: '100%', boxSizing: 'border-box' }}>
      <Suspense fallback={<RemoteLoadingFallback />}>
        <PositionPlayRemote />
      </Suspense>
    </Box>
  )
}

export default PositionPlayRemotePage
