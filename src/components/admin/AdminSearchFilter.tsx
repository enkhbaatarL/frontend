import { ReactNode, KeyboardEvent } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import Flex from '@/components/common/display/Flex'
import RefreshIcon from '@/components/common/icons/RefreshIcon.tsx'
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
    <Flex className="AdminSearchFilter" align="end" justify="space-between" gap={20}>
      <Flex className="" wrap="wrap" gap={12} onKeyUp={handleKeyPress}>
        {children}
      </Flex>
      <Flex className="" gap={12}>
        <AdminButton color="primary" variant="contained" size="h32" onClick={onSearch} disabled={disabledSearch}>
          검색
        </AdminButton>
        {onReset && (
          <AdminButton
            sx={{ minWidth: 'unset', padding: '5px' }}
            size="h32"
            color="secondary"
            variant="outlined"
            onClick={onReset}
            disabled={disabledReset}
          >
            <RefreshIcon />
          </AdminButton>
        )}
      </Flex>
    </Flex>
  )
}

export default AdminSearchFilter
