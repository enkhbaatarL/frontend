import { Box, Grid2 as Grid } from '@mui/material'

import MIMarkdown from '@/components/common/markdown/MIMarkdown'

interface Props {
  description?: string
  summary?: string
}

const DescriptionComponent = ({ description, summary }: Props) => (
  <Box>
    {summary && (
      <Box mb={9.5}>
        <MIMarkdown>{summary}</MIMarkdown>
      </Box>
    )}
    {description && (
      <Grid container direction="column" gap={2}>
        <MIMarkdown>{description}</MIMarkdown>
      </Grid>
    )}
  </Box>
)

export default DescriptionComponent
