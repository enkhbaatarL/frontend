import { Box, SxProps, Theme, Tooltip, Typography, TypographyProps } from '@mui/material'
import { Instance } from '@popperjs/core'
import { PropsWithChildren, useRef, MouseEvent, ReactNode } from 'react'

import useEllipsisDetection from '@/hooks/useEllipsisDetection'

export interface MITableCellProps extends PropsWithChildren {
  disabled?: boolean
  typography?: TypographyProps
  tooltip?: boolean
  tooltipContent?: ReactNode
  onClick?: () => void
  value?: string | number
  cursorPointer?: boolean
  sx?: SxProps<Theme>
}
export default function MITableCell(props: Readonly<MITableCellProps>) {
  const { tooltip = false, tooltipContent, value, onClick, typography, children, cursorPointer, sx } = props
  const { ref, isEllipsis } = useEllipsisDetection()
  const positionRef = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const popperRef = useRef<Instance>(null)
  const handleMouseMove = (event: MouseEvent) => {
    positionRef.current = { x: event.clientX, y: event.clientY }

    if (popperRef.current !== null) {
      popperRef.current.update()
    }
  }
  const { sx: typoStyle, ...typoProps } = typography ?? {}

  return (
    <Tooltip
      disableHoverListener={!isEllipsis && !tooltip}
      title={tooltipContent}
      slotProps={{
        popper: {
          popperRef,
          anchorEl: {
            getBoundingClientRect: () => new DOMRect(positionRef.current.x, ref.current!.getBoundingClientRect().y + 40, 0, 0),
          },
        },
      }}
    >
      {children ? (
        <Box sx={{ ...sx }} ref={ref} onMouseMove={handleMouseMove} padding={'10px 12px'}>
          {children}
        </Box>
      ) : (
        <Typography
          ref={ref}
          component="div"
          onMouseMove={handleMouseMove}
          variant="tableBody2"
          color="gray.90"
          onClick={onClick}
          sx={{
            cursor: cursorPointer || onClick ? 'pointer' : 'default',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '10px 12px',
            width: '100%',
            ...typoStyle,
          }}
          {...typoProps}
        >
          {value}
        </Typography>
      )}
    </Tooltip>
  )
}
