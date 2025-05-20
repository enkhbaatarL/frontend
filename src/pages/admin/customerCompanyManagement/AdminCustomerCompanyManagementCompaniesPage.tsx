import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { SnackbarProvider } from 'notistack'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSkeleton from '@/components/admin/AdminSkeleton.tsx'
import AdminSnackbar from '@/components/admin/AdminSnackbar'
import AdminTable, { AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField'
import MISelect from '@/components/common/select/MISelect'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import companiesService, { ICompaniesRequest, ICompanyInfo } from '@/service/admin/companies'
import { IPaginationResponse } from '@/types/api'

const AdminCustomerCompanyManagementCompaniesPageHeader = () => {
  const navigate = useNavigate()

  return (
    <Flex gap={4}>
      <AdminButton
        variant="contained"
        color="primary"
        size="h34"
        onClick={() => navigate('/admin/customer-company/companies/registration')}
      >
        {t('고객사 등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminCustomerCompanyManagementCompaniesPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const navigate = useNavigate()

  const activationStatusOptions = [
    { label: t('활성'), value: 'ACTIVE' },
    { label: t('비활성'), value: 'INACTIVE' },
  ]

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
  } = useSearchFilter<ICompaniesRequest, IPaginationResponse<ICompanyInfo>>(
    companiesService.getCompanies,
    {
      companyNm: '',
      activationSts: '',
    },
    {
      page: 1,
      size: 20,
    },
  )

  useEffect(() => {
    setCustomComponent(<AdminCustomerCompanyManagementCompaniesPageHeader />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  const columns: GridColDef[] = [
    {
      field: 'companyNm',
      headerName: t('회사명'),
      minWidth: 150,
      flex: 1,
      renderCell(params) {
        return (
          <AdminTableCell typography={{ variant: 'tableBody1' }} cursorPointer>
            {params.value}
          </AdminTableCell>
        )
      },
    },
    {
      field: 'isActivated',
      headerName: t('상태'),
      maxWidth: 120,
      align: 'center',
      renderCell: (params) => (
        <AdminTableCell
          type="chip"
          chip={{
            color: params.value ? 'blue' : 'white',
          }}
          cursorPointer
        >
          {params.value ? t('활성') : t('비활성')}
        </AdminTableCell>
      ),
    },
    {
      field: 'companyCd',
      headerName: t('회사 코드'),
      maxWidth: 120,
      align: 'center',
      renderCell(params) {
        return <AdminTableCell cursorPointer>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'createUserId',
      headerName: t('등록자'),
      maxWidth: 120,
      renderCell: (params) => {
        const { createUserNm } = params.row.auditInfo
        return <AdminTableCell cursorPointer>{createUserNm}</AdminTableCell>
      },
    },
    {
      field: 'createDt',
      headerName: t('등록일'),
      maxWidth: 150,
      align: 'center',
      renderCell: (params) => {
        const { createDt } = params.row.auditInfo
        return (
          <AdminTableCell
            typography={{
              color: 'gray.60',
            }}
            cursorPointer
          >
            {dayjs(createDt).format('YYYY-MM-DD')}
          </AdminTableCell>
        )
      },
    },
  ]

  return (
    <AdminSkeleton loading={isLoading} table>
      <AdminSearchFilter onSearch={search} onReset={resetFilter} disabledSearch={isSearchedState} disabledReset={isInitialState}>
        <AdminTextField
          label={t('회사명')}
          value={filter.companyNm}
          onChange={(e) => {
            updateFilter('companyNm', e.target.value)
          }}
        />
        <MIField label={t('상태')}>
          <MISelect
            value={filter.activationSts}
            onChange={(e) => {
              updateFilter('activationSts', e.target.value as string)
            }}
            options={activationStatusOptions}
          />
        </MIField>
      </AdminSearchFilter>
      <AdminTable
        getRowId={(row) => row.companyNo}
        columns={columns}
        data={data}
        isLoading={isLoading}
        size={pagination?.size}
        onSizeChange={updateSize}
        onPageChange={updatePage}
        noRowMessage={isPureState ? t('고객사를 검색하세요.') : undefined}
        maxVisibleRowCount={20}
        onRowClick={({ row }) => {
          navigate(`/admin/customer-company/companies/detail/${row.companyNo}`)
        }}
      />
      <SnackbarProvider
        maxSnack={8}
        autoHideDuration={2000}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        Components={{
          success: AdminSnackbar,
          error: AdminSnackbar,
          info: AdminSnackbar,
          warning: AdminSnackbar,
        }}
      />
    </AdminSkeleton>
  )
}

export default AdminCustomerCompanyManagementCompaniesPage
