import { ReactNode } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import Flex from '@/components/common/display/Flex'

interface Props {
  children: ReactNode
  onSearch: () => void
  onReset: () => void
}

const AdminSearchFilter = ({ children, onSearch, onReset }: Props) => {
  return (
    <Flex justify="space-between">
      <Flex className="" gap={6}>
        {children}
      </Flex>
      <Flex className="" gap={6}>
        <AdminButton onClick={onSearch}>검색</AdminButton>
        {onReset && <AdminButton onClick={onReset}>초기화</AdminButton>}
      </Flex>
    </Flex>
  )
}

export default AdminSearchFilter
