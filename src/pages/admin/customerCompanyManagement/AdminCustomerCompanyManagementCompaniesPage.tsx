import { MoreVert } from '@mui/icons-material'
import ErrorIcon from '@mui/icons-material/Error'
import { IconButton, MenuItem } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { SnackbarProvider } from 'notistack'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminConfirm from '@/components/admin/AdminConfirm.tsx'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSelect from '@/components/admin/AdminSelect'
import AdminSnackbar from '@/components/admin/AdminSnackbar.tsx'
import AdminTable from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService from '@/service/admin/companies'

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
  const [searchFilter, setSearchFilter] = useState({
    companyNm: '',
    status: 'all',
  })
  const [paginationFilter] = useState({
    page: 1,
    size: 10,
  })

  const filter = useMemo(
    () => ({
      ...searchFilter,
      ...paginationFilter,
      companyNm: searchFilter.companyNm === '' ? undefined : searchFilter.companyNm,
      status: searchFilter.status === 'all' ? undefined : searchFilter.status,
    }),
    [searchFilter, paginationFilter],
  )

  useEffect(() => {
    setCustomComponent(<AdminCustomerCompanyManagementCompaniesPageHeader />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  const columns: GridColDef[] = [
    { field: 'companyNm', headerName: '회사명', minWidth: 150, flex: 1 },
    { field: 'companyNo', headerName: '상태', width: 120, align: 'center' },
    { field: 'companyCd', headerName: '회사 코드', width: 120, align: 'center' },
    { field: 'createUserId', headerName: '등록자', width: 120 },
    {
      field: 'createDt',
      headerName: '등록일',
      width: 150,
      align: 'center',
      valueFormatter: ({ value }) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      field: 'menu',
      headerName: '',
      width: 52,
      align: 'center',
      renderCell: (param) => (
        <IconButton onClick={() => console.log(param)}>
          <MoreVert />
        </IconButton>
      ),
    },
  ]

  const { data, refetch } = useQuery({
    queryKey: [filter],
    queryFn: async () => await companiesService.getCompanies(filter),
    enabled: false,
  })

  const onSearch = async () => {
    await refetch()
  }

  const [isOpenDetail, setIsOpenDetail] = useState(false)
  const [isOpenDelete, setIsOpenDelete] = useState(false)

  return (
    <>
      <AdminSearchFilter
        onSearch={onSearch}
        onReset={() => {
          console.log('onReset')
        }}
      >
        <AdminTextField
          label={t('회사명')}
          value={searchFilter.companyNm}
          onChange={(e) => {
            setSearchFilter({ ...searchFilter, companyNm: e.target.value })
          }}
        />
        <AdminSelect
          label={t('상태')}
          value={searchFilter.status}
          onChange={(e) => {
            setSearchFilter({ ...searchFilter, status: String(e.target.value) })
          }}
        >
          <MenuItem value={'all'}>{t('전체')}</MenuItem>
          <MenuItem value={'Active'}>{t('Active')}</MenuItem>
          <MenuItem value={'Inactive'}>{t('Inactive')}</MenuItem>
        </AdminSelect>
      </AdminSearchFilter>
      <div className="">
        <AdminButton color="primary" variant="contained" onClick={() => setIsOpenDetail(true)}>
          Show popup Detail
        </AdminButton>
      </div>
      <AdminTable getRowId={(row) => row.companyCd} columns={columns} rows={data?.detail ?? []} />
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
