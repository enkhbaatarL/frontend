import { Button } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminTable from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import sampleService from '@/service/sampleService.ts'

const CustomHeaderSample = () => {
  const { i18n } = useTranslation()

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng)
  }

  return (
    <Flex gap={4}>
      <div>{i18n.language}</div>
      <Button
        variant="contained"
        color="secondary"
        size="small"
        onClick={() => {
          changeLanguage('ko')
        }}
      >
        {t('ko')}
      </Button>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => {
          changeLanguage('en')
        }}
      >
        {t('en')}
      </Button>
    </Flex>
  )
}

const AdminCustomerCompanyManagementCompaniesPage = () => {
  const { setCustomComponent } = useAdminHeader()
  const [size, setSize] = useState('')

  useEffect(() => {
    setCustomComponent(<CustomHeaderSample />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  const columns: GridColDef[] = [
    { field: 'companyName', headerName: '회사 이름', width: 200, align: 'center' },
    { field: 'companyEngName', headerName: '회사 영문 이름', width: 200, align: 'center' },
    { field: 'createUserId', headerName: '생성자 ID', width: 150, align: 'right' },
    { field: 'createDt', headerName: '생성 날짜', width: 150, align: 'right' },
    { field: 'modifyUserId', headerName: '수정자 ID', width: 150, align: 'right' },
    { field: 'modifyDt', headerName: '수정 날짜', width: 150, align: 'right' },
  ]

  const { data, refetch } = useQuery({
    queryKey: ['search', size],
    queryFn: async () => await sampleService.getSampleCompanies(size),
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
        <AdminTextField value={size} onChange={(e) => setSize(e.target.value)} />
      </AdminSearchFilter>
      <AdminTable columns={columns} data={data ?? []} />
    </>
  )
}

export default AdminCustomerCompanyManagementCompaniesPage
