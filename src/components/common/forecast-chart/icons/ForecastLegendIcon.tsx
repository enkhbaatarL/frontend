interface ForecastLegendIconProps {
  color?: string
}

export default function ForecastLegendIcon({ color = '#40597A' }: ForecastLegendIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M2.44434 11L19.5554 11" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
    </svg>
  )
}
