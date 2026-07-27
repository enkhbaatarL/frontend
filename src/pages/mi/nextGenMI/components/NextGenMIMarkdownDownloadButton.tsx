import { Stack } from '@mui/material'
import { useCallback, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import FileDownloadIcon from '@/components/common/icons/FileDownloadIcon'
import useSnackbar from '@/hooks/useSnackbar'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import { downloadFile } from '@/utils/file'

interface NextGenMIMarkdownDownloadButtonProps {
  fileName: string
  getMarkdown: () => string | Promise<string>
  disabled?: boolean
}

const NextGenMIMarkdownDownloadButton = ({ fileName, getMarkdown, disabled = false }: NextGenMIMarkdownDownloadButtonProps) => {
  const { showSnackbar } = useSnackbar()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    if (disabled || isDownloading) return

    try {
      setIsDownloading(true)
      const markdown = await getMarkdown()
      downloadFile(`\uFEFF${markdown}`, fileName)
    } catch {
      showSnackbar('마크다운 다운로드에 실패했습니다.', { variant: 'error' })
    } finally {
      setIsDownloading(false)
    }
  }, [disabled, fileName, getMarkdown, isDownloading, showSnackbar])

  return (
    <NextGenMIFollowCursorTooltip title="Markdown 다운로드">
      <Stack component="span" display="inline-flex">
        <MIBaseButton
          variant="outlined"
          aria-label="Markdown 다운로드"
          disabled={disabled}
          isLoading={isDownloading}
          onClick={() => void handleDownload()}
          enableHoverBackground
          sx={{
            width: '36px',
            minWidth: '36px',
            height: '36px',
            padding: '8px',
            color: 'contentIcon.Enabled',
          }}
        >
          <FileDownloadIcon width={20} height={20} />
        </MIBaseButton>
      </Stack>
    </NextGenMIFollowCursorTooltip>
  )
}

export default NextGenMIMarkdownDownloadButton
