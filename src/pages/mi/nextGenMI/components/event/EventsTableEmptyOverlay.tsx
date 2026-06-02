import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { Stack, Typography } from '@mui/material'

export interface EventsTableEmptyOverlayProps {
  message: string
}

/** Events 테이블 빈 목록(필터 결과 없음 등) */
const EventsTableEmptyOverlay = ({ message }: EventsTableEmptyOverlayProps) => (
  <Stack alignItems="center" gap="10px">
    <ErrorOutlineRoundedIcon sx={{ fontSize: 24, color: 'gray.60' }} />
    <Typography variant="body6" color="gray.60">
      {message}
    </Typography>
  </Stack>
)

export default EventsTableEmptyOverlay
