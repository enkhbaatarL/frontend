import { Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminLoading from '@/components/admin/AdminLoading'
import AdminNoticeForm from '@/components/admin/AdminNoticeForm'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import boardService, { INoticeDetailInfo } from '@/service/admin/board'

const AdminBoardsNoticeEditPageHeader = ({
  onCancel,
  onSave,
  disabled,
}: {
  onSave: () => void
  onCancel: () => void
  disabled?: boolean
}) => (
  <Flex gap={10}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={onCancel}>
      {t('취소')}
    </AdminButton>
    <AdminButton color="primary" variant="contained" size="h34" disabled={disabled} onClick={onSave}>
      {t('저장')}
    </AdminButton>
  </Flex>
)

const AdminBoardsNoticeEditPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const { noticeNo } = useParams()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const [formData, setFormData] = useState<INoticeDetailInfo>({
    isTopFixed: false,
    isPopupUse: false,
    popupPostBeginDt: '',
    popupPostEndDt: '',
    bulletinCategorySeparateCd: '',
    isWholePost: false,
    targetList: [],
    bulletinValidBeginDt: '',
    bulletinValidEndDt: '',
    bulletinTitleNm: '',
    bulletinCntt: '',
    fileList: [],
  })

  const { data, isError, isLoading } = useQuery({
    queryKey: ['noticeDetail', noticeNo],
    queryFn: async () => await boardService.getNoticeDetail(noticeNo),
    refetchOnWindowFocus: false,
    enabled: !!noticeNo,
  })

  const handleSave = useCallback(async () => {
    if (noticeNo) {
      try {
        await boardService.updateNotice(noticeNo, formData)
        navigate('/admin/boards/notice', { replace: true })
        showSnackbar(t('저장되었습니다.'), { variant: 'success' })
      } catch (error) {
        console.error('Error updating notice details:', error)
        showSnackbar(t('저장에 실패했습니다.'), { variant: 'error' })
      }
    }
  }, [noticeNo, formData, navigate, showSnackbar])

  const disabledSaveButton = useMemo(() => {
    const { bulletinCategorySeparateCd, bulletinTitleNm, bulletinValidBeginDt, bulletinValidEndDt, bulletinCntt, isWholePost, targetList } =
      formData

    return (
      (!isWholePost && targetList.length === 0) ||
      [bulletinCategorySeparateCd, bulletinTitleNm, bulletinValidBeginDt, bulletinValidEndDt, bulletinCntt].some((field) => !field)
    )
  }, [formData])

  useEffect(() => {
    if (isError) {
      showSnackbar(t('정보를 찾을 수 없습니다.'), { variant: 'error' })
      navigate('/admin/boards/notice', { replace: true })
    }
  }, [isError, navigate, showSnackbar])

  useEffect(() => {
    setCustomComponent(
      <AdminBoardsNoticeEditPageHeader
        onCancel={() => setShowCancelDialog(true)}
        onSave={() => setShowConfirmDialog(true)}
        disabled={disabledSaveButton}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [disabledSaveButton, navigate, noticeNo, setCustomComponent])

  useEffect(() => {
    if (data) setFormData(data)
  }, [data])

  return isLoading ? (
    <AdminLoading />
  ) : (
    <>
      <AdminNoticeForm formData={formData} setFormData={setFormData} />
      <MIConfirm
        open={showCancelDialog}
        title={t('등록을 취소하시겠습니까?')}
        width={450}
        handleClose={() => setShowCancelDialog(false)}
        actions={[
          { label: '이어서 작성', variant: 'outlined', color: 'gray', onClick: () => setShowCancelDialog(false) },
          {
            label: t('취소 및 이동'),
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setShowCancelDialog(false)
              navigate(`/admin/boards/notice/detail/${noticeNo}`)
            },
          },
        ]}
      >
        {t('등록 취소 시 입력된 내용은 저장되지 않습니다.')}
      </MIConfirm>
      <MIConfirm
        open={showConfirmDialog}
        title={t('저장하시겠습니까?')}
        width={450}
        handleClose={() => setShowConfirmDialog(false)}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'gray',
            onClick: () => setShowConfirmDialog(false),
          },
          {
            label: '저장',
            variant: 'filled',
            color: 'primary',
            onClick: async () => {
              setShowConfirmDialog(false)
              await handleSave()
            },
          },
        ]}
      >
        <Typography variant="body2" mb={5} color="gray.70" component="div">
          <div>{t('저장 즉시 서비스 화면에 게시됩니다.')}</div>
          <div>{t('종료일이 오늘 날짜인 경우 게시 안 함으로 등록됩니다.')}</div>
        </Typography>
        <Typography variant="body2" color="gray.60" component="div">
          <div>{t(`게시 시작일 : ${dayjs(formData.bulletinValidBeginDt).format('YYYY-MM-DD')}`)}</div>
          <div>{t(`게시 종료일 : ${dayjs(formData.bulletinValidEndDt).format('YYYY-MM-DD')}`)}</div>
        </Typography>
      </MIConfirm>
    </>
  )
}

export default AdminBoardsNoticeEditPage
