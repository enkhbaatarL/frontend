import { t } from 'i18next'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminSearchFilter from '@/components/admin/AdminSearchFilter'
import AdminTable from '@/components/admin/AdminTable'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'

const Header = ({ onDelete, onEdit }: { onDelete: () => void; onEdit: () => void }) => {
  const navigate = useNavigate()

  return (
    <Flex gap={10}>
      <AdminButton variant="outlined" color="secondary" size="h34" onClick={onDelete}>
        {t('삭제')}
      </AdminButton>
      <AdminButton color="primary" variant="contained" size="h34" onClick={onEdit}>
        {t('수정')}
      </AdminButton>
      <AdminButton variant="contained" color="primary" size="h34" onClick={() => navigate('')}>
        {t('등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminPageTemplate = () => {
  const { showSnackbar } = useSnackbar()
  const { setCustomComponent } = useAdminHeader()

  useEffect(() => {
    setCustomComponent(
      <Header
        onEdit={() => {
          showSnackbar(t('수정되었습니다.'), { variant: 'success' })
        }}
        onDelete={() => {
          showSnackbar(t('삭제되었습니다.'), { variant: 'success' })
        }}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent, showSnackbar])

  return (
    <>
      <AdminSearchFilter onSearch={() => {}} onReset={() => {}}>
        <>{/* 검색 필터*/}</>
      </AdminSearchFilter>
      <AdminTable columns={[]} />
    </>
  )
}

export default AdminPageTemplate
