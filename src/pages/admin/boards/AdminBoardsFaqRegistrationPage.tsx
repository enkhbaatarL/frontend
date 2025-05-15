import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminFaqForm from '@/components/admin/AdminFaqForm'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import boardService, { IFaqDetailInfo } from '@/service/admin/board'

const AdminBoardsFaqRegistrationPageHeader = ({
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
    <AdminButton variant="contained" disabled={disabled} color="primary" size="h34" onClick={onSave}>
      {t('등록')}
    </AdminButton>
  </Flex>
)

const AdminBoardsFaqRegistrationPage = () => {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const { setCustomComponent } = useAdminHeader()

  const [formData, setFormData] = useState<IFaqDetailInfo>({
    bulletinCategorySeparateCd: '',
    bulletinTitleNm: '',
    bulletinCntt: '',
  })

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const handleSave = async () => {
    try {
      await boardService.registerFaq(formData)
      showSnackbar(t('등록되었습니다.'), { variant: 'success' })
      navigate('/admin/boards/faq')
    } catch (error) {
      console.error(error)
    }
  }

  const disabledSaveButton = useMemo(
    () => !formData.bulletinCategorySeparateCd || !formData.bulletinTitleNm || !formData.bulletinCntt,
    [formData],
  )

  useEffect(() => {
    setCustomComponent(
      <AdminBoardsFaqRegistrationPageHeader
        onSave={() => setShowSaveModal(true)}
        onCancel={() => setShowCancelModal(true)}
        disabled={disabledSaveButton}
      />,
    )

    return () => setCustomComponent(null)
  }, [disabledSaveButton, setCustomComponent])

  return (
    <>
      <AdminFaqForm formData={formData} setFormData={setFormData} />
      <MIConfirm
        open={showCancelModal}
        title={t('등록을 취소하시겠습니까?')}
        width={450}
        handleClose={() => {
          setShowCancelModal(false)
        }}
        actions={[
          {
            label: t('이어서 작성'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setShowCancelModal(false)
            },
          },
          {
            label: '취소 및 이동',
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setShowCancelModal(false)
              navigate('/admin/boards/faq')
            },
          },
        ]}
      >
        {t('등록 취소 시 입력된 내용은 저장되지 않습니다.')}
      </MIConfirm>
      <MIConfirm
        open={showSaveModal}
        title={t('등록하시겠습니까?')}
        width={450}
        handleClose={() => {
          setShowSaveModal(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setShowSaveModal(false)
            },
          },
          {
            label: t('등록'),
            variant: 'filled',
            color: 'primary',
            onClick: async () => {
              setShowSaveModal(false)
              await handleSave()
            },
          },
        ]}
      >
        {t('등록 즉시 서비스 화면에 게시됩니다.')}
      </MIConfirm>
    </>
  )
}

export default AdminBoardsFaqRegistrationPage
