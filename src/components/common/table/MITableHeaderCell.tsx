import { Box, Typography, TypographyProps } from '@mui/material'

export default function MITableHeaderCell(props: TypographyProps & { rowHeight?: number }) {
  const { children, rowHeight = 36, ...originProps } = props

  return (
    <Box py={2} px={1} lineHeight={`${rowHeight}px`}>
      <Typography variant="tableHeaderSemibold" color="gray.60" {...originProps}>
        {children}
      </Typography>
    </Box>
  )
}
