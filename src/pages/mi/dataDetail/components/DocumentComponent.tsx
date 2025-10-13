import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
import fileService, { IFileDownloadRequest } from '@/service/admin/file'
import { downloadFile } from '@/utils/file'
interface DocumentItemProps {
  fileNo: number
  fileName: string
  date: string
  extension: string
  isPdfViewable: boolean
  isDownloadable: boolean | undefined
  fileSize: number
}

interface DocumentComponentProps {
  data: DocumentItemProps[]
}

const DocumentItem = ({
  fileName,
  date,
  extension,
  isPdfViewable,
  isDownloadable,
  fileNo,
  fileSize,
  isLast,
}: DocumentItemProps & { isLast?: boolean }) => {
  const handleViewPdf = () => {
    window.open(
      `/pdf-viewer/${fileNo}`,
      '_blank',
      'width=1100,height=800,toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no',
    )
  }

  // 파일 다운로드 (1개)
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
    <>
      <Box gap={3} sx={{ width: '90%', padding: '12px 12px 0px 12px', overflow: 'hidden' }}>
        <Typography
          mt={0.5}
          color="gray.70"
          component="div"
          variant="fileName"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4,
            width: '100%',
            wordBreak: 'break-word',
            maxHeight: '2.8em', // 2줄 높이 제한 (lineHeight 1.4 * 2)
          }}
        >
          {fileName}
        </Typography>
        <Grid container wrap="nowrap" alignItems="center" gap={'4px'}>
          <Typography whiteSpace="nowrap" lineHeight={1.4} color="gray.60" variant="body3R12">
            {date}
          </Typography>
          <MILine length={7} borderRadius={1} thickness={1.1} direction="vertical" backgroundColor="gray.30" />
          <Typography lineHeight={1.4} color="gray.60" variant="body3R12">
            {extension}
          </Typography>
        </Grid>

        <Grid container wrap="nowrap" mt={1} mb={3.5} alignItems="center" gap={'6px'} justifyContent="flex-end">
          {isPdfViewable && (
            <MIButton color={'gray'} type={'outlined'} size={'h28'} onClick={handleViewPdf}>
              View
            </MIButton>
          )}
          <MIButton color={'gray'} type={'outlined'} size={'h28'} disabled={!isDownloadable} onClick={handleDownloadFile}>
            Download
          </MIButton>
        </Grid>
      </Box>
      {!isLast && <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />}
    </>
  )
}

const DocumentComponent = ({ data }: DocumentComponentProps) => {
  const [fileData, setFileData] = useState<IFileDownloadRequest[]>([])

  // 파일 다운로드 (여러개) , 파일이 1개일때는 압축없이 일반파일 다운로드되게 함
  const handleDownloadFiles = async () => {
    try {
      if (fileData.length === 1) {
        const file = fileData[0]
        const fileBlob = await fileService.downloadFile(file)
        downloadFile(fileBlob, file.fileNm)
      } else {
        const response = await fileService.downloadFiles('file', fileData)
        downloadFile(response, 'file.zip')
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (data.length > 0) {
      setFileData(data.map((item) => ({ fileNo: item.fileNo, fileNm: item.fileName, fileSize: item.fileSize })))
    }
  }, [data])

  return (
    <Grid
      gap={2.5}
      container
      direction="column"
      paddingX={3}
      paddingY={6}
      borderRadius={1}
      border={'1px solid'}
      borderColor={'gray.30'}
      sx={{ width: '100%', maxWidth: '286px' }}
    >
      <Typography paddingX={3} component="div" color="gray.70" variant="sidePanelTitle">
        Downloads
      </Typography>
      <Box sx={{ width: '100%', overflow: 'hidden', marginBottom: '4px' }}>
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
            isLast={index === data.length - 1}
          />
        ))}
      </Box>
      <MIButton
        width={'100%'}
        contentType={'text'}
        color={'gray2'}
        type={'outlined'}
        size={'h34'}
        onClick={handleDownloadFiles}
        disabled={!data.some((item) => item.isDownloadable)}
      >
        Download all
      </MIButton>
    </Grid>
  )
}

export default DocumentComponent
