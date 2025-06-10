import { Box, Typography } from '@mui/material'
type Props = {
  content: string
}
const MIAgentMessagePrompt = ({ content }: Props) => (
  <Box p={3} display={'flex'} justifyContent={'end'}>
    <Box
      borderRadius={'23px'}
      px={4}
      py={2}
      mb={3}
      border={'1px solid'}
      borderColor={'gray.30'}
      bgcolor={'white'}
      whiteSpace={'pre-wrap'}
      sx={{ maxWidth: '78%' }}
    >
      <Typography py={'6px'} display={'inline-block'} variant={'body1R16'} color={'gray.90'}>
        {content}
      </Typography>
    </Box>
  </Box>
)

export default MIAgentMessagePrompt
