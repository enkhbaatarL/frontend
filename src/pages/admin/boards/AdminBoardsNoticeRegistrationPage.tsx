import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminNoticeForm from '@/components/admin/AdminNoticeForm'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import boardService, { INoticeDetailInfo } from '@/service/admin/board'

const AdminBoardsNoticeRegistrationPageHeader = ({
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

const AdminBoardsNoticeRegistrationlPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

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

  const handleSave = async () => {
    try {
      await boardService.registerNotice(formData)
      showSnackbar(t('등록되었습니다.'), { variant: 'success' })
      navigate('/admin/boards/notice')
    } catch (error) {
      console.error(error)
    }
  }

  const disabledSaveButton = useMemo(() => {
    const { bulletinCategorySeparateCd, bulletinTitleNm, bulletinValidBeginDt, bulletinValidEndDt, bulletinCntt, isWholePost, targetList } =
      formData

    return (
      (!isWholePost && targetList.length === 0) ||
      [bulletinCategorySeparateCd, bulletinTitleNm, bulletinValidBeginDt, bulletinValidEndDt, bulletinCntt].some((field) => !field)
    )
  }, [formData])

  useEffect(() => {
    setCustomComponent(
      <AdminBoardsNoticeRegistrationPageHeader
        onSave={() => setShowSaveModal(true)}
        onCancel={() => setShowCancelModal(true)}
        disabled={disabledSaveButton}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [disabledSaveButton, navigate, setCustomComponent])

  return (
    <>
      <AdminNoticeForm formData={formData} setFormData={setFormData} />
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
              navigate('/admin/boards/notice')
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
        <Typography variant="body2" mb={5} color="gray.70" component="div">
          <div>{t('등록 즉시 서비스 화면에 게시됩니다.')}</div>
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

export default AdminBoardsNoticeRegistrationlPage
