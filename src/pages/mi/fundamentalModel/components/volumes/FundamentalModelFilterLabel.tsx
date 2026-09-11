import { Stack, Typography } from '@mui/material'

import type { ReactNode } from 'react'

interface FundamentalModelFilterLabelProps {
  children: ReactNode
  selectedCount: number
  optionCount: number
}

const FundamentalModelFilterLabel = ({ children, selectedCount, optionCount }: FundamentalModelFilterLabelProps) => (
  <Stack direction="row" alignItems="center" gap="6px">
    <Typography variant="body2SB14">{children}</Typography>
    {selectedCount !== optionCount && (
      <Stack justifyContent="center" alignItems="center" minWidth="20px" height="20px" borderRadius="100px" bgcolor="commonColor.Primary">
        <Typography px="5px" variant="body2SB14" color="commonColor.White" textAlign="center">
          {selectedCount}
        </Typography>
      </Stack>
    )}
  </Stack>
)

export default FundamentalModelFilterLabel
