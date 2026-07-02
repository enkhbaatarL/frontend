import { SVGProps } from 'react'

export type MiAgentSpinnerIconTone = 'mari' | 'gray'

const SPINNER_COLORS: Record<MiAgentSpinnerIconTone, string> = {
  mari: '#364FC7',
  gray: '#667085',
}

const SPINNER_ARC_SEGMENTS = [
  { offset: 0, opacity: 0.03 },
  { offset: -4.2, opacity: 0.06 },
  { offset: -8.4, opacity: 0.1 },
  { offset: -12.6, opacity: 0.16 },
  { offset: -16.8, opacity: 0.24 },
  { offset: -21, opacity: 0.34 },
  { offset: -25.2, opacity: 0.46 },
  { offset: -29.4, opacity: 0.58 },
  { offset: -33.6, opacity: 0.7 },
  { offset: -37.8, opacity: 0.82 },
  { offset: -42, opacity: 0.92 },
  { offset: -46.2, opacity: 1 },
  { offset: -50.4, opacity: 1 },
  { offset: -54.6, opacity: 1 },
  { offset: -58.8, opacity: 1 },
  { offset: -63, opacity: 1 },
]

interface MiAgentSpinnerIconProps extends Readonly<SVGProps<SVGSVGElement>> {
  tone?: MiAgentSpinnerIconTone
}

export default function MiAgentSpinnerIcon({ tone = 'mari', ...svgProps }: MiAgentSpinnerIconProps) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
      {SPINNER_ARC_SEGMENTS.map(({ offset, opacity }) => (
        <circle
          key={offset}
          cx="16"
          cy="16"
          r="9"
          stroke={SPINNER_COLORS[tone]}
          strokeWidth="2.6"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="5.2 100"
          strokeDashoffset={offset}
          opacity={opacity}
          transform="rotate(-140 16 16)"
        />
      ))}
    </svg>
  )
}
