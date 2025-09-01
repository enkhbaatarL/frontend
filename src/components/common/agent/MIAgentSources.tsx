import { Grid2 as Grid, Typography } from '@mui/material'

import MIChip from '@/components/common/chip/MIChip'
import { IChatQnaAnswerBundle } from '@/service/mi/agent'

type Props = {
  sources?: IChatQnaAnswerBundle['sources']
}
const MIAgentAnswerTool = ({ sources }: Props) => (
  <Grid px={1.5} paddingBottom={1.5} pt={6} container gap={'10px'} alignItems={'center'}>
    <Typography color={'gray.70'} variant={'mariDescription'}>
      출처
    </Typography>
    <Grid container gap={1.5} alignItems={'center'}>
      {sources?.map((source, index) => (
        <MIChip
          key={index}
          size={'h22'}
          color={'gray'}
          type={'mari'}
          label={source.sourceNm}
          sx={{
            cursor: 'pointer',
          }}
          onClick={() => {
            window.open(source.url, '_blank')
          }}
        />
      ))}
    </Grid>
  </Grid>
)

export default MIAgentAnswerTool
