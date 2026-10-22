import { Typography } from '@mui/material'

import MoreVertIcon from '@/components/common/icons/MoreVertIcon'
import MIDropdownMenu from '@/components/common/menu/MIDropdownMenu'

interface FundamentalModelRowMenuProps {
  rowNumber: number
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
  onInsertAbove?: () => void
  onInsertBelow?: () => void
  onDelete?: () => void
}

const FundamentalModelRowMenu = ({
  rowNumber,
  open,
  onOpenChange,
  disabled,
  onInsertAbove,
  onInsertBelow,
  onDelete,
}: FundamentalModelRowMenuProps) => (
  <MIDropdownMenu
    label={<MoreVertIcon width="18px" height="18px" color="#868E96" />}
    aria-label={`${rowNumber}행 더보기`}
    placement="bottom-end"
    open={open}
    onOpenChange={onOpenChange}
    disabled={disabled}
    zIndex={1500}
    paperProps={{ sx: { minWidth: '168px' } }}
    groupDisplayType="divider"
    items={[
      ...(onInsertAbove ? [{ label: '위에 행 삽입', group: 'insert', action: onInsertAbove }] : []),
      ...(onInsertBelow ? [{ label: '아래에 행 삽입', group: 'insert', action: onInsertBelow }] : []),
      ...(onDelete
        ? [
          {
            label: (
              <Typography component="span" variant="body2M14" color="contentText.Error">
                  행 삭제
              </Typography>
            ),
            group: 'delete',
            action: onDelete,
          },
        ]
        : []),
    ]}
    sx={{ width: '36px', minWidth: '36px', height: '36px', padding: '0' }}
  />
)

export default FundamentalModelRowMenu
