import { Typography } from '@mui/material'

import MoreVertIcon from '@/components/common/icons/MoreVertIcon'
import MIDropdownMenu from '@/components/common/menu/MIDropdownMenu'

interface Props {
  label: string
  disabled?: boolean
  onDelete: () => void
}

const FundamentalModelColumnMenu = ({ label, disabled, onDelete }: Props) => (
  <MIDropdownMenu
    label={<MoreVertIcon width="16px" height="16px" />}
    aria-label={`${label} 열 더보기`}
    placement="bottom-end"
    disabled={disabled}
    zIndex={1500}
    buttonHoverBgColor="gray.10"
    paperProps={{ sx: { minWidth: '168px' } }}
    items={[
      {
        label: (
          <Typography component="span" variant="body2M14" color="contentText.Error">
            열 삭제
          </Typography>
        ),
        action: onDelete,
      },
    ]}
    sx={{ width: '16px', minWidth: '16px', height: '20px', padding: '0', borderRadius: '4px', color: 'gray.60' }}
  />
)

export default FundamentalModelColumnMenu
