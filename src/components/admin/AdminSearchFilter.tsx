import { t } from 'i18next'
import { ReactNode, KeyboardEvent } from 'react'

import MIButton from '@/components/common/button/MIButton'
import Flex from '@/components/common/display/Flex'
import RefreshIcon from '@/components/common/icons/RefreshIcon'
interface Props {
  children: ReactNode
  onSearch: () => void
  onReset: () => void
  disabledSearch?: boolean
  disabledReset?: boolean
}

const AdminSearchFilter = ({ children, onSearch, onReset, disabledSearch, disabledReset }: Props) => {
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !disabledSearch) {
      onSearch()
    }
  }

  return (
    <Flex className="AdminSearchFilter" align="end" justify="space-between" gap={20}>
      <Flex className="AdminSearchFilterField" align="center" wrap="wrap" fullWidth gap={12} onKeyUp={handleKeyPress}>
        {children}
      </Flex>
      <Flex className="AdminSearchFilterButton" gap={12}>
        <MIButton color="primary" size="h34" onClick={onSearch} disabled={disabledSearch}>
          {t('검색')}
        </MIButton>
        {onReset && (
          <MIButton
            size="h34"
            color="gray"
            type="outlined"
            contentType={'icon'}
            startIcon={<RefreshIcon />}
            onClick={onReset}
            disabled={disabledReset}
          />
        )}
      </Flex>
    </Flex>
  )
}

export default AdminSearchFilter
