import { Stack, Typography } from '@mui/material'
import { type ReactNode } from 'react'

const ScenarioDesignStatusBadge = ({ label }: { label: ReactNode }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    minWidth="42px"
    height="20px"
    padding="0px 4px"
    border="1px solid"
    borderColor="contentBorder.Normal"
    borderRadius="4px"
    boxSizing="border-box"
    flexShrink={0}
  >
    <Typography variant="body3SB12" color="contentText.Normal" lineHeight={1.4} noWrap>
      {label}
    </Typography>
  </Stack>
)

export default ScenarioDesignStatusBadge
