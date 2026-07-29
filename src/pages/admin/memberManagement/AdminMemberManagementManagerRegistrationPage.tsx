import CheckIcon from '@mui/icons-material/Check'
import { Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { isEmpty } from 'lodash-es'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminAccessControlForm from '@/components/admin/AdminAccessControlForm'
import AdminButton from '@/components/admin/AdminButton'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminTable, { AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField'
import MISelect from '@/components/common/select/MISelect'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService from '@/service/admin/companies'
import membersService, { IGroupUserInfo, IGroupUserRequest, IMangerRegisterRequest, UserRole } from '@/service/admin/members'
import { IPaginationResponse } from '@/types/api'

const AdminMemberManagementManagersRegistrationPageHeader = ({
  setIsOpenCancel,
  setIsOpenRegistration,
  disabled,
}: {
  setIsOpenCancel: (value: boolean) => void
  setIsOpenRegistration: (value: boolean) => void
  disabled?: boolean
}) => (
  <Flex gap={10}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={() => setIsOpenCancel(true)}>
      {t('취소')}
    </AdminButton>
    <AdminButton color="primary" variant="contained" size="h34" onClick={() => setIsOpenRegistration(true)} disabled={disabled}>
      {t('등록')}
    </AdminButton>
  </Flex>
)

const AdminMemberManagementManagersRegistrationPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const [isOpenRegistration, setIsOpenRegistration] = useState<boolean>(false)
  const [isOpenCancel, setIsOpenCancel] = useState<boolean>(false)
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  const [selectedAdmin, setSelectedAdmin] = useState<Partial<IGroupUserInfo>>({})

  const {
    filter,
    updateFilter,
    resetFilter,
    search,
    isInitialState,
    isSearchedState,
    data,
    isPureState,
    isLoading,
    pagination,
    updatePage,
    updateSize,
  } = useSearchFilter<IGroupUserRequest, IPaginationResponse<IGroupUserInfo>>(
    membersService.getGroupUsers,
    {
      companyCd: '',
      userNm: '',
      emailAddress: '',
    },
    {
      page: 1,
      size: 5,
    },
    { initialFetch: false },
  )

  const { data: filterOptions } = useQuery({
    queryKey: ['getDepartmentAll'],
    queryFn: async () => await companiesService.getDepartmentAll(),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const [managerInfo, setManagerInfo] = useState<Partial<IMangerRegisterRequest>>({
    isOtherServiceAccessPossible: false,
    accessAllowedIpAddress: [''],
  })

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

  const handleRegisterManager = useCallback(async () => {
    try {
      const response = await membersService.registerManager({
        imCd: selectedAdmin.imCd ?? '',
        userRoleCd: managerInfo.userRoleCd ?? UserRole.ADMIN,
        isOtherServiceAccessPossible: managerInfo.isOtherServiceAccessPossible,
        accessAllowedIpAddress: managerInfo.accessAllowedIpAddress ?? [],
      })

      if (response.status) {
        navigate('/admin/member-mgmt/managers', {
          replace: true,
          state: {
            successMessage: t('등록되었습니다.'),
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
    }
  }, [
    managerInfo.accessAllowedIpAddress,
    managerInfo.isOtherServiceAccessPossible,
    managerInfo.userRoleCd,
    navigate,
    selectedAdmin.imCd,
    showSnackbar,
  ])

  const disabledRegisterButton = useMemo(() => {
    const { userRoleCd, accessAllowedIpAddress } = managerInfo

    return userRoleCd === undefined || (accessAllowedIpAddress?.length ?? 0) === 0 || accessAllowedIpAddress?.some((ip) => !ip)
  }, [managerInfo])

  const columns: GridColDef[] = [
    {
      field: 'isRegistered',
      headerName: t('등록여부'),
      minWidth: 90,
      maxWidth: 90,
      align: 'center',
      renderCell(param) {
        if (param.row.imCd === selectedAdmin.imCd)
          return (
            <AdminTableCell typography={{ color: 'point.green1' }} cursorPointer={!param.row.isRegistered}>
              <CheckIcon fontSize="small" />
            </AdminTableCell>
          )

        return param.row.isRegistered ? (
          <AdminTableCell disabled={param.row.isRegistered} cursorPointer={!param.row.isRegistered}>
            <CheckIcon fontSize="small" />
          </AdminTableCell>
        ) : null
      },
    },
    {
      field: 'companyNm',
      headerName: t('회사명'),
      minWidth: 120,
      flex: 1,
      renderCell(param) {
        return (
          <AdminTableCell typography={{ variant: 'tableBody1' }} disabled={param.row.isRegistered} cursorPointer={!param.row.isRegistered}>
            {param.value}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'departmentNm',
      headerName: t('소속'),
      minWidth: 120,
      renderCell(param) {
        return (
          <AdminTableCell disabled={param.row.isRegistered} cursorPointer={!param.row.isRegistered}>
            {param.value}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'positionNm',
      headerName: t('직위'),
      maxWidth: 180,
      renderCell(param) {
        return (
          <AdminTableCell disabled={param.row.isRegistered} cursorPointer={!param.row.isRegistered}>
            {param.value}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'userNm',
      headerName: t('이름'),
      maxWidth: 120,
      renderCell(param) {
        return (
          <AdminTableCell disabled={param.row.isRegistered} cursorPointer={!param.row.isRegistered}>
            {param.value}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'emailAddress',
      headerName: t('이메일'),
      width: 180,
      flex: 1,
      renderCell(param) {
        return (
          <AdminTableCell disabled={param.row.isRegistered} cursorPointer={!param.row.isRegistered}>
            {param.value}
          </AdminTableCell>
        )
      },
    },
  ]

  const displayManagerInfo = useMemo(
    () =>
      selectedAdmin.imCd
        ? `${selectedAdmin.userNm} • ${selectedAdmin.positionNm} • ${selectedAdmin.departmentNm} • ${selectedAdmin.companyNm}`
        : '',
    [selectedAdmin],
  )

  useEffect(() => {
    setCustomComponent(
      <AdminMemberManagementManagersRegistrationPageHeader
        setIsOpenRegistration={setIsOpenRegistration}
        setIsOpenCancel={setIsOpenCancel}
        disabled={disabledRegisterButton}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent, disabledRegisterButton])

  return (
    <>
      <AdminSearchFilter
        onSearch={search}
        onReset={resetFilter}
        disabledSearch={!filter.companyCd || isSearchedState}
        disabledReset={isInitialState}
      >
        <MIField label={t('회사명')}>
          <MISelect
            value={filter.companyCd}
            onChange={(e) => {
              updateFilter('companyCd', e.target.value as string)
            }}
            options={filterOptions?.map(({ companyCd, companyNm }) => ({ label: companyNm, value: companyCd })) ?? []}
            useAllOption={false}
          />
        </MIField>
        <AdminTextField
          label={t('이름')}
          value={filter.userNm}
          onChange={(e) => {
            updateFilter('userNm', e.target.value)
          }}
        />
        <AdminTextField
          label={t('이메일')}
          value={filter.emailAddress}
          onChange={(e) => {
            updateFilter('emailAddress', e.target.value)
          }}
        />
      </AdminSearchFilter>
      <Box className="content-body">
        <AdminTable
          getRowId={(row) => row.imCd}
          columns={columns}
          data={data}
          isLoading={isLoading}
          size={pagination?.size}
          sizeList={[5, 10, 20, 50]}
          onSizeChange={updateSize}
          onPageChange={updatePage}
          noRowMessage={isPureState ? t('등록할 사용자를 검색하세요.') : undefined}
          maxVisibleRowCount={5}
          onRowClick={(param) => {
            if (param.row.isRegistered || param.row.imCd === selectedAdmin.imCd) return

            setSelectedAdmin(param.row)
          }}
        />
        <Box>
          <Typography component="p" mb={3} variant="contentTitle">
            상세 권한 설정
          </Typography>
          <Box display="flex" flexDirection="column" p={5} sx={{ backgroundColor: 'gray.5', borderRadius: '4px' }} gap={'30px'}>
            <AdminAccessControlForm
              mode="register"
              displayManagerInfo={displayManagerInfo}
              userRoleCd={managerInfo.userRoleCd}
              isOtherServiceAccessPossible={managerInfo.isOtherServiceAccessPossible ?? false}
              accessAllowedIpAddress={managerInfo.accessAllowedIpAddress ?? ['']}
              onToggleAccess={handleToggleAccess}
              onIpUpdate={handleIpUpdate}
              onUserRoleChange={handleUserRoleChange}
              disabled={isEmpty(selectedAdmin)}
            />
          </Box>
        </Box>
      </Box>
      <MIConfirm
        open={isOpenRegistration}
        title={t('등록하시겠습니까?')}
        width={450}
        handleClose={() => {
          setIsOpenRegistration(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsOpenRegistration(false)
            },
          },
          {
            label: t('등록'),
            variant: 'filled',
            color: 'primary',
            onClick: async () => {
              setIsOpenRegistration(false)
              await handleRegisterManager()
            },
          },
        ]}
      >
        {`${selectedAdmin.userNm} 을 등록합니다.`}
      </MIConfirm>
      <MIConfirm
        open={isOpenCancel}
        title={t('취소하시겠습니까?')}
        width={450}
        handleClose={() => {
          setIsOpenCancel(false)
        }}
        actions={[
          {
            label: t('이어서 작성'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setIsOpenCancel(false)
            },
          },
          {
            label: t('취소 및 이동'),
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setIsOpenCancel(false)
              navigate('/admin/member-mgmt/managers')
            },
          },
        ]}
      >
        {t('취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.')}
      </MIConfirm>
    </>
  )
}

export default AdminMemberManagementManagersRegistrationPage
