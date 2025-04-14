import { SVGProps } from 'react'

const ArrowRight = (svgProps: Readonly<SVGProps<SVGSVGElement>>) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
    <path
      d="M7.49961 13.2292L10.7329 9.99583L7.49961 6.7625C7.17461 6.4375 7.17461 5.9125 7.49961 5.5875C7.82461 5.2625 8.34961 5.2625 8.67461 5.5875L12.4996 9.4125C12.8246 9.7375 12.8246 10.2625 12.4996 10.5875L8.67461 14.4125C8.34961 14.7375 7.82461 14.7375 7.49961 14.4125C7.18294 14.0875 7.17461 13.5542 7.49961 13.2292Z"
      fill="#868E96"
    />
  </svg>
)

export default ArrowRight
