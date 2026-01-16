import { Box, Stack, Typography } from '@mui/material'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo } from 'react'

interface MIDateDisplayProps {
  date?: Dayjs
  text?: string
  showTimezone?: boolean
  timezoneText?: string
  dateFormat?: string
}

const MIDateDisplay = ({
  date,
  text,
  showTimezone = false,
  timezoneText = 'UTC+9 (KST, Seoul)',
  dateFormat = 'MMMM D',
}: MIDateDisplayProps) => {
  const formattedDate = useMemo(() => (date ? date.format(dateFormat) : dayjs().format(dateFormat)), [date, dateFormat])

  return (
    <Box display={'flex'} alignItems={'center'} gap={'10px'} padding={'4px 8px'} width={'fit-content'} sx={{ userSelect: 'none' }}>
      <Box display={'flex'} alignItems={'flex-end'} gap={'10px'}>
        <Stack direction="row" alignItems="center" gap="8px">
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
          {text && (
            <Stack direction="row" alignItems="center" gap="6px">
              <Typography variant="body1R16" color="contentText.Subtext" fontSize="30px">
                ·
              </Typography>
              <Typography variant="body1R16" color="contentText.Subtext">
                {text}
              </Typography>
            </Stack>
          )}
        </Stack>
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
