interface SolidLineIconProps {
  color?: string
}

export default function SolidLineIcon({ color = '#40597A' }: SolidLineIconProps) {
  return (
    <svg width="26" height="22" viewBox="0 0 26 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 11C0 9.34315 1.34315 8 3 8H23C24.6569 8 26 9.34315 26 11C26 12.6569 24.6569 14 23 14H3C1.34315 14 0 12.6569 0 11Z"
        fill={color}
      />
    </svg>
  )
}
