import { useQuery } from '@tanstack/react-query'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import PdfViewer from '@/components/common/pdfviewer/PdfViewer'
import pdfService from '@/service/common/pdf'

const PdfViewerPage = () => {
  const { fileId } = useParams()
  const navigate = useNavigate()

  if (!fileId) {
    navigate('/error/404')
  }

  const { data, isError } = useQuery({
    queryKey: ['getPdfMetadata', fileId],
    queryFn: async () => await pdfService.getPdfMetadata(Number(fileId)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!fileId,
  })

  return isError ? <Navigate to={'/error/404'} replace={true} /> : data?.isImageConversionCompleted && <PdfViewer metadata={data} />
}

export default PdfViewerPage
