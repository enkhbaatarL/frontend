import { Box, Typography } from '@mui/material'
type Props = {
  content: string
}
const MIAgentMessagePrompt = ({ content }: Props) => (
  <Box p={3} display={'flex'} justifyContent={'end'}>
    <Box maxWidth={470} borderRadius={'30px'} px={4} py={1} border={'1px solid'} borderColor={'gray.30'}>
      <Typography py={2} display={'inline-block'} variant={'body1R16'} color={'gray.90'}>
        {content}
      </Typography>
    </Box>
  </Box>
)

export default MIAgentMessagePrompt
