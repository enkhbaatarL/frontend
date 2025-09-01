import { SVGProps } from 'react'

export default function FailIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
      <path
        d="M5 0C2.24 0 0 2.24 0 5C0 7.76 2.24 10 5 10C7.76 10 10 7.76 10 5C10 2.24 7.76 0 5 0ZM5 5.5C4.725 5.5 4.5 5.275 4.5 5V3C4.5 2.725 4.725 2.5 5 2.5C5.275 2.5 5.5 2.725 5.5 3V5C5.5 5.275 5.275 5.5 5 5.5ZM5.5 7.5H4.5V6.5H5.5V7.5Z"
        fill="currentColor"
      />
    </svg>
  )
}
