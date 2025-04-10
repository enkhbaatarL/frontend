import ErrorIcon from '@mui/icons-material/Error'
import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminChip from '@/components/admin/AdminChip'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminLoading from '@/components/admin/AdminLoading'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import membersService from '@/service/admin/members'

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

export default function AdminMemberManagementMangerDetailPage() {
  const { setCustomComponent } = useAdminHeader()
  const { userNo } = useParams()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data, isError, isLoading } = useQuery({
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
          <AdminChip
            color={data?.isOtherServiceAccessPossible ? 'blue' : 'gray'}
            size="h24"
            label={data?.isOtherServiceAccessPossible ? t('허용') : t('비허용')}
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

        <Stack spacing={2} mt={3}>
          {data?.accessAllowedIpAddress.map((ip) => <AdminTextField key={ip} sx={{ width: '700px' }} value={ip} aria-readonly="true" />)}
        </Stack>
      </Box>
      <AdminConfirm
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
            color: 'secondary',
            onClick: () => {
              setShowDeleteModal(false)
            },
          },
          {
            label: t('삭제'),
            variant: 'contained',
            color: 'error',
            onClick: () => {
              setShowDeleteModal(false)
              showSnackbar(t('삭제되었습니다.'), { variant: 'success' })
            },
          },
        ]}
      >
        {t('삭제 시 관리자의 모든 권한이 즉시 해제됩니다.')}
      </AdminConfirm>
    </>
  )
}
