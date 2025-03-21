import { ReactNode, KeyboardEvent } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import Flex from '@/components/common/display/Flex'

interface Props {
  children: ReactNode
  onSearch: () => void
  onReset: () => void
  disabledSearch?: boolean
  disabledReset?: boolean
}

const AdminSearchFilter = ({ children, onSearch, onReset, disabledSearch, disabledReset }: Props) => {
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearch()
    }
  }

  return (
    <Flex justify="space-between" fullWidth>
      <Flex className="" gap={6} onKeyUp={handleKeyPress}>
        {children}
      </Flex>
      <Flex className="" gap={6}>
        <AdminButton onClick={onSearch} disabled={disabledSearch}>
          검색
        </AdminButton>
        {onReset && (
          <AdminButton onClick={onReset} disabled={disabledReset}>
            초기화
          </AdminButton>
        )}
      </Flex>
    </Flex>
  )
}

export default AdminSearchFilter
