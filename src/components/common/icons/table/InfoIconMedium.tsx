import { SVGProps } from 'react'

export default function InfoIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
      <path
        d="M5.995 1C3.235 1 1 3.24 1 6C1 8.76 3.235 11 5.995 11C8.76 11 11 8.76 11 6C11 3.24 8.76 1 5.995 1ZM6 10C3.79 10 2 8.21 2 6C2 3.79 3.79 2 6 2C8.21 2 10 3.79 10 6C10 8.21 8.21 10 6 10Z"
        fill="currentColor"
      />
      <path
        d="M5.5 8C5.5 8.275 5.725 8.5 6 8.5C6.275 8.5 6.5 8.275 6.5 8V6C6.5 5.725 6.275 5.5 6 5.5C5.725 5.5 5.5 5.725 5.5 6V8Z"
        fill="currentColor"
      />
      <path d="M5.5 4.5H6.5V3.5H5.5V4.5Z" fill="currentColor" />
    </svg>
  )
}
