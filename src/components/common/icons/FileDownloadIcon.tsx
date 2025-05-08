import { SVGProps } from 'react'

export default function FileDownloadIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
      <g clipPath="url(#clip0_2565_10293)">
        <path
          d="M14.9997 12.5007V15.0007H4.99967V12.5007H3.33301V15.0007C3.33301 15.9173 4.08301 16.6673 4.99967 16.6673H14.9997C15.9163 16.6673 16.6663 15.9173 16.6663 15.0007V12.5007H14.9997ZM14.1663 9.16732L12.9913 7.99232L10.833 10.1423V3.33398H9.16634V10.1423L7.00801 7.99232L5.83301 9.16732L9.99967 13.334L14.1663 9.16732Z"
          fill="#868E96"
        />
      </g>
      <defs>
        <clipPath id="clip0_2565_10293">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
