import { Stack, Typography } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'

export interface EventsTableEmptyOverlayProps {
  message: string
  description?: string
  onResetFilters?: () => void
}

/** Events 테이블 빈 목록(필터 결과 없음 등) */
const EventsTableEmptyOverlay = ({ message, description, onResetFilters }: EventsTableEmptyOverlayProps) => (
  <Stack alignItems="center" gap="10px">
    <ErrorOutlineIcon aria-hidden />
    <Typography
      variant="body3SB12"
      color="gray.60"
      lineHeight={1.4}
      textAlign="center"
      width="336px"
      maxWidth="100%"
      sx={{ wordBreak: 'break-word' }}
    >
      {message}
      {description && (
        <>
          <br />
          {description}
        </>
      )}
    </Typography>
    {onResetFilters && (
      <MIBaseButton
        variant="outlined"
        onClick={onResetFilters}
        labelColor="contentText.Normal"
        sx={{
          height: '36px',
          padding: '8px 10px',
          borderRadius: '8px',
          backgroundColor: 'commonColor.White',
        }}
      >
        필터 초기화
      </MIBaseButton>
    )}
  </Stack>
)

export default EventsTableEmptyOverlay
