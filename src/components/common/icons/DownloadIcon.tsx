import { SVGProps } from 'react'

const DownloadIcon = (svgProps: Readonly<SVGProps<SVGSVGElement>>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" {...svgProps}>
    <path
      d="M8.295 4.75H7.5V2.25C7.5 1.975 7.275 1.75 7 1.75H5C4.725 1.75 4.5 1.975 4.5 2.25V4.75H3.705C3.26 4.75 3.035 5.29 3.35 5.605L5.645 7.9C5.84 8.095 6.155 8.095 6.35 7.9L8.645 5.605C8.96 5.29 8.74 4.75 8.295 4.75ZM2.5 9.75C2.5 10.025 2.725 10.25 3 10.25H9C9.275 10.25 9.5 10.025 9.5 9.75C9.5 9.475 9.275 9.25 9 9.25H3C2.725 9.25 2.5 9.475 2.5 9.75Z"
      fill="#868E96"
    />
  </svg>
)

export default DownloadIcon
