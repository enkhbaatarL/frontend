import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box } from '@mui/material'
import { type MouseEvent, type ReactNode } from 'react'

import MIFollowCursorTooltip from '@/components/common/table/MIFollowCursorTooltip'

/** 분기 항목/기준값 인포 아이콘 + 호버 툴팁 */
const ScenarioDesignInfoTooltipIcon = ({
  title,
  size = '16px',
  color = 'contentIcon.Enabled',
}: {
  title: ReactNode
  size?: string
  color?: string
}) => {
  const trimmed = typeof title === 'string' ? title.trim() : title
  if (!trimmed) return null

  return (
    <MIFollowCursorTooltip title={trimmed}>
      <Box
        component="span"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        width={size}
        height={size}
        flexShrink={0}
        lineHeight={0}
        color={color}
        onClick={(event: MouseEvent) => {
          event.stopPropagation()
          event.preventDefault()
        }}
        onMouseDown={(event: MouseEvent) => {
          event.stopPropagation()
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: size, color: 'inherit', display: 'block' }} />
      </Box>
    </MIFollowCursorTooltip>
  )
}

export default ScenarioDesignInfoTooltipIcon
