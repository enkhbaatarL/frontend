import { SVGProps } from 'react'

/** ErrorIcon 과 동일한 하단 그림자(타원) */
const ICON_FLOOR_SHADOW_PATH =
  'M118 98.5C118 104.023 96.5097 108.5 70 108.5C43.4903 108.5 22 104.023 22 98.5C22 92.9772 43.4903 88.5 70 88.5C96.5097 88.5 118 92.9772 118 98.5Z'

/** 시계 본체(48 viewBox 기준) - ErrorIcon 과 동일한 140x141 캔버스에 배치 */
const CLOCK_BODY_PATH =
  'M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM24 40C15.18 40 8 32.82 8 24C8 15.18 15.18 8 24 8C32.82 8 40 15.18 40 24C40 32.82 32.82 40 24 40ZM25 14H22V26L32.5 32.3L34 29.84L25 24.5V14Z'

const PendingClockIcon = (svgProps: Readonly<SVGProps<SVGSVGElement>>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="140" height="141" viewBox="0 0 140 141" fill="none" aria-hidden="true" {...svgProps}>
    <path d={ICON_FLOOR_SHADOW_PATH} fill="#E9ECEF" />
    <circle cx="70" cy="58" r="34" fill="white" />
    <g transform="translate(20, 8) scale(2.083)">
      <path d={CLOCK_BODY_PATH} fill="#868E96" />
    </g>
  </svg>
)

export default PendingClockIcon
