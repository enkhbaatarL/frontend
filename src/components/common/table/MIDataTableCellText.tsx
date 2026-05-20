import { Typography, type TypographyProps } from '@mui/material'

import type { MouseEventHandler, ReactNode } from 'react'

import MIFollowCursorTooltip from '@/components/common/table/MIFollowCursorTooltip'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'

export const MI_DATA_TABLE_BODY_TEXT_VARIANT_DEFAULT = 'body1M16' as const
export const MI_DATA_TABLE_BODY_LINE_HEIGHT_DEFAULT = 1.4

const ellipsisTypographySx = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const

export interface MIDataTableCellTextProps extends Omit<TypographyProps, 'children'> {
  value: string
  tooltipWhenTruncated?: boolean
  tooltipTitle?: ReactNode
  onClick?: MouseEventHandler<HTMLElement>
}

const MIDataTableCellText = ({
  value,
  tooltipWhenTruncated = false,
  tooltipTitle,
  variant = MI_DATA_TABLE_BODY_TEXT_VARIANT_DEFAULT,
  color = 'contentText.Normal',
  sx,
  onClick,
  ...typographyProps
}: MIDataTableCellTextProps) => {
  const { ref, isEllipsis } = useEllipsisDetection(value)

  const mergedSx: TypographyProps['sx'] = [
    {
      width: '100%',
      minWidth: 0,
      lineHeight: MI_DATA_TABLE_BODY_LINE_HEIGHT_DEFAULT,
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

  return <MIFollowCursorTooltip title={label}>{typography}</MIFollowCursorTooltip>
}

export default MIDataTableCellText
