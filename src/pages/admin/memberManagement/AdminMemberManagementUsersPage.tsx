import DeleteIcon from '@mui/icons-material/Delete'
import ErrorIcon from '@mui/icons-material/Error'
import { Box, Tooltip } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { isEmpty } from 'lodash-es'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
import companiesService, { IUserInfo, IUserRequest } from '@/service/admin/companies'
import { IPaginationResponse } from '@/types/api'

const PageHeader = () => {
  const navigate = useNavigate()

  return (
    <Flex gap={4}>
      <AdminButton variant="contained" color="primary" size="h34" onClick={() => navigate('/admin/member-mgmt/users/registration')}>
        {t('회원 등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminMemberManagementUsersPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const { showSnackbar } = useSnackbar()

  const [showDeleteModal, setShowDeleteModal] = useState(false)

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
    isLoading,
  } = useSearchFilter<Omit<IUserRequest, 'userRoleCd'>, IPaginationResponse<IUserInfo>>(
    companiesService.getUsers,
    {
      companyNo: '',
      departmentNm: '',
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

  const departmentOptions = useMemo(() => {
    updateFilter('departmentNm', '')

    return (filterOptions?.find(({ companyNo }) => companyNo === filter.companyNo)?.departmentNm ?? []).map((departmentNm) => ({
      label: departmentNm,
      value: departmentNm,
    }))
  }, [filter.companyNo, filterOptions, updateFilter])

  const columns: GridColDef[] = [
    {
      field: 'customerCompanyNm',
      headerName: t('회사명'),
      minWidth: 150,
      flex: 1,
      renderCell: (params) => (
        <AdminTableCell typography={{ variant: 'tableBody1' }} ellipsis cursorPointer>
          {params.value}
        </AdminTableCell>
      ),
    },
    { field: 'departmentNm', headerName: t('소속'), width: 160 },
    { field: 'onDutyNm', headerName: t('직위'), width: 180 },
    { field: 'userNm', headerName: t('이름'), width: 120 },
    { field: 'userLoginId', headerName: t('이메일'), width: 180 },
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
      width: 52,
      cellClassName: 'cellAction',
      align: 'center',
      renderCell: () => (
        <AdminTableAction
          actions={[
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
    setCustomComponent(<PageHeader />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return (
    <>
      <AdminSearchFilter onSearch={search} onReset={resetFilter} disabledSearch={isSearchedState} disabledReset={isInitialState}>
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
        onRowClick={() => {}}
      />
      <AdminConfirm
        open={showDeleteModal}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            {t('회원을 삭제하시겠습니까?')}
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
        {t('회원 정보 삭제 시 해당 회원은 서비스에 접근이 불가합니다.')}
      </AdminConfirm>
    </>
  )
}

export default AdminMemberManagementUsersPage
