import { MoreVert } from '@mui/icons-material'
import { IconButton, MenuItem } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'

import AdminButton from '@/components/admin/AdminButton.tsx'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminSelect from '@/components/admin/AdminSelect.tsx'
import AdminTable from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import companiesService from '@/service/admin/companies.ts'

const AdminCustomerCompanyManagementCompaniesPageHeader = () => {
  return (
    <Flex gap={4}>
      <AdminButton
        variant="contained"
        color="primary"
        size="small"
        onClick={() => {
          console.log('고객사 등록')
        }}
      >
        {t('고객사 등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminCustomerCompanyManagementCompaniesPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const [searchFilter, setSearchFilter] = useState({
    companyNm: '',
    status: 'all',
  })
  const [paginationFilter] = useState({
    page: 1,
    size: 10,
  })

  const filter = useMemo(() => {
    return {
      ...searchFilter,
      ...paginationFilter,
      companyNm: searchFilter.companyNm === '' ? undefined : searchFilter.companyNm,
      status: searchFilter.status === 'all' ? undefined : searchFilter.status,
    }
  }, [searchFilter, paginationFilter])

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
      <AdminTable getRowId={(row) => row.companyCd} columns={columns} rows={data?.detail ?? []} />
    </>
  )
}

export default AdminCustomerCompanyManagementCompaniesPage
