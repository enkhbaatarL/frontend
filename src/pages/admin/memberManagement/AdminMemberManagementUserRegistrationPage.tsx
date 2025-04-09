import CancelIcon from '@mui/icons-material/Cancel'
import CheckIcon from '@mui/icons-material/Check'
import { Grid2 as Grid, Typography, Chip } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminTable, { AdminTableCell, AdminTableHeader } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import AddIcon from '@/components/common/icons/AddIcon'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService, { IGroupUserInfo, IGroupUserRequest } from '@/service/admin/companies'
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
  const [_selectedRow, setSelectedRow] = useState<SelectedRow | null>(null)
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
  } = useSearchFilter<Omit<IGroupUserRequest, 'userRoleCd'>, IPaginationResponse<IGroupUserInfo>>(
    companiesService.getGroupUsers,
    {
      companyCd: '',
      userNm: '',
      emailAddress: '',
    },
    {
      page: 1,
      size: 20,
    },
  )

  const { data: filterOptions } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => await companiesService.getDepartmentAll(),
    refetchOnWindowFocus: false,
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
      headerName: '등록 여부',
      width: 90,
      align: 'center',
      renderHeader: () => <AdminTableHeader>등록 여부</AdminTableHeader>,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell: ({ row }) => {
        const initiallyRegistered = row.isRegistered
        const isNewlyRegistered = registeredUsers.some((u) => u.imCd === row.imCd && u.isRegisteredNew)

        return (
          <CheckIcon fontSize="small" style={{ color: initiallyRegistered ? '#ccc' : isNewlyRegistered ? '#0CA678' : 'transparent' }} />
        )
      },
    },
    {
      field: 'companyNm',
      headerName: t('회사명'),
      flex: 1,
      renderHeader: () => <AdminTableHeader>회사명</AdminTableHeader>,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody1', color: 'gray' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'departmentNm',
      headerName: t('소속'),
      flex: 1,
      renderHeader: () => <AdminTableHeader>소속</AdminTableHeader>,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell(params) {
        return <AdminTableCell typography={{ color: 'gray' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'onDutyNm',
      headerName: t('직위'),
      flex: 1,
      renderHeader: () => <AdminTableHeader>직위</AdminTableHeader>,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell(params) {
        return <AdminTableCell typography={{ color: 'gray' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'userNm',
      headerName: t('이름'),
      flex: 1,
      renderHeader: () => <AdminTableHeader>이름</AdminTableHeader>,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell(params) {
        return <AdminTableCell typography={{ color: 'gray' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'loginId',
      headerName: t('이메일'),
      flex: 1,
      renderHeader: () => <AdminTableHeader>이메일</AdminTableHeader>,
      cellClassName: (params) => (params.row.isRegistered ? 'disable-cell' : ''),
      renderCell(params) {
        return <AdminTableCell typography={{ color: 'gray' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 52,
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
      await companiesService.registerUser({ imCd: request })
      showSnackbar('등록되었습니다.', { variant: 'success' })
      navigate('/admin/member-mgmt/users')
    } catch (error) {
      console.log(error)
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
        <AdminSelect
          label={t('회사명')}
          value={filter.companyCd}
          onChange={(e) => {
            updateFilter('companyCd', e.target.value as string)
          }}
          options={filterOptions?.map(({ companyCd, companyNm }) => ({ label: companyNm, value: companyCd })) ?? []}
          useAllOption={false}
        />
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
      <AdminTable
        getRowId={(row) => row.userNm}
        columns={columns}
        data={data}
        isLoading={isLoading}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
        noRowMessage={isPureState ? t('회원을 검색하세요.') : undefined}
      />

      <Grid container direction="column" spacing={3}>
        <Grid container direction="column" gap={1}>
          <Typography color="gray.90" variant="subtitle">
            등록할 사용자
            <Typography marginLeft="5px" sx={{ verticalAlign: 'text-bottom' }} component="span" color="error">
              *
            </Typography>
          </Typography>
          <Typography color="gray.60" variant="subtext">
            사용자 목록에서 선택하세요.
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
      <AdminConfirm
        open={isOpenRegistration}
        title="등록하시겠습니까?"
        width={450}
        handleClose={() => {
          setIsOpenRegistration(false)
        }}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setIsOpenRegistration(false)
              setSelectedRow(null)
            },
          },
          {
            label: '등록',
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setIsOpenRegistration(false)
              handleRegisterUser()
            },
          },
        ]}
      >
        {registeredUsers.length === 1
          ? `${registeredUsers[0]?.userNm} 을 등록합니다.`
          : `${registeredUsers[0]?.userNm} 외 ${registeredUsers.length - 1} 명을 등록합니다.`}
      </AdminConfirm>
      <AdminConfirm
        open={isOpenCancel}
        title="취소하시겠습니까?"
        width={450}
        handleClose={() => {
          setIsOpenCancel(false)
        }}
        actions={[
          {
            label: '이어서 작성',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setIsOpenCancel(false)
            },
          },
          {
            label: '취소 및 이동',
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setIsOpenCancel(false)
              navigate('/admin/member-mgmt/users')
            },
          },
        ]}
      >
        취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.
      </AdminConfirm>
    </>
  )
}

export default AdminMemberManagementUserRegistrationPage
