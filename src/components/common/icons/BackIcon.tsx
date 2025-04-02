import { SVGProps } from 'react'

export default function BackIcon(svgProps: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" {...svgProps}>
      <path
        d="M14.21 2.40391C13.8017 1.99557 13.1433 1.99557 12.735 2.40391L5.72666 9.41224C5.40166 9.73724 5.40166 10.2622 5.72666 10.5872L12.735 17.5956C13.1433 18.0039 13.8017 18.0039 14.21 17.5956C14.6183 17.1872 14.6183 16.5289 14.21 16.1206L8.09333 10.0039L14.2183 3.87891C14.6183 3.47057 14.6183 2.81224 14.21 2.40391Z"
        fill="#868E96"
      />
    </svg>
  )
}
