import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Tooltip, TooltipProps } from '@mui/material'

interface InfoTooltipProps extends Omit<TooltipProps, 'children'> {
  offset?: [number, number]
  iconSize?: number
  iconColor?: string
}

const InfoTooltip = ({
  title,
  placement = 'top-start',
  offset = [-22, -8],
  iconSize = 20,
  iconColor = '#868E96',
  ...props
}: InfoTooltipProps) => (
  <Tooltip
    title={title}
    placement={placement}
    slotProps={{
      popper: {
        modifiers: [
          {
            name: 'offset',
            options: {
              offset,
            },
          },
        ],
      },
    }}
    {...props}
  >
    <InfoOutlinedIcon sx={{ fontSize: iconSize, color: iconColor }} />
  </Tooltip>
)

export default InfoTooltip
