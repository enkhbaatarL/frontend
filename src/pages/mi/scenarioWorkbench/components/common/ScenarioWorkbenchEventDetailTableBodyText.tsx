import { Tooltip, Typography, type TypographyProps } from '@mui/material'

import type { ReactNode } from 'react'

import useEllipsisDetection from '@/hooks/useEllipsisDetection'

export const SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX = 12
export const SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY = 8
export const SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY = 10

export const SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_LABEL_COLOR = 'contentText.Normal' as TypographyProps['color']

export const SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT = 'body2M14' as const
export const SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT = 1.4

const ellipsisTypographySx = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const

export interface ScenarioWorkbenchEventDetailTableBodyTextProps extends Omit<TypographyProps, 'children'> {
  value: string
  tooltipWhenTruncated?: boolean
  tooltipTitle?: ReactNode
}

const ScenarioWorkbenchEventDetailTableBodyText = ({
  value,
  tooltipWhenTruncated = false,
  tooltipTitle,
  variant = SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  color = 'contentText.Normal',
  sx,
  ...typographyProps
}: ScenarioWorkbenchEventDetailTableBodyTextProps) => {
  const { ref, isEllipsis } = useEllipsisDetection(value)

  const mergedSx: TypographyProps['sx'] = [
    {
      width: '100%',
      minWidth: 0,
      lineHeight: SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
      ...ellipsisTypographySx,
    },
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
    >
      {value}
    </Typography>
  )

  if (!tooltipWhenTruncated) return typography

  return (
    <Tooltip disableHoverListener={!isEllipsis} title={label} placement="top" followCursor>
      {typography}
    </Tooltip>
  )
}

export default ScenarioWorkbenchEventDetailTableBodyText
