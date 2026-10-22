import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'

import MIBaseButton from '@/components/common/button/MIBaseButton'

const FundamentalModelColumnPinButton = ({ label, pinned, onClick }: { label: string; pinned: boolean; onClick: () => void }) => (
  <MIBaseButton
    aria-label={`${label} 열 ${pinned ? '고정 해제' : '고정'}`}
    aria-pressed={pinned}
    aria-haspopup={false}
    title={`${label} 열 ${pinned ? '고정 해제' : '고정'}`}
    buttonHoverBgColor="gray.10"
    onClick={onClick}
    sx={{
      flexShrink: 0,
      width: '20px',
      minWidth: '20px',
      height: '20px',
      padding: '0',
      borderRadius: '4px',
      color: pinned ? 'commonColor.Primary' : 'gray.60',
      '& .MuiSvgIcon-root': {
        transform: pinned ? 'rotate(-45deg)' : 'rotate(0deg)',
        transition: 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      '&:hover': { color: pinned ? 'commonColor.Primary' : 'gray.80' },
      '&:hover .MuiSvgIcon-root': { transform: 'rotate(-45deg)' },
      '@media (prefers-reduced-motion: reduce)': { '& .MuiSvgIcon-root': { transition: 'none' } },
    }}
  >
    <PushPinOutlinedIcon sx={{ fontSize: '14px' }} />
  </MIBaseButton>
)

export default FundamentalModelColumnPinButton
