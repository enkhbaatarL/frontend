import { SVGProps } from 'react'

/** 시나리오 User Adjusted Price 범례 라인 (점선, 3-dot). 색상은 currentColor 상속 */
export default function AdjustedLineIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
      <rect y="6" width="3" height="4" rx="1.5" fill="currentColor" />
      <rect x="4.5" y="6" width="3" height="4" rx="1.5" fill="currentColor" />
      <rect x="9" y="6" width="3" height="4" rx="1.5" fill="currentColor" />
    </svg>
  )
}
