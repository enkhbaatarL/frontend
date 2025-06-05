import CancelIcon from '@mui/icons-material/Cancel'
import CheckIcon from '@mui/icons-material/Check'
import { Grid2 as Grid, Typography, Chip, Box } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminTable, { AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import AddIcon from '@/components/common/icons/AddIcon'
import MIField from '@/components/common/input/MIField'
import MISelect from '@/components/common/select/MISelect'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService from '@/service/admin/companies'
import membersService, { IGroupUserInfo, IGroupUserRequest } from '@/service/admin/members'
import { IPaginationResponse } from '@/types/api'

interface SelectedRow {
  companyCd: string
  companyNm: string
  departmentCd: string
  departmentNm: string
  emailAddress: string
  employeeNo: string
  imCd: string
  isRegistered: boolean
  loginId: string
  userNm: string
  isRegisteredNew?: boolean
  onDutyNm: string
}

const AdminCustomerCompanyManagementUserPageHeader = ({
  registeredUsers,
  setIsOpenCancel,
  setIsOpenRegistration,
}: {
  registeredUsers: SelectedRow[]
  setIsOpenCancel: (value: boolean) => void
  setIsOpenRegistration: (value: boolean) => void
}) => (
  <Flex gap={10}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={() => setIsOpenCancel(true)}>
      {t('취소')}
    </AdminButton>
    <AdminButton
      disabled={registeredUsers.length === 0}
      color="primary"
      variant="contained"
      size="h34"
      onClick={() => setIsOpenRegistration(true)}
    >
      {t('등록')}
    </AdminButton>
  </Flex>
)

const AdminMemberManagementUserRegistrationPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const [registeredUsers, setRegisteredUsers] = useState<SelectedRow[]>([])
  const [isOpenRegistration, setIsOpenRegistration] = useState<boolean>(false)
  const [isOpenCancel, setIsOpenCancel] = useState<boolean>(false)
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

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

  /**
   * 추가 버튼
   */
  const handleRegister = useCallback((user: SelectedRow) => {
    setRegisteredUsers((prev) => {
      if (!prev.some((u) => u.imCd === user.imCd)) {
        return [...prev, { ...user, isRegistered: true, isRegisteredNew: true }]
      }

      return prev
    })
  }, [])

  const columns: GridColDef[] = [
    {
      field: 'isRegistered',
      headerName: t('등록 여부'),
      maxWidth: 90,
      align: 'center',
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell: ({ row }) => {
        const initiallyRegistered = row.isRegistered
        const isNewlyRegistered = registeredUsers.some((u) => u.imCd === row.imCd && u.isRegisteredNew)

        let iconColor = 'transparent'
        if (initiallyRegistered) {
          iconColor = '#ccc'
        } else if (isNewlyRegistered) {
          iconColor = '#0CA678'
        }

        return <CheckIcon fontSize="small" style={{ color: iconColor }} />
      },
    },
    {
      field: 'companyNm',
      headerName: t('회사명'),
      flex: 1,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody1', color: 'gray' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'departmentNm',
      headerName: t('소속'),
      flex: 1,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell(params) {
        return (
          <AdminTableCell typography={{ color: 'gray' }} ellipsis>
            {params.value}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'onDutyNm',
      headerName: t('직위'),
      flex: 1,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell(params) {
        return (
          <AdminTableCell typography={{ color: 'gray' }} ellipsis>
            {params.value}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'userNm',
      headerName: t('이름'),
      flex: 1,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell(params) {
        return (
          <AdminTableCell typography={{ color: 'gray' }} ellipsis>
            {params.value}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'loginId',
      headerName: t('이메일'),
      flex: 1,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell(params) {
        return (
          <AdminTableCell typography={{ color: 'gray' }} ellipsis>
            {params.value}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'actions',
      headerName: '',
      maxWidth: 52,
      align: 'center',
      renderCell: ({ row }) => {
        const isNewlyRegistered = registeredUsers.some((u) => u.imCd === row.imCd && u.isRegisteredNew)

        return (
          <>
            {!row.isRegistered && (
              <AddIcon
                fontSize="small"
                cursor="pointer"
                onClick={() => handleRegister(row)}
                style={{
                  color: isNewlyRegistered ? '#CED4DA' : '#868E96',
                  pointerEvents: isNewlyRegistered ? 'none' : 'auto',
                }}
              />
            )}
          </>
        )
      },
    },
  ]

  /**
   * 회원 등록
   */
  const handleRegisterUser = async () => {
    try {
      const request = registeredUsers.map((v) => v.imCd)
      const response = await membersService.registerUser({ imCd: request })

      if (response.status) {
        navigate('/admin/member-mgmt/users', {
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
    } catch (error) {
      console.error(error)
      showSnackbar('문제가 발생했습니다.', {
        variant: 'error',
        body: '나중에 다시 시도해 주세요.',
      })
    }
  }

  useEffect(() => {
    setCustomComponent(
      <AdminCustomerCompanyManagementUserPageHeader
        setIsOpenRegistration={setIsOpenRegistration}
        setIsOpenCancel={setIsOpenCancel}
        registeredUsers={registeredUsers}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent, registeredUsers])

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
          getRowId={(row) => row.userNm}
          columns={columns}
          data={data}
          isLoading={isLoading}
          size={pagination?.size}
          sizeList={[5, 10, 20, 50]}
          onSizeChange={updateSize}
          onPageChange={updatePage}
          noRowMessage={isPureState ? t('사용자를 검색하고 선택하여 등록하세요.') : undefined}
          maxVisibleRowCount={5}
        />

        <Grid container direction="column" spacing={3}>
          <Grid container direction="column" gap={1}>
            <Typography color="gray.90" variant="subtitle">
              {t('등록할 사용자')}
              <Typography marginLeft="5px" sx={{ verticalAlign: 'text-bottom' }} component="span" color="error">
                *
              </Typography>
            </Typography>
            <Typography color="gray.60" variant="subtext">
              {t('사용자 목록에서 선택하세요.')}
            </Typography>
          </Grid>
          <Grid minHeight={100} wrap="wrap" borderRadius={2} bgcolor="gray.5" gap={2} padding={3.5} container>
            {registeredUsers.map((user) => (
              <Chip
                size="small"
                sx={{
                  height: '28px',
                  color: 'gray.70',
                  fontSize: '14px',
                  fontWeight: 400,
                  backgroundColor: '#fff',
                  borderColor: 'gray.30',
                  padding: '0 5px',
                  borderWidth: '1.8px',
                }}
                deleteIcon={<CancelIcon style={{ marginLeft: '3px', color: '#CED4DA' }} />}
                variant="outlined"
                key={user.imCd}
                label={
                  <>
                    <span style={{ fontWeight: 600 }}>{user.userNm}</span>
                    {' • '}
                    {user.onDutyNm}
                    {' • '}
                    {user.departmentNm}
                  </>
                }
                onDelete={() => setRegisteredUsers(registeredUsers.filter((u) => u.imCd !== user.imCd))}
              />
            ))}
          </Grid>
        </Grid>
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
              await handleRegisterUser()
            },
          },
        ]}
      >
        {registeredUsers.length === 1
          ? `${registeredUsers[0]?.userNm} 을 등록합니다.`
          : `${registeredUsers[0]?.userNm} 외 ${registeredUsers.length - 1} 명을 등록합니다.`}
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
              navigate('/admin/member-mgmt/users')
            },
          },
        ]}
      >
        {t('취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.')}
      </MIConfirm>
    </>
  )
}

export default AdminMemberManagementUserRegistrationPage
