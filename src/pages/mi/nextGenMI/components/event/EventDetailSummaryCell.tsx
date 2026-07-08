import { SxProps, Theme } from '@mui/material'

import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'

interface EventDetailSummaryCellProps {
  value?: string | null
  sx?: SxProps<Theme>
}

const EventDetailSummaryCell = ({ value, sx }: EventDetailSummaryCellProps) => {
  if (!value) return null

  return <NextGenMITableBodyText value={value} color="contentText.Black" lineClamp={3} noWrap={false} sx={sx} />
}

export default EventDetailSummaryCell
