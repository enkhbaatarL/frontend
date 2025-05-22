import { Box, Grid2 as Grid, Typography } from '@mui/material'

interface Props {
  description?: string
  summary?: string
}

const DescriptionComponent = ({ description, summary }: Props) => (
  <Box>
    {description && (
      <Typography mb={9.5} component="div" lineHeight={1.6} color="gray.90" variant="body1M16">
        {description}
      </Typography>
    )}
    {summary && (
      <Grid container direction="column" gap={2}>
        <Typography component="div" lineHeight={1.6} color="gray.70" variant="body1R16" sx={{ whiteSpace: 'pre-line' }}>
          {summary}
        </Typography>
      </Grid>
    )}
  </Box>
)

export default DescriptionComponent
