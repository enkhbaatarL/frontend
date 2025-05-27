import { SVGProps } from 'react'

const ArrowLeft = ({ ownerState, ...svgProps }: Readonly<SVGProps<SVGSVGElement> & { ownerState?: unknown }>) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
    <path
      d="M12.4996 13.2292L9.26628 9.99583L12.4996 6.7625C12.8246 6.4375 12.8246 5.9125 12.4996 5.5875C12.1746 5.2625 11.6496 5.2625 11.3246 5.5875L7.49961 9.4125C7.17461 9.7375 7.17461 10.2625 7.49961 10.5875L11.3246 14.4125C11.6496 14.7375 12.1746 14.7375 12.4996 14.4125C12.8163 14.0875 12.8246 13.5542 12.4996 13.2292Z"
      fill="#868E96"
    />
  </svg>
)

export default ArrowLeft
