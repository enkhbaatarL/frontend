import { Box, type BoxProps } from '@mui/material'
import { useCallback, useRef, type ReactNode } from 'react'

import { mergeVolumeTableSx, miThinScrollbarSx } from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumesTableLayout'

export interface MIFrozenColumnScrollLayoutProps {
  /** 고정열(스크롤 밖) */
  frozen: ReactNode
  /** 가로 스크롤되는 월 컬럼 영역 */
  scrollable: ReactNode
  /** 루트 Box props */
  rootProps?: BoxProps
  /** 스크롤 영역 Box props */
  scrollBoxProps?: BoxProps
}

/**
 * Volumes Table 레이아웃: 고정열 + 월 columns group.
 * 고정열은 스크롤 컨테이너 밖에 두고, 월 컬럼만 가로 스크롤한다.
 */
const MIFrozenColumnScrollLayout = ({ frozen, scrollable, rootProps, scrollBoxProps }: MIFrozenColumnScrollLayoutProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { sx: rootSx, ...restRootProps } = rootProps ?? {}
  const { sx: scrollSx, ...restScrollBoxProps } = scrollBoxProps ?? {}

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    if (!el || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
    if (el.scrollWidth <= el.clientWidth) return
    el.scrollLeft += event.deltaY
    event.preventDefault()
  }, [])

  return (
    <Box
      sx={mergeVolumeTableSx(
        {
          display: 'flex',
          alignItems: 'flex-start',
          width: '100%',
          minWidth: 0,
        },
        rootSx,
      )}
      {...restRootProps}
    >
      <Box sx={{ flexShrink: 0 }}>{frozen}</Box>

      <Box
        sx={{
          flex: '1 1 0',
          minWidth: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          ref={scrollRef}
          onWheel={handleWheel}
          sx={mergeVolumeTableSx(
            {
              width: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
            },
            miThinScrollbarSx,
            scrollSx,
          )}
          {...restScrollBoxProps}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', width: 'max-content' }}>{scrollable}</Box>
        </Box>
      </Box>
    </Box>
  )
}

export default MIFrozenColumnScrollLayout
