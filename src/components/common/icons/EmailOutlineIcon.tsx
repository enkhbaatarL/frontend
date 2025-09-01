import { SVGProps } from 'react'

export default function EmailOutlineIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" {...svgProps}>
      <path
        d="M12.8327 3.50004C12.8327 2.85837 12.3077 2.33337 11.666 2.33337H2.33268C1.69102 2.33337 1.16602 2.85837 1.16602 3.50004V10.5C1.16602 11.1417 1.69102 11.6667 2.33268 11.6667H11.666C12.3077 11.6667 12.8327 11.1417 12.8327 10.5V3.50004ZM11.666 3.50004L6.99935 6.41671L2.33268 3.50004H11.666ZM11.666 10.5H2.33268V4.66671L6.99935 7.58337L11.666 4.66671V10.5Z"
        fill="#ADB5BD"
      />
    </svg>
  )
}
