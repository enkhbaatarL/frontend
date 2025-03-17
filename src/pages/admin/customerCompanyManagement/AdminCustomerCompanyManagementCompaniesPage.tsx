import { Button } from '@mui/material'
import { t } from 'i18next'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminTable from '@/components/admin/AdminTable'
import AdminTextField from '@/components/admin/AdminTextField'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'

const CustomHeaderSample = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
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

  useEffect(() => {
    setCustomComponent(<CustomHeaderSample />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'companyName', headerName: 'Company Name', width: 200 },
    { field: 'contact', headerName: 'Contact', width: 150 },
    { field: 'email', headerName: 'Email', width: 250 },
  ]

  const data = [
    { id: 1, companyName: 'ABC Corp', contact: '010-1234-5678', email: 'contact@abccorp.com' },
    { id: 2, companyName: 'XYZ Ltd', contact: '010-8765-4321', email: 'info@xyzltd.com' },
    { id: 3, companyName: 'Sample Inc', contact: '010-1111-2222', email: 'hello@sampleinc.com' },
  ]

  return (
    <>
      <AdminSearchFilter
        onSearch={() => {
          console.log('onSearch')
        }}
        onReset={() => {
          console.log('onReset')
        }}
      >
        <AdminTextField />
      </AdminSearchFilter>
      <AdminTable columns={columns} data={data} />
    </>
  )
}

export default AdminCustomerCompanyManagementCompaniesPage
