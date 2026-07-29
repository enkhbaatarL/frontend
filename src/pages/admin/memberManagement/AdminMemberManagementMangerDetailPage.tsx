import ErrorIcon from '@mui/icons-material/Error'
import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminAccessControlForm from '@/components/admin/AdminAccessControlForm'
import AdminButton from '@/components/admin/AdminButton'
import AdminSkeleton, { AdminAccessControlFormSkeleton } from '@/components/admin/AdminSkeleton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import membersService, { UserRole } from '@/service/admin/members'

const AdminMemberManagementMangerDetailPageHeader = ({ onDelete, onEdit }: { onDelete: () => void; onEdit: () => void }) => (
  <Flex gap={10}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={onDelete}>
      {t('삭제')}
    </AdminButton>
    <AdminButton color="primary" variant="contained" size="h34" onClick={onEdit}>
      {t('수정')}
    </AdminButton>
  </Flex>
)

const AdminMemberManagementMangerDetailPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const { userNo } = useParams()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data, isError, isLoading } = useQuery({
    queryKey: ['managerDetail', userNo],
    queryFn: async () => await membersService.getManagerDetail(userNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!userNo,
  })

  const displayManagerInfo = useMemo(
    () => `${data?.userNm} • ${data?.onDutyNm} • ${data?.departmentNm} • ${data?.customerCompanyNm}`,
    [data],
  )

  useEffect(() => {
    if (isError) {
      showSnackbar(t('사용자 정보를 찾을 수 없습니다.'), { variant: 'error' })
      navigate('/admin/member-mgmt/managers', { replace: true })
    }
  }, [isError, navigate, showSnackbar])

  useEffect(() => {
    setCustomComponent(
      <AdminMemberManagementMangerDetailPageHeader
        onDelete={() => setShowDeleteModal(true)}
        onEdit={() => navigate(`/admin/member-mgmt/managers/edit/${userNo}`, { state: data })}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [data, navigate, setCustomComponent, userNo])

  const handleDeleteUser = useCallback(async () => {
    if (!userNo || isDeleting) return

    setIsDeleting(true)

    try {
      const response = await membersService.deleteAdmin(Number(userNo))

      if (response.status) {
        navigate('/admin/member-mgmt/managers', {
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
    } catch {
      showSnackbar('문제가 발생했습니다.', {
        variant: 'error',
        body: '나중에 다시 시도해 주세요.',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }, [userNo, isDeleting, showSnackbar, navigate])

  return (
    <AdminSkeleton
      loading={isLoading}
      custom={
        <Box display={'flex'} flexDirection={'column'} gap={'60px'}>
          <AdminAccessControlFormSkeleton />
        </Box>
      }
    >
      <AdminAccessControlForm
        mode="view"
        displayManagerInfo={displayManagerInfo}
        userRoleCd={data?.userRoleCd ?? UserRole.ADMIN}
        isOtherServiceAccessPossible={data?.isOtherServiceAccessPossible ?? false}
        accessAllowedIpAddress={data?.accessAllowedIpAddress ?? []}
      />
      <MIConfirm
        open={showDeleteModal}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('삭제하시겠습니까?')}
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
            disabled: isDeleting,
            onClick: () => {
              setShowDeleteModal(false)
            },
          },
          {
            label: t('삭제'),
            variant: 'filled',
            color: 'red',
            disabled: isDeleting,
            onClick: async () => {
              await handleDeleteUser()
            },
          },
        ]}
      >
        {t('삭제 시 관리자의 모든 권한이 즉시 해제됩니다.')}
      </MIConfirm>
    </AdminSkeleton>
  )
}

export default AdminMemberManagementMangerDetailPage
