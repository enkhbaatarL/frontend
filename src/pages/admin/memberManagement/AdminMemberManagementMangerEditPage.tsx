import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminCheckboxField from '@/components/admin/AdminCheckboxField'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminIpInput from '@/components/admin/AdminIpInput'
import AdminLoading from '@/components/admin/AdminLoading'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import membersService, { IMangerInfoEditRequest } from '@/service/admin/members'

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
    isOtherServiceAccessPossible: false,
    accessAllowedIpAddress: [],
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
      const { isOtherServiceAccessPossible, accessAllowedIpAddress } = data

      setManagerInfo({
        isOtherServiceAccessPossible,
        accessAllowedIpAddress,
      })
    }
  }, [data])

  return isLoading ? (
    <AdminLoading />
  ) : (
    <>
      <Box>
        <Typography sx={{ mb: 1 }} component="span" variant="subtitle">
          {t('관리자 정보')}
        </Typography>

        <Typography component="p" variant="subtext2" color="gray.60">
          {t('관리자 정보는 수정이 불가합니다. 수정 필요 시 삭제 후 신규 사용자를 등록해 주세요.')}
        </Typography>
        <AdminTextField
          sx={{ width: '700px', mt: 3 }}
          value={displayManagerInfo}
          aria-readonly="true"
          placeholder="사용자 검색 목록에서 사용자를 선택하세요."
        />
      </Box>
      <Box>
        <Typography sx={{ mb: 1 }} component="span" variant="subtitle">
          {t('타사 서비스 접근 여부')}
        </Typography>
        <Typography component="p" variant="subtext2" color="gray.60">
          {t('접근 허용 시 모든 고객사의 MI 서비스 접근이 가능합니다. 단, 데이터는 기본 정보만 표기됩니다.')}
        </Typography>
        <Box mt={3}>
          <AdminCheckboxField
            label="접근 허용"
            checked={managerInfo.isOtherServiceAccessPossible}
            onChange={() =>
              setManagerInfo((prev) => ({
                ...prev,
                isOtherServiceAccessPossible: !prev.isOtherServiceAccessPossible,
              }))
            }
          />
        </Box>
      </Box>
      <Box>
        <Typography sx={{ mb: 1 }} component="span" variant="subtitle">
          {t('관리자 IP')}
        </Typography>
        <Typography component="p" variant="subtext2" color="gray.60">
          {t('등록한 IP에서만 접속이 가능합니다. 등록할 관리자의 IP를 입력하세요.')}
        </Typography>
        <AdminIpInput ipList={managerInfo.accessAllowedIpAddress} onUpdate={handleIpUpdate} />
      </Box>
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
