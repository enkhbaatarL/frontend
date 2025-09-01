import { SVGProps } from 'react'

export default function EmailIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
      <path
        d="M9 0H1C0.45 0 0.005 0.45 0.005 1L0 7C0 7.55 0.45 8 1 8H9C9.55 8 10 7.55 10 7V1C10 0.45 9.55 0 9 0ZM8.8 2.125L5.265 4.335C5.105 4.435 4.895 4.435 4.735 4.335L1.2 2.125C1.075 2.045 1 1.91 1 1.765C1 1.43 1.365 1.23 1.65 1.405L5 3.5L8.35 1.405C8.635 1.23 9 1.43 9 1.765C9 1.91 8.925 2.045 8.8 2.125Z"
        fill="currentColor"
      />
    </svg>
  )
}
