import { Stack, Typography } from '@mui/material'

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'

const OverviewTabPanel = () => (
  <Stack gap={2} sx={{ px: 3, py: 2 }}>
    {Array.from({ length: 24 }, (_, i) => (
      <Typography key={i} variant="body2" color="contentText.Black" paragraph sx={{ mb: 0 }}>
        {LOREM}
      </Typography>
    ))}
  </Stack>
)

export default OverviewTabPanel
