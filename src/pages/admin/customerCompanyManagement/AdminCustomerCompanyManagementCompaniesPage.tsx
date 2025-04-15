import ErrorIcon from '@mui/icons-material/Error'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { SnackbarProvider } from 'notistack'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminSnackbar from '@/components/admin/AdminSnackbar'
import AdminTable, { AdminTableCell } from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
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
  const { showSnackbar } = useSnackbar()
  const { setCustomComponent } = useAdminHeader()

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
      headerName: '회사명',
      minWidth: 150,
      flex: 1,
      renderCell(params) {
        return <AdminTableCell typography={{ variant: 'tableBody1' }}>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'isActivated',
      headerName: '상태',
      width: 120,
      align: 'center',
      renderCell: (params) => (
        <AdminTableCell
          type="chip"
          chip={{
            color: params.value ? 'blue' : 'white',
          }}
        >
          {params.value ? '활성' : '비활성'}
        </AdminTableCell>
      ),
    },
    {
      field: 'companyCd',
      headerName: '회사 코드',
      width: 120,
      align: 'center',
      renderCell(params) {
        return <AdminTableCell>{params.value}</AdminTableCell>
      },
    },
    {
      field: 'createUserId',
      headerName: '등록자',
      width: 120,
      renderCell: (params) => {
        const { createUserNm } = params.row.auditInfo
        return <AdminTableCell>{createUserNm}</AdminTableCell>
      },
    },
    {
      field: 'createDt',
      headerName: '등록일',
      width: 150,
      align: 'center',
      renderCell: (params) => {
        const { createDt } = params.row.auditInfo
        return (
          <AdminTableCell
            typography={{
              color: 'gray.60',
            }}
          >
            {dayjs(createDt).format('YYYY-MM-DD')}
          </AdminTableCell>
        )
      },
    },
  ]

  const [isOpenDetail, setIsOpenDetail] = useState(false)
  const [isOpenDelete, setIsOpenDelete] = useState(false)

  return (
    <>
      <AdminSearchFilter onSearch={search} onReset={resetFilter} disabledSearch={isSearchedState} disabledReset={isInitialState}>
        <AdminTextField
          label={t('회사명')}
          value={filter.companyNm}
          onChange={(e) => {
            updateFilter('companyNm', e.target.value as string)
          }}
        />
        <AdminSelect
          label={t('상태')}
          value={filter.activationSts}
          onChange={(e) => {
            updateFilter('activationSts', e.target.value as string)
          }}
          options={activationStatusOptions}
        ></AdminSelect>
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
      />
      <AdminConfirm
        open={isOpenDetail}
        title="회원 상세"
        justifyContentAction="space-between"
        width={450}
        handleClose={() => setIsOpenDetail(false)}
        actions={[
          { label: '취소', variant: 'outlined', color: 'secondary', onClick: () => setIsOpenDelete(true) },
          { label: '확인', variant: 'contained', color: 'primary', onClick: () => setIsOpenDetail(false) },
        ]}
      >
        <div>
          <table>
            <tr>
              <td>회사명</td>
              <td>SK실트론</td>
            </tr>
            <tr>
              <td>소속</td>
              <td>AI Market Intelligence팀</td>
            </tr>
            <tr>
              <td>직위/직함</td>
              <td>Manager</td>
            </tr>
            <tr>
              <td>이름</td>
              <td>홍길동</td>
            </tr>
            <tr>
              <td>이메일</td>
              <td>gildong.hone@sk.com</td>
            </tr>
          </table>
        </div>
      </AdminConfirm>
      <AdminConfirm
        open={isOpenDelete}
        title={
          <>
            <ErrorIcon color="error" fontSize="small" sx={{ marginRight: '12px', verticalAlign: 'sub' }} />
            회원을 삭제하시겠습니까?
          </>
        }
        width={450}
        handleClose={() => setIsOpenDelete(false)}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => {
              setIsOpenDelete(false)
              setIsOpenDetail(false)
              showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' })
            },
          },
          {
            label: 'Button',
            variant: 'contained',
            color: 'primary',
            onClick: () => {
              setIsOpenDelete(false)
              setIsOpenDetail(false)
              showSnackbar('삭제되었습니다. ', { variant: 'success' })
            },
          },
        ]}
      >
        회원 정보 삭제 시 해당 회원은 서비스에 접근이 불가합니다.
      </AdminConfirm>
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
    </>
  )
}

export default AdminCustomerCompanyManagementCompaniesPage
