import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminAccessControlForm from '@/components/admin/AdminAccessControlForm'
import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminLoading from '@/components/admin/AdminLoading'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import membersService, { IMangerInfoEditRequest, UserRole } from '@/service/admin/members'

const AdminMemberManagementMangerEditPageHeader = ({ onCancel, onSave }: { onSave: () => void; onCancel: () => void }) => (
  <Flex gap={10}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={onCancel}>
      {t('취소')}
    </AdminButton>
    <AdminButton color="primary" variant="contained" size="h34" onClick={onSave}>
      {t('저장')}
    </AdminButton>
  </Flex>
)

const AdminMemberManagementMangerEditPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const navigate = useNavigate()
  const { userNo } = useParams()
  const { showSnackbar } = useSnackbar()

  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const [managerInfo, setManagerInfo] = useState<IMangerInfoEditRequest>({
    userRoleCd: UserRole.ADMIN,
    isOtherServiceAccessPossible: false,
    accessAllowedIpAddress: [''],
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['managerDetail', userNo],
    queryFn: async () => await membersService.getManagerDetail(userNo),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!userNo,
  })

  const displayManagerInfo = useMemo(
    () => `${data?.userNm} • ${data?.onDutyNm} • ${data?.departmentNm} • ${data?.customerCompanyNm}`,
    [data],
  )

  const handleIpUpdate = (ipList: string[]) => {
    setManagerInfo((prev) => ({
      ...prev,
      accessAllowedIpAddress: ipList,
    }))
  }

  const handleToggleAccess = () => {
    setManagerInfo((prev) => ({
      ...prev,
      isOtherServiceAccessPossible: !prev.isOtherServiceAccessPossible,
    }))
  }

  const handleUserRoleChange = (newUserRole: UserRole) => {
    setManagerInfo((prev) => ({
      ...prev,
      userRoleCd: newUserRole,
    }))
  }

  const handleSave = useCallback(async () => {
    if (userNo) {
      try {
        await membersService.updateManagerDetail(userNo, managerInfo)
        navigate(`/admin/member-mgmt/managers/detail/${userNo}`, { replace: true })
        showSnackbar(t('저장되었습니다.'), { variant: 'success' })
      } catch (error) {
        console.error('Error updating manager details:', error)
      }
    }
  }, [userNo, managerInfo, navigate, showSnackbar])

  useEffect(() => {
    setCustomComponent(
      <AdminMemberManagementMangerEditPageHeader onCancel={() => setShowCancelDialog(true)} onSave={() => setShowConfirmDialog(true)} />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  useEffect(() => {
    if (isError) {
      showSnackbar(t('사용자 정보를 찾을 수 없습니다.'), { variant: 'error' })
      navigate('/admin/member-mgmt/managers', { replace: true })
    }
  }, [isError, navigate, showSnackbar])

  useEffect(() => {
    if (data) {
      const { userRoleCd, isOtherServiceAccessPossible, accessAllowedIpAddress } = data

      setManagerInfo({
        userRoleCd,
        isOtherServiceAccessPossible,
        accessAllowedIpAddress,
      })
    }
  }, [data])

  return isLoading ? (
    <AdminLoading />
  ) : (
    <>
      <AdminAccessControlForm
        mode="edit"
        displayManagerInfo={displayManagerInfo}
        userRoleCd={managerInfo.userRoleCd}
        isOtherServiceAccessPossible={managerInfo.isOtherServiceAccessPossible}
        accessAllowedIpAddress={managerInfo.accessAllowedIpAddress}
        onToggleAccess={handleToggleAccess}
        onIpUpdate={handleIpUpdate}
        onUserRoleChange={handleUserRoleChange}
      />
      <AdminConfirm
        open={showCancelDialog}
        title={t('취소하시겠습니까?')}
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
              navigate(-1)
            },
          },
        ]}
      >
        {t('취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.')}
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

export default AdminMemberManagementMangerEditPage
