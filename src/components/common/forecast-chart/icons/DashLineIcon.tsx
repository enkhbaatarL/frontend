interface DashLineIconProps {
  color?: string
}

export default function DashLineIcon({ color = '#40597A' }: DashLineIconProps) {
  return (
    <svg width="26" height="22" viewBox="0 0 26 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 8C6.38071 8 7.5 9.11929 7.5 10.5C7.5 11.8807 6.38071 13 5 13L3 13C1.61929 13 0.5 11.8807 0.5 10.5C0.5 9.11929 1.61929 8 3 8L5 8Z"
        fill={color}
      />
      <path
        d="M14 8C15.3807 8 16.5 9.11929 16.5 10.5C16.5 11.8807 15.3807 13 14 13L12 13C10.6193 13 9.5 11.8807 9.5 10.5C9.5 9.11929 10.6193 8 12 8L14 8Z"
        fill={color}
      />
      <path
        d="M23 8C24.3807 8 25.5 9.11929 25.5 10.5C25.5 11.8807 24.3807 13 23 13L21 13C19.6193 13 18.5 11.8807 18.5 10.5C18.5 9.11929 19.6193 8 21 8L23 8Z"
        fill={color}
      />
    </svg>
  )
}
