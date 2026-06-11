import { SVGProps } from 'react'

export default function DocumentIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
      <path
        d="M6 13.0017C6 9.2305 6 7.34489 7.17157 6.17331C8.34315 5.00174 10.2288 5.00174 14 5.00174H16C19.7712 5.00174 21.6569 5.00174 22.8284 6.17331C24 7.34489 24 9.2305 24 13.0017V17.0017C24 20.7729 24 22.6586 22.8284 23.8301C21.6569 25.0017 19.7712 25.0017 16 25.0017H14C10.2288 25.0017 8.34315 25.0017 7.17157 23.8301C6 22.6586 6 20.7729 6 17.0017V13.0017Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M11 13.0017H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 17.0017H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
