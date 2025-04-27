import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ErrorIcon from '@mui/icons-material/Error'
import { Box, Tooltip } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { isEmpty } from 'lodash-es'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminTable, { AdminTableAction, AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService from '@/service/admin/companies'
import membersService, { IAdminUserInfo, IAdminUserRequest, UserRole } from '@/service/admin/members'
import { IPaginationResponse } from '@/types/api'

const AdminManagementManagersPageHeader = () => {
  const navigate = useNavigate()

  return (
    <Flex gap={10}>
      <AdminButton variant="contained" color="primary" size="h34" onClick={() => navigate('/admin/member-mgmt/managers/registration')}>
        {t('관리자 등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminMemberManagementManagersPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const { showSnackbar } = useSnackbar()

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const {
    filter,
    updateFilter,
    pagination,
    updateSize,
    updatePage,
    resetFilter,
    search,
    data,
    isInitialState,
    isSearchedState,
    isPureState,
    isLoading,
  } = useSearchFilter<IAdminUserRequest, IPaginationResponse<IAdminUserInfo>>(
    membersService.getManagers,
    {
      userRoleCd: '',
      companyNo: '',
      departmentNm: '',
      userNm: '',
      emailAddress: '',
    },
    {
      page: 1,
      size: 20,
    },
    { initialFetch: false },
  )

  const { data: filterOptions } = useQuery({
    queryKey: ['getDepartmentAll'],
    queryFn: async () => await companiesService.getDepartmentAll(),
    refetchOnWindowFocus: false,
  })

  const departmentOptions = useMemo(() => {
    updateFilter('departmentNm', '')

    const departmentList = filterOptions?.find(({ companyNo }) => String(companyNo) === String(filter.companyNo))?.departmentNm ?? []

    const searchParams = new URLSearchParams(location.search)
    const departmentName = searchParams.get('departmentNm')

    if (departmentName && departmentList.includes(departmentName)) {
      updateFilter('departmentNm', departmentName)
    }

    return departmentList.map((departmentNm) => ({
      label: departmentNm,
      value: departmentNm,
    }))
  }, [filter.companyNo, filterOptions, location.search, updateFilter])

  const columns: GridColDef[] = [
    {
      field: 'userRoleCd',
      headerName: t('구분'),
      maxWidth: 80,
      align: 'center',
      renderCell: (param) => {
        const color = param.value === UserRole.ADMIN ? 'blue' : 'orange'
        const label = param.value === UserRole.ADMIN ? t('Admin') : t('운영자')

        return (
          <AdminTableCell type="chip" chip={{ color }}>
            {label}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'customerCompanyNm',
      headerName: t('회사명'),
      width: 170,
      renderCell: (param) => (
        <AdminTableCell typography={{ variant: 'tableBody1' }} ellipsis cursorPointer>
          {param.value}
        </AdminTableCell>
      ),
    },
    { field: 'departmentNm', headerName: t('소속'), maxWidth: 180 },
    {
      field: 'isOtherServiceAccessPossible',
      headerName: t('타사 서비스'),
      width: 100,
      align: 'center',
      renderCell: (param) => {
        const color = param.value ? 'blue' : 'gray'
        const label = param.value ? t('허용') : t('비허용')

        return (
          <AdminTableCell type="chip" chip={{ color }}>
            {label}
          </AdminTableCell>
        )
      },
    },
    { field: 'userNm', headerName: t('이름'), width: 120 },
    { field: 'userLoginId', headerName: t('이메일'), minWidth: 180 },
    {
      field: 'createUserNm',
      headerName: t('등록자'),
      width: 120,
      renderCell: (param) => {
        const { createUserNm, createUserDeptNm, createUserCpnyNm } = param.row.auditInfo

        return createUserNm ? (
          <Box py="10px" px="12px">
            <Tooltip title={`${createUserNm} / ${createUserDeptNm} / ${createUserCpnyNm}`} arrow>
              {createUserNm}
            </Tooltip>
          </Box>
        ) : null
      },
    },
    {
      field: 'createDt',
      headerName: t('등록일'),
      width: 150,
      align: 'center',
      renderCell: (param) => {
        const { createDt } = param.row.auditInfo

        return createDt ? dayjs(createDt).format('YYYY-MM-DD') : null
      },
    },
    {
      field: 'actions',
      headerName: '',
      maxWidth: 52,
      cellClassName: 'cellAction',
      align: 'center',
      renderCell: ({ row }) => (
        <AdminTableAction
          actions={[
            {
              label: t('수정'),
              icon: <EditIcon fontSize="small" />,
              onClick: () => navigate(`/admin/member-mgmt/managers/edit/${row.userNo}`),
            },
            {
              label: t('삭제'),
              icon: <DeleteIcon fontSize="small" />,
              onClick: () => setShowDeleteModal(true),
            },
          ]}
        />
      ),
    },
  ]

  useEffect(() => {
    setCustomComponent(<AdminManagementManagersPageHeader />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return (
    <>
      <AdminSearchFilter onSearch={search} onReset={resetFilter} disabledSearch={isSearchedState} disabledReset={isInitialState}>
        <AdminSelect
          label={t('구분')}
          value={filter.userRoleCd}
          onChange={(e) => {
            updateFilter('userRoleCd', e.target.value as string)
          }}
          options={[
            { label: t('Admin'), value: UserRole.ADMIN },
            { label: t('운영자'), value: UserRole.OPERATOR },
          ]}
        />
        <AdminSelect
          label={t('회사명')}
          value={filter.companyNo}
          onChange={(e) => {
            updateFilter('companyNo', e.target.value as string)
          }}
          options={filterOptions?.map(({ companyNo, companyNm }) => ({ label: companyNm, value: companyNo })) ?? []}
        />
        <AdminSelect
          label={t('소속')}
          value={filter.departmentNm}
          onChange={(e) => {
            updateFilter('departmentNm', e.target.value as string)
          }}
          disabled={isEmpty(departmentOptions)}
          options={departmentOptions}
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
        getRowId={(row) => row.userNo}
        columns={columns}
        data={data}
        isLoading={isLoading}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
        onRowClick={({ row }) => {
          navigate(`/admin/member-mgmt/managers/detail/${row.userNo}`)
        }}
        noRowMessage={isPureState ? t('회원을 검색하세요.') : undefined}
        maxVisibleRowCount={20}
      />
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

export default AdminMemberManagementManagersPage
