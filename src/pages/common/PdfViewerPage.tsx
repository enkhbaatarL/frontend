import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import PdfViewer from '@/components/common/pdfviewer/PdfViewer'
import pdfService from '@/service/common/pdf'

const PdfViewerPage = () => {
  const { fileId } = useParams()
  const navigate = useNavigate()

  if (!fileId) {
    navigate('/error/404')
  }

  const { data, isError, isLoading } = useQuery({
    queryKey: ['getPdfMetadata', fileId],
    queryFn: async () => await pdfService.getPdfMetadata(Number(fileId)),
    refetchOnWindowFocus: false,
    enabled: !!fileId,
  })

  useEffect(() => {
    if (isError) {
      navigate('/error', {
        state: {
          code: 401,
          status: 'An unknown error has occurred. Please try again later.',
          hiddenButton: true,
        },
        replace: true,
      })
    }
  }, [isError, navigate])

  return data?.isImageConversionCompleted ? (
    <PdfViewer metadata={data} />
  ) : (
    <Box width="100%" height="100%" display="flex" justifyContent="center" alignItems="center" sx={{ bgcolor: 'gray.90' }}>
      {!isLoading && (
        <MIConfirm
          open
          title={t('PDF 변환 처리 중입니다.')}
          handleClose={() => {}}
          actions={[
            {
              label: t('확인'),
              variant: 'filled',
              color: 'primary',
              onClick: () => {
                window.close()
              },
            },
          ]}
        />
      )}
    </Box>
  )
}

export default PdfViewerPage
