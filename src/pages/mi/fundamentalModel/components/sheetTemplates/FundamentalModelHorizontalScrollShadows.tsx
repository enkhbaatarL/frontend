import { Box } from '@mui/material'

import type { getSheetScrollShadows } from '@/pages/mi/fundamentalModel/components/sheetTemplates/useSheetColumnPinning'

const FundamentalModelScrollShadow = ({
  side,
  columnIndex,
  offset,
  height,
  visible,
}: {
  side: 'left' | 'right'
  columnIndex: number
  offset: string
  height: number
  visible: boolean
}) => (
  <Box
    aria-hidden
    data-shadow-side={side}
    data-column-index={columnIndex}
    sx={{
      position: 'absolute',
      top: '0px',
      [side]: offset,
      width: '16px',
      height: `${height}px`,
      pointerEvents: 'none',
      zIndex: 6,
      background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))`,
      maskImage: 'linear-gradient(to bottom, transparent 0%, #000 20px, #000 calc(100% - 20px), transparent 100%)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 180ms ease',
      '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
    }}
  />
)

export const FundamentalModelColumnScrollShadows = ({
  columnIndex,
  height,
  offsets,
}: {
  columnIndex: number
  height: number
  offsets: ReturnType<typeof getSheetScrollShadows>
}) => (
  <>
    {(['left', 'right'] as const).map((side) => {
      const shadow = offsets[side].find((item) => item.columnIndex === columnIndex)
      return shadow ? (
        <FundamentalModelScrollShadow
          key={side}
          side={side}
          columnIndex={columnIndex}
          offset="100%"
          height={height}
          visible={shadow.visible}
        />
      ) : null
    })}
  </>
)

const FundamentalModelHorizontalScrollShadows = ({
  viewport,
  offsets,
}: {
  viewport: { width: number; height: number }
  offsets: ReturnType<typeof getSheetScrollShadows>
}) => (
  <Box
    aria-hidden
    position="absolute"
    top="0px"
    left="0px"
    width={`${viewport.width}px`}
    height={`${viewport.height}px`}
    sx={{ pointerEvents: 'none', zIndex: 6 }}
  >
    {offsets.right
      .filter(({ columnIndex }) => columnIndex === -1)
      .map(({ columnIndex, offset, visible }) => (
        <FundamentalModelScrollShadow
          key={columnIndex}
          side="right"
          columnIndex={columnIndex}
          offset={`${offset}px`}
          height={viewport.height}
          visible={visible}
        />
      ))}
  </Box>
)

export default FundamentalModelHorizontalScrollShadows
