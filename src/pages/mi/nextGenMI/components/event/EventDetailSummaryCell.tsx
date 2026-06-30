import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'

interface EventDetailSummaryCellProps {
  value?: string | null
}

const EventDetailSummaryCell = ({ value }: EventDetailSummaryCellProps) => {
  if (!value) return null

  return <NextGenMITableBodyText value={value} color="contentText.Black" lineClamp={3} noWrap={false} />
}

export default EventDetailSummaryCell
