import { Stack, type StackProps, type SxProps, type Theme } from '@mui/material'

import {
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING,
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'

const toSxArray = (sx?: SxProps<Theme>) => (Array.isArray(sx) ? sx : sx ? [sx] : [])

interface NextGenMIDetailStickySectionHeaderProps extends StackProps {
  stickyTopPx?: number
  stickyZIndex?: number
  coverGapPx?: number
  coverBelowPx?: number
}

const NextGenMIDetailStickySectionHeader = ({
  stickyTopPx,
  stickyZIndex = 30,
  coverGapPx = 20,
  coverBelowPx = 0,
  sx,
  children,
  ...props
}: NextGenMIDetailStickySectionHeaderProps) => (
  <Stack
    {...props}
    sx={[
      stickyTopPx !== undefined
        ? {
          position: 'sticky',
          top: `${stickyTopPx}px`,
          zIndex: stickyZIndex,
          bgcolor: 'commonColor.White',
          clipPath: `inset(-${coverGapPx}px 0 -${coverBelowPx}px 0)`,
          transition: `top ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS}ms ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            top: `-${coverGapPx}px`,
            height: `${coverGapPx}px`,
            bgcolor: 'commonColor.White',
            pointerEvents: 'none',
          },
          ...(coverBelowPx > 0
            ? {
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                top: '100%',
                height: `${coverBelowPx}px`,
                bgcolor: 'commonColor.White',
                pointerEvents: 'none',
              },
            }
            : {}),
        }
        : {},
      ...toSxArray(sx),
    ]}
  >
    {children}
  </Stack>
)

export default NextGenMIDetailStickySectionHeader
