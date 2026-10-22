import MIBaseButton from '@/components/common/button/MIBaseButton'
import AddIcon from '@/components/common/icons/AddIcon'

interface Props {
  disabled?: boolean
  onClick: () => void
}

const FundamentalModelAddColumnButton = ({ disabled, onClick }: Props) => (
  <MIBaseButton
    variant="outlined"
    aria-label="마지막 열 오른쪽에 열 추가"
    disabled={disabled}
    onClick={onClick}
    sx={{ width: '24px', minWidth: '24px', height: '24px', padding: '0', borderRadius: '4px' }}
  >
    <AddIcon width="18px" height="18px" color="#868E96" />
  </MIBaseButton>
)

export default FundamentalModelAddColumnButton
