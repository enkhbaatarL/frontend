import { SVGProps } from 'react'

/** 시나리오 Base Case Price 범례 라인 (실선). 색상은 currentColor 상속 */
export default function BaseCaseLineIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
      <rect y="6" width="12" height="4" rx="2" fill="currentColor" />
    </svg>
  )
}
