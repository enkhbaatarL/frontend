import { Box, Typography } from '@mui/material'

interface UserRegisteredEventBadgeProps {
  /** 상세 제목 옆은 알약형, 목록은 작은 테두리 배지 */
  size?: 'compact' | 'header'
}

/** 사용자가 직접 등록한 이벤트 표기 */
const UserRegisteredEventBadge = ({ size = 'compact' }: UserRegisteredEventBadgeProps) => {
  const isHeader = size === 'header'

  return (
    <Box
      component="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      height={isHeader ? '28px' : '22px'}
      px="8px"
      border="1px solid"
      borderColor="contentBorder.Normal"
      borderRadius={isHeader ? '50px' : '10px'}
      bgcolor="commonColor.White"
      boxSizing="border-box"
    >
      <Typography
        component="span"
        variant={isHeader ? 'body2SB14' : 'body3SB12'}
        color="contentText.Subtext"
        lineHeight={1.4}
        sx={{ userSelect: 'none' }}
        noWrap
      >
        사용자 등록
      </Typography>
    </Box>
  )
}

export default UserRegisteredEventBadge
