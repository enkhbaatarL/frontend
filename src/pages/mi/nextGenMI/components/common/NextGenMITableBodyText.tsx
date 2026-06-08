import { Typography, type TypographyProps } from '@mui/material'

import type { MouseEventHandler, ReactNode } from 'react'

import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'

export const NEXT_GEN_MI_TABLE_CELL_PX = 6
export const NEXT_GEN_MI_TABLE_HEADER_CELL_PY = 10
export const NEXT_GEN_MI_TABLE_BODY_CELL_PY = 10
export const NEXT_GEN_MI_TABLE_CONTAINER_PADDING = 12

export const NEXT_GEN_MI_TABLE_HEADER_LABEL_COLOR = 'contentText.Normal' as TypographyProps['color']

export const NEXT_GEN_MI_TABLE_BODY_TEXT_VARIANT = 'body2M14' as const
export const NEXT_GEN_MI_TABLE_BODY_LINE_HEIGHT = 1.4

const ellipsisTypographySx = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const

export interface NextGenMITableBodyTextProps extends Omit<TypographyProps, 'children'> {
  value: string
  tooltipWhenTruncated?: boolean
  tooltipTitle?: ReactNode
  onClick?: MouseEventHandler<HTMLElement>
}

const NextGenMITableBodyText = ({
  value,
  tooltipWhenTruncated = false,
  tooltipTitle,
  variant = NEXT_GEN_MI_TABLE_BODY_TEXT_VARIANT,
  color = 'contentText.Normal',
  sx,
  onClick,
  ...typographyProps
}: NextGenMITableBodyTextProps) => {
  const { ref, isEllipsis } = useEllipsisDetection(value)

  const mergedSx: TypographyProps['sx'] = [
    {
      width: '100%',
      minWidth: 0,
      lineHeight: NEXT_GEN_MI_TABLE_BODY_LINE_HEIGHT,
      ...ellipsisTypographySx,
    },
    ...(onClick
      ? [
        {
          cursor: 'pointer',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            textUnderlineOffset: '3px',
          },
        },
      ]
      : []),
    ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
  ]

  const label = tooltipTitle ?? value

  const typography = (
    <Typography
      ref={ref}
      {...typographyProps}
      component={typographyProps.component ?? 'div'}
      variant={variant}
      color={color}
      title={tooltipWhenTruncated ? undefined : value}
      sx={mergedSx}
      onClick={onClick}
    >
      {value}
    </Typography>
  )

  if (!tooltipWhenTruncated) return typography

  if (!isEllipsis) return typography

  return <NextGenMIFollowCursorTooltip title={label}>{typography}</NextGenMIFollowCursorTooltip>
}

export default NextGenMITableBodyText
