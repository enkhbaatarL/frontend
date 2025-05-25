import { Box, Grid2 as Grid, Typography } from '@mui/material'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
import fileService from '@/service/admin/file'
import { downloadFile } from '@/utils/file'

interface DocumentItemProps {
  fileNo: number
  fileName: string
  date: string
  extension: string
  isPdfViewable: boolean
  isDownloadable: boolean
  fileSize: number
}

interface DocumentComponentProps {
  data: DocumentItemProps[]
}

const DocumentItem = ({ fileName, date, extension, isPdfViewable, isDownloadable, fileNo, fileSize }: DocumentItemProps) => {
  const handleViewPdf = () => {
    window.open(
      `/pdf-viewer/${fileNo}`,
      '_blank',
      'width=1100,height=800,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no',
    )
  }

  // 파일 다운로드
  const handleDownloadFile = async () => {
    try {
      const fileBlob = await fileService.downloadFile({
        fileNo,
        fileNm: fileName,
        fileSize,
      })

      downloadFile(fileBlob, fileName)
    } catch (error) {
      console.error('파일 다운로드 중 오류가 발생했습니다:', error)
    }
  }

  return (
    <Box paddingY={3}>
      <Typography mb={1} color="gray.70" component="div" variant="fileName">
        {fileName}
      </Typography>
      <Grid container wrap="nowrap" alignItems="center" gap={'5px'}>
        <Typography whiteSpace="nowrap" lineHeight={1.6} color="gray.60" variant="body2">
          {date}
        </Typography>
        <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
        <Typography lineHeight={1.6} color="gray.60" variant="body2">
          {extension}
        </Typography>
        {isPdfViewable && (
          <MIButton contentType={'link'} color={'gray'} type={'ghost'} size={'h32'} onClick={handleViewPdf}>
            View
          </MIButton>
        )}
        <MIButton contentType={'link'} color={'gray'} type={'ghost'} size={'h32'} disabled={!isDownloadable} onClick={handleDownloadFile}>
          Download
        </MIButton>
      </Grid>
    </Box>
  )
}

const DocumentComponent = ({ data }: DocumentComponentProps) => (
  <Grid gap={2.5} container direction="column" p={6} borderRadius={1} border={'1px solid'} borderColor={'gray.30'}>
    <Typography component="div" color="gray.90" variant="titleBox">
      Document
    </Typography>
    <Box>
      {data?.map((item, index) => (
        <DocumentItem
          key={index}
          fileName={item.fileName}
          date={item.date}
          extension={item.extension}
          isPdfViewable={item.isPdfViewable}
          isDownloadable={item.isDownloadable}
          fileNo={item.fileNo}
          fileSize={item.fileSize}
        />
      ))}
    </Box>
    <MIButton width={'100%'} contentType={'text'} color={'gray2'} type={'outlined'} size={'h42'}>
      Download All
    </MIButton>
  </Grid>
)

export default DocumentComponent
