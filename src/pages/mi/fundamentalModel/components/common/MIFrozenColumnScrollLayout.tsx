import { Box, type BoxProps } from '@mui/material'
import { useCallback, useRef, type ReactNode, type Ref } from 'react'

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
  /** 가로 스크롤 컨테이너 ref(헤더-본문 동기화용) */
  horizontalScrollRef?: Ref<HTMLDivElement>
  /** 세로 휠을 가로 스크롤로 변환 */
  enableWheelToHorizontal?: boolean
}

/**
 * Volumes Table 레이아웃: 고정열 + 월 columns group.
 * 고정열은 스크롤 컨테이너 밖에 두고, 월 컬럼만 가로 스크롤한다.
 */
const MIFrozenColumnScrollLayout = ({
  frozen,
  scrollable,
  rootProps,
  scrollBoxProps,
  horizontalScrollRef,
  enableWheelToHorizontal = false,
}: MIFrozenColumnScrollLayoutProps) => {
  const internalScrollRef = useRef<HTMLDivElement>(null)
  const { sx: rootSx, ...restRootProps } = rootProps ?? {}
  const { sx: scrollSx, ref: scrollBoxRef, onScroll: onScrollBox, ...restScrollBoxProps } = scrollBoxProps ?? {}

  const setScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalScrollRef.current = node
      if (typeof horizontalScrollRef === 'function') {
        horizontalScrollRef(node)
      } else if (horizontalScrollRef && 'current' in horizontalScrollRef) {
        horizontalScrollRef.current = node
      }
      if (typeof scrollBoxRef === 'function') {
        scrollBoxRef(node)
      } else if (scrollBoxRef && 'current' in scrollBoxRef) {
        scrollBoxRef.current = node
      }
    },
    [horizontalScrollRef, scrollBoxRef],
  )

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!enableWheelToHorizontal) return
      const el = internalScrollRef.current
      if (!el || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      if (el.scrollWidth <= el.clientWidth) return
      el.scrollLeft += event.deltaY
      event.preventDefault()
    },
    [enableWheelToHorizontal],
  )

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
          ref={setScrollRef}
          onWheel={handleWheel}
          onScroll={onScrollBox}
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
