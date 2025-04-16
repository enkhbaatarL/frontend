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
import boardService, { IFaqDetailInfo } from '@/service/admin/board'

const AdminBoardsFaqEditPageHeader = ({ onCancel, onSave, disabled }: { onSave: () => void; onCancel: () => void; disabled?: boolean }) => (
  <Flex gap={10}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={onCancel}>
      {t('취소')}
    </AdminButton>
    <AdminButton color="primary" variant="contained" size="h34" disabled={disabled} onClick={onSave}>
      {t('저장')}
    </AdminButton>
  </Flex>
)

const AdminBoardsFaqEditPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const navigate = useNavigate()
  const { faqNo } = useParams()
  const { showSnackbar } = useSnackbar()

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const [formData, setFormData] = useState<IFaqDetailInfo>({
    bulletinCategorySeparateCd: '',
    bulletinTitleNm: '',
    bulletinCntt: '',
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['faqDetail', faqNo],
    queryFn: async () => await boardService.geFaqDetail(faqNo),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!faqNo,
  })

  const handleSave = useCallback(async () => {
    if (faqNo) {
      try {
        await boardService.updateFaq(faqNo, formData)
        navigate('/admin/boards/faq', { replace: true })
        showSnackbar(t('저장되었습니다.'), { variant: 'success' })
      } catch (error) {
        console.error('Error updating manager details:', error)
      }
    }
  }, [faqNo, formData, navigate, showSnackbar])

  const disabledSaveButton = useMemo(
    () => !formData.bulletinCategorySeparateCd || !formData.bulletinTitleNm || !formData.bulletinCntt,
    [formData],
  )

  useEffect(() => {
    setCustomComponent(
      <AdminBoardsFaqEditPageHeader
        onCancel={() => setShowCancelDialog(true)}
        onSave={() => setShowConfirmDialog(true)}
        disabled={disabledSaveButton}
      />,
    )

    return () => setCustomComponent(null)
  }, [disabledSaveButton, setCustomComponent])

  useEffect(() => {
    if (isError) {
      showSnackbar(t('정보를 찾을 수 없습니다.'), { variant: 'error' })
      navigate('/admin/boards/faq', { replace: true })
    }
  }, [isError, navigate, showSnackbar])

  useEffect(() => {
    if (data) {
      const { bulletinCategorySeparateCd, bulletinTitleNm, bulletinCntt } = data

      setFormData({
        bulletinCategorySeparateCd,
        bulletinTitleNm,
        bulletinCntt,
      })
    }
  }, [data])

  return isLoading ? (
    <AdminLoading />
  ) : (
    <>
      <AdminFaqForm formData={formData} setFormData={setFormData} />
      <AdminConfirm
        open={showCancelDialog}
        title={t('등록을 취소하시겠습니까?')}
        width={450}
        handleClose={() => setShowCancelDialog(false)}
        actions={[
          { label: '이어서 작성', variant: 'outlined', color: 'secondary', onClick: () => setShowCancelDialog(false) },
          {
            label: t('취소 및 이동'),
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setShowCancelDialog(false)
              navigate(`/admin/boards/faq/detail/${faqNo}`)
            },
          },
        ]}
      >
        {t('등록 취소 시 입력된 내용은 저장되지 않습니다.')}
      </AdminConfirm>
      <AdminConfirm
        open={showConfirmDialog}
        title={t('저장하시겠습니까?')}
        width={450}
        handleClose={() => setShowConfirmDialog(false)}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => setShowConfirmDialog(false),
          },
          {
            label: '저장',
            variant: 'contained',
            color: 'primary',
            onClick: async () => {
              setShowConfirmDialog(false)
              await handleSave()
            },
          },
        ]}
      />
    </>
  )
}

export default AdminBoardsFaqEditPage
