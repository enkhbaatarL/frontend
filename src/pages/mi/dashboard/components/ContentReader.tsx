import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { Box } from '@mui/material'

const ContentReader = () => (
  <Box
    width={36}
    height={36}
    boxSizing="border-box"
    display="flex"
    alignItems="center"
    justifyContent="center"
    color="gray.70"
    sx={{
      borderRadius: '10px',
      border: '1px solid #DEE2E6',
      padding: '8px',
    }}
  >
    <PlayArrowIcon fontSize="small" />
  </Box>
)

export default ContentReader
