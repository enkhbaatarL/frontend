import { Box, Typography } from '@mui/material'
import clsx from 'clsx'

import style from '@/components/common/agent/MIAgentAnswer.module.scss'

type Props = {
  content: string
  isPending?: boolean
}
const MIAgentMessagePrompt = ({ content, isPending = false }: Props) => (
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
      sx={{
        maxWidth: '78%',
        overflow: 'hidden',
        wordBreak: 'break-word',
      }}
    >
      <Typography
        py={'6px'}
        display={'inline-block'}
        variant={'body1R16'}
        color={'gray.90'}
        className={clsx(isPending && style.pendingQuestionText)}
        sx={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {content}
      </Typography>
    </Box>
  </Box>
)

export default MIAgentMessagePrompt
