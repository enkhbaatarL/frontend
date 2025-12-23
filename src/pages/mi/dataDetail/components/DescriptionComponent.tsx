import { Box, Grid2 as Grid, Typography } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

interface Props {
  description?: string
  summary?: string
}

const DescriptionComponent = ({ description, summary }: Props) => (
  <Box>
    {summary && (
      <Typography mb={9.5} component="div" lineHeight={1.6} color="gray.90" variant="body1M16" sx={{ whiteSpace: 'pre-line' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {summary}
        </ReactMarkdown>
      </Typography>
    )}
    {description && (
      <Grid container direction="column" gap={2}>
        <Typography component="div" lineHeight={1.6} color="gray.70" variant="body1R16" sx={{ whiteSpace: 'pre-line' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {description}
          </ReactMarkdown>
        </Typography>
      </Grid>
    )}
  </Box>
)

export default DescriptionComponent
