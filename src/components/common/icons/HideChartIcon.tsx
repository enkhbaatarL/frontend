import { SvgIcon, SvgIconProps } from '@mui/material'

const PATH_D =
  'M7.31309 8.47088C7.63809 8.14588 8.16387 8.14588 8.48887 8.47088L11.2301 11.2131L11.6139 10.7804L12.7965 11.964L11.8219 13.0627C11.5053 13.4209 10.9555 13.4374 10.6139 13.0959L7.90488 10.3879L3.48887 14.8039C3.1722 15.1289 2.63809 15.1289 2.31309 14.8039L2.23887 14.7297C1.91387 14.4047 1.91387 13.8789 2.23887 13.5539L7.31309 8.47088ZM16.5553 5.22967C16.8718 4.87146 17.4299 4.8625 17.7633 5.19549C18.0716 5.51215 18.0882 6.01307 17.7965 6.33807L15.0143 9.46795L13.8336 8.28728L16.5553 5.22967Z'

interface HideChartIconProps extends SvgIconProps {
  iconColor?: string
}

export default function HideChartIcon({ iconColor, color: colorProp, sx, ...props }: HideChartIconProps) {
  const resolvedColor =
    iconColor ?? colorProp ?? (typeof sx === 'object' && sx && 'color' in sx ? (sx.color as string) : undefined) ?? 'currentColor'

  return (
    <SvgIcon {...props} viewBox="0 0 20 20" sx={sx}>
      <path d={PATH_D} fill={resolvedColor} />
      <line x1="7.01152" y1="5" x2="17.4997" y2="15.4882" stroke={resolvedColor} strokeWidth="1.66667" strokeLinecap="round" />
    </SvgIcon>
  )
}
