import { SVGProps } from 'react'

export default function CheckIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" {...svgProps}>
      <path
        d="M7.32922 13.2292L4.43755 10.3375C4.11255 10.0125 3.58755 10.0125 3.26255 10.3375C2.93755 10.6625 2.93755 11.1875 3.26255 11.5125L6.74588 14.9959C7.07088 15.3209 7.59588 15.3209 7.92088 14.9959L16.7376 6.17919C17.0626 5.85419 17.0626 5.32919 16.7376 5.00419C16.4126 4.67919 15.8875 4.67919 15.5625 5.00419L7.32922 13.2292Z"
        fill="#364FC7"
      />
    </svg>
  )
}
