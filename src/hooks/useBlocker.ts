import { isEqual } from 'lodash-es'
import { useBlocker as useOriginBlocker } from 'react-router-dom'

interface BlockerProps {
  onSave?: () => Promise<boolean>
}

/**
 * react-router-dom 범위 내에 route 변경 감지
 */
const useBlocker = ({ onSave }: BlockerProps = {}) => {
  const blocker = useOriginBlocker(({ currentLocation: curr, nextLocation: next, historyAction }) => {
    if (isEqual(curr.pathname, next.pathname)) return false
    if (historyAction === 'POP') return false
    onSave?.()
    return false
  })

  return { blocker }
}

export default useBlocker
