import { SVGProps } from 'react'

export default function HistoryIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" {...svgProps}>
      <g clipPath="url(#clip0_3874_132298)">
        <path
          d="M17.5 2.5H2.50004C1.58337 2.5 0.833374 3.23333 0.833374 4.15V15.8333C0.833374 16.75 1.58337 17.5 2.50004 17.5H17.5C18.4167 17.5 19.1667 16.75 19.1667 15.8333V4.15C19.1667 3.23333 18.4167 2.5 17.5 2.5ZM17.5 15.85H2.50004V4.14167H17.5V15.85Z"
          fill="currentColor"
        />
        <rect x="7.5" y="3.33337" width="1.66667" height="13.3333" fill="currentColor" />
        <rect x="3.83337" y="6.66663" width="2.5" height="1.66667" rx="0.833333" fill="currentColor" />
        <rect x="3.83337" y="9.16663" width="2.5" height="1.66667" rx="0.833333" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="clip0_3874_132298">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
