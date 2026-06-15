import { Box } from '@mui/material'
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeRaw from 'rehype-raw'

import style from '@/components/common/markdown/MIMarkdown.module.scss'
import { markdownRemarkPlugins } from '@/utils/markdown'

interface MIMarkdownProps {
  children?: string | null
}

const markdownComponents: Components = {
  table: ({ children, node: _node, ...props }) => (
    <Box margin="16px 0" sx={{ overflowX: 'auto' }}>
      <Box borderRadius="6px" overflow="hidden" border="1px solid" borderColor="contentBorder.Normal" minWidth="640px">
        <Box component="table" {...props}>
          {children}
        </Box>
      </Box>
    </Box>
  ),
}

const MIMarkdown = ({ children }: Readonly<MIMarkdownProps>) => (
  <Box className={style.markdownContent}>
    <ReactMarkdown components={markdownComponents} remarkPlugins={markdownRemarkPlugins} rehypePlugins={[rehypeRaw]}>
      {children ?? ''}
    </ReactMarkdown>
  </Box>
)

export default MIMarkdown
