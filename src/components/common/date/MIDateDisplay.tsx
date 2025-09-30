import { Box, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useMemo } from 'react'

interface MIDateDisplayProps {
  date?: Date | string | dayjs.Dayjs
  showTimezone?: boolean
  timezoneText?: string
  dateFormat?: string
}

const MIDateDisplay = ({ date, showTimezone = false, timezoneText = 'UTC+9 (KST, Seoul)', dateFormat = 'MMMM D' }: MIDateDisplayProps) => {
  const formattedDate = useMemo(() => {
    const targetDate = date ? dayjs(date) : dayjs()
    return targetDate.format(dateFormat)
  }, [date, dateFormat])

  return (
    <Box display={'flex'} alignItems={'center'} gap={'10px'} padding={'4px 8px'} width={'fit-content'}>
      <Box display={'flex'} alignItems={'flex-end'} gap={'10px'}>
        <Typography
          variant="body1"
          sx={{
            fontSize: '30px',
            lineHeight: '1em',
            color: '#000000',
          }}
        >
          {formattedDate}
        </Typography>

        {showTimezone && (
          <Typography
            variant="body2M14"
            sx={{
              lineHeight: '1em',
              color: '#868E96',
            }}
          >
            {timezoneText}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default MIDateDisplay
