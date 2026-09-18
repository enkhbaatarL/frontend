import { Box, Typography } from '@mui/material'

type NextGenMIDisplayOrderBadgeProps = {
  value: number | string
  disabled?: boolean
  height?: string
  borderRadius?: string
  border?: string
  borderColor?: string
  compact?: boolean
}

const NextGenMIDisplayOrderBadge = ({
  value,
  disabled = false,
  height = '20px',
  borderRadius = '8px',
  border = '1px solid',
  borderColor,
  compact = false,
}: NextGenMIDisplayOrderBadgeProps) => (
  <Box
    component="span"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    minWidth={height}
    height={height}
    padding={compact ? '1px 2px' : '2px 4px'}
    border={border}
    borderColor={disabled ? 'contentText.Disabled' : borderColor || 'gray.70'}
    borderRadius={borderRadius}
    bgcolor="commonColor.White"
    boxSizing="border-box"
    color={disabled ? 'contentText.Disabled' : 'gray.70'}
    flexShrink={0}
    lineHeight={0}
    sx={{ verticalAlign: 'middle' }}
  >
    <Typography
      component="span"
      color="inherit"
      fontSize={compact ? '10px' : '12px'}
      fontWeight={500}
      lineHeight={compact ? 1.2 : 1.4}
      noWrap
    >
      {value}
    </Typography>
  </Box>
)

export default NextGenMIDisplayOrderBadge
