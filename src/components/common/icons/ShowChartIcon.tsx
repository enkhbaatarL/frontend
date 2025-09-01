import { SVGProps } from 'react'

export default function ShowChartIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
      <path
        d="M3.48789 14.8044L7.90456 10.3877L10.6129 13.0961C10.9546 13.4377 11.5046 13.4211 11.8212 13.0627L17.7962 6.33774C18.0879 6.01274 18.0712 5.51274 17.7629 5.19607C17.4296 4.86274 16.8712 4.87107 16.5546 5.2294L11.2296 11.2127L8.48789 8.47107C8.16289 8.14607 7.63789 8.14607 7.31289 8.47107L2.23789 13.5544C1.91289 13.8794 1.91289 14.4044 2.23789 14.7294L2.31289 14.8044C2.63789 15.1294 3.17122 15.1294 3.48789 14.8044Z"
        fill="currentColor"
      />
    </svg>
  )
}
