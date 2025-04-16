import ErrorIcon from '@mui/icons-material/Error'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminFaqForm from '@/components/admin/AdminFaqForm'
import AdminLoading from '@/components/admin/AdminLoading'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import boardService from '@/service/admin/board'

const AdminBoardsFaqDetailPageHeader = ({ onDelete, onEdit }: { onDelete: () => void; onEdit: () => void }) => (
  <Flex gap={10}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={onDelete}>
      {t('삭제')}
    </AdminButton>
    <AdminButton color="primary" variant="contained" size="h34" onClick={onEdit}>
      {t('수정')}
    </AdminButton>
  </Flex>
)

const AdminBoardsFaqDetailPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const { faqNo } = useParams()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data, isError, isLoading } = useQuery({
    queryKey: ['faqDetail', faqNo],
    queryFn: async () => await boardService.geFaqDetail(faqNo),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!faqNo,
  })

  const handleDeleteFaq = useCallback(async () => {
    if (!faqNo) return

    try {
      const response = await boardService.deleteFaq(faqNo)

      if (response.status) {
        showSnackbar(t('게시글이 삭제되었습니다.'), { variant: 'success' })
        navigate('/admin/boards/faq', { replace: true })
      }
    } catch (error) {
      console.error(error)
      showSnackbar(t('게시글 삭제에 실패했습니다.'), { variant: 'error' })
    }
  }, [faqNo, navigate, showSnackbar])

  const faqData = useMemo(
    () => ({
      bulletinCategorySeparateCd: data?.bulletinCategorySeparateCd ?? '',
      bulletinTitleNm: data?.bulletinTitleNm ?? '',
      bulletinCntt: data?.bulletinCntt ?? '',
    }),
    [data],
  )

  useEffect(() => {
    if (isError) {
      showSnackbar(t('정보를 찾을 수 없습니다.'), { variant: 'error' })
      navigate('/admin/boards/faq', { replace: true })
    }
  }, [isError, navigate, showSnackbar])

  useEffect(() => {
    setCustomComponent(
      <AdminBoardsFaqDetailPageHeader
        onDelete={() => setShowDeleteModal(true)}
        onEdit={() => navigate(`/admin/boards/faq/edit/${faqNo}`, { state: data })}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [data, navigate, setCustomComponent, faqNo])

  return isLoading ? (
    <AdminLoading />
  ) : (
    <>
      <AdminFaqForm formData={faqData} readonly />
      <AdminConfirm
        open={showDeleteModal}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('게시글을 삭제하시겠습니까?')}
          </>
        }
        width={450}
        handleClose={() => {
          setShowDeleteModal(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setShowDeleteModal(false)
            },
          },
          {
            label: t('삭제'),
            variant: 'contained',
            color: 'error',
            onClick: async () => {
              await handleDeleteFaq()
            },
          },
        ]}
      >
        {t('게시 중인 글이 즉시 삭제됩니다.')}
      </AdminConfirm>
    </>
  )
}

export default AdminBoardsFaqDetailPage
