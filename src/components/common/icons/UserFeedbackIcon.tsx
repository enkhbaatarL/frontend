import { SVGProps } from 'react'

const UserFeedbackIcon = (svgProps: Readonly<SVGProps<SVGSVGElement>>) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.125 0H0.875C0.391344 0 0 0.391344 0 0.875V9.625C0 10.1087 0.391344 10.5 0.875 10.5H2.625V13.125C2.625 13.4787 2.83784 13.7983 3.16509 13.9333C3.27359 13.9786 3.38713 14 3.5 14C3.72728 14 3.95106 13.9112 4.11862 13.7436L7.36225 10.5H13.125C13.6087 10.5 14 10.1087 14 9.625V0.875C14 0.391344 13.6087 0 13.125 0Z"
      fill="currentColor"
    />
  </svg>
)

export default UserFeedbackIcon
