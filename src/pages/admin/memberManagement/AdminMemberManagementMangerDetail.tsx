import { t } from 'i18next'
import { useEffect } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'

const AdminMemberManagementMangerDetailPageHeader = ({ onDelete, onEdit }: { onDelete: () => void; onEdit: () => void }) => (
  <Flex gap={4}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={onDelete}>
      {t('삭제')}
    </AdminButton>
    <AdminButton color="primary" variant="contained" size="h34" onClick={onEdit}>
      {t('수정')}
    </AdminButton>
  </Flex>
)

export default function AdminMemberManagementMangerDetail() {
  const { setCustomComponent } = useAdminHeader()

  useEffect(() => {
    setCustomComponent(<AdminMemberManagementMangerDetailPageHeader onDelete={() => {}} onEdit={() => {}} />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return null
}
