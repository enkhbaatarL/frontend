import ErrorIcon from '@mui/icons-material/Error'
import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminNoticeForm from '@/components/admin/AdminNoticeForm'
import AdminSkeleton, { AdminNoticeFormSkeleton } from '@/components/admin/AdminSkeleton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import boardService, { INoticeDetailInfo } from '@/service/admin/board'

const AdminBoardsNoticeDetailPageHeader = ({ onDelete, onEdit }: { onDelete: () => void; onEdit: () => void }) => (
  <Flex gap={10}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={onDelete}>
      {t('삭제')}
    </AdminButton>
    <AdminButton color="primary" variant="contained" size="h34" onClick={onEdit}>
      {t('수정')}
    </AdminButton>
  </Flex>
)

const AdminBoardsNoticeDetailPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const { noticeNo } = useParams()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data, isError, isLoading } = useQuery({
    queryKey: ['noticeDetail', noticeNo],
    queryFn: async () => await boardService.getNoticeDetail(noticeNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!noticeNo,
  })

  const handleDeleteNotice = useCallback(async () => {
    if (!noticeNo) return

    try {
      const response = await boardService.deleteNotice(noticeNo)

      if (response.status) {
        if (response.status) {
          navigate('/admin/boards/notice', {
            replace: true,
            state: {
              successMessage: t('삭제되었습니다.'),
            },
          })
        } else {
          showSnackbar('문제가 발생했습니다.', {
            variant: 'error',
            body: '나중에 다시 시도해 주세요.',
          })
        }
      }
    } catch (error) {
      console.error(error)
      showSnackbar('문제가 발생했습니다.', {
        variant: 'error',
        body: '나중에 다시 시도해 주세요.',
      })
    }
  }, [noticeNo, navigate, showSnackbar])

  const noticeData = useMemo<INoticeDetailInfo>(
    () => ({
      isTopFixed: data?.isTopFixed ?? false,
      isPopupUse: data?.isPopupUse ?? false,
      popupPostBeginDt: data?.popupPostBeginDt ?? '',
      popupPostEndDt: data?.popupPostEndDt ?? '',
      bulletinCategorySeparateCd: data?.bulletinCategorySeparateCd ?? '',
      isWholePost: data?.isWholePost ?? false,
      targetList: data?.targetList ?? [],
      bulletinValidBeginDt: data?.bulletinValidBeginDt ?? '',
      bulletinValidEndDt: data?.bulletinValidEndDt ?? '',
      bulletinTitleNm: data?.bulletinTitleNm ?? '',
      bulletinCntt: data?.bulletinCntt ?? '',
      fileList: data?.fileList ?? [],
    }),
    [data],
  )

  useEffect(() => {
    if (isError) {
      showSnackbar(t('정보를 찾을 수 없습니다.'), { variant: 'error' })
      navigate('/admin/boards/notice', { replace: true })
    }
  }, [isError, navigate, showSnackbar])

  useEffect(() => {
    setCustomComponent(
      <AdminBoardsNoticeDetailPageHeader
        onDelete={() => setShowDeleteModal(true)}
        onEdit={() => navigate(`/admin/boards/notice/edit/${noticeNo}`)}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [navigate, noticeNo, setCustomComponent])

  return (
    <AdminSkeleton
      loading={isLoading}
      custom={
        <Box display={'flex'} flexDirection={'column'} gap={'60px'}>
          <AdminNoticeFormSkeleton />
        </Box>
      }
    >
      <AdminNoticeForm formData={noticeData} readonly />
      <MIConfirm
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
            color: 'gray',
            onClick: () => {
              setShowDeleteModal(false)
            },
          },
          {
            label: t('삭제'),
            variant: 'filled',
            color: 'red',
            onClick: async () => {
              await handleDeleteNotice()
            },
          },
        ]}
      >
        {t('게시 중인 글이 즉시 삭제됩니다.')}
      </MIConfirm>
    </AdminSkeleton>
  )
}

export default AdminBoardsNoticeDetailPage
