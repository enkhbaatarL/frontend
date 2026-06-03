import { Box, GlobalStyles, type BoxProps } from '@mui/material'

import type { ReactNode } from 'react'

const DEFAULT_ROTATING_GRADIENT_COLORS = ['#0097E8', '#0066FF', '#7B47FF', '#2A31BF'] as const

const DEFAULT_ROTATING_GRADIENT_IMAGE =
  'radial-gradient(circle at center, rgba(0, 151, 232, 0.95) 0%, rgba(0, 151, 232, 0.54) 24%, rgba(0, 151, 232, 0) 58%), radial-gradient(circle at center, rgba(123, 71, 255, 0.9) 0%, rgba(123, 71, 255, 0.48) 28%, rgba(123, 71, 255, 0) 62%), radial-gradient(circle at center, rgba(0, 102, 255, 0.76) 0%, rgba(0, 102, 255, 0.34) 24%, rgba(0, 102, 255, 0) 58%), linear-gradient(118.82deg, rgba(0, 151, 232, 0.48) 24.329%, rgba(42, 49, 191, 0.5) 70.711%), linear-gradient(259.38deg, rgba(0, 102, 255, 0) 8.47%, rgba(123, 71, 255, 0.42) 101.97%)'

const DEFAULT_ROTATING_GRADIENT_TEXT_DISC_SIZE = '148px 148px, 174px 174px, 132px 132px, 100% 100%, 100% 100%'

const DEFAULT_ROTATING_GRADIENT_MASK_DISC_SIZE = '62px 62px, 78px 78px, 54px 54px, 100% 100%, 100% 100%'

const DEFAULT_ROTATING_GRADIENT_MOTION_POSITIONS = [
  '0% 42%, 100% 62%, 50% 100%, 50% 50%, 50% 50%',
  '34% 18%, 72% 88%, 0% 54%, 50% 50%, 50% 50%',
  '100% 48%, 0% 58%, 54% 0%, 50% 50%, 50% 50%',
  '64% 86%, 28% 12%, 100% 50%, 50% 50%, 50% 50%',
  '0% 42%, 100% 62%, 50% 100%, 50% 50%, 50% 50%',
] as const

const DEFAULT_ROTATING_GRADIENT_ROTATION_DURATION = '2.8s'

const DEFAULT_ROTATING_GRADIENT_GLOW_COLOR = 'rgba(0, 151, 232, 0.14)'

const rotatingGradientClipGlobalStyles = {
  '@property --rotatingGradientClipAngle': {
    syntax: '"<angle>"',
    inherits: false,
    initialValue: '0deg',
  },
} as const

export interface RotatingGradientClipProps extends Omit<BoxProps, 'children'> {
  children: ReactNode
  /** Conic gradient stops used by the rotating disc. */
  gradientColors?: readonly string[]
  highlightColor?: string
  accentColor?: string
  gradientImage?: string
  discSize?: string
  rotationDuration?: string
  /** Use rotationDuration for new usages. */
  duration?: string
  backgroundMotion?: boolean
  motionPositions?: readonly string[]
  /** Use for non-text children such as icons, since CSS text clipping only applies to text glyphs. */
  maskImage?: string
  maskSize?: string
  glowColor?: string
  disableAnimation?: boolean
}

const resolveGradientColors = (gradientColors?: readonly string[]) => {
  const colors = gradientColors?.filter(Boolean)
  return colors?.length ? colors : DEFAULT_ROTATING_GRADIENT_COLORS
}

const buildConicGradientStops = (colors: readonly string[]) => {
  const degreeStep = 360 / colors.length
  return [...colors.map((color, index) => `${color} ${Number((degreeStep * index).toFixed(3))}deg`), `${colors[0]} 360deg`].join(', ')
}

const buildRotatingGradientImage = (
  gradientColors?: readonly string[],
  highlightColor = 'rgba(255, 255, 255, 0.88)',
  accentColor?: string,
) => {
  const colors = resolveGradientColors(gradientColors)
  const resolvedAccentColor = accentColor ?? colors[0]

  return [
    `radial-gradient(circle at 42% 34%, ${highlightColor} 0%, rgba(255, 255, 255, 0) 18%)`,
    `radial-gradient(circle at 68% 72%, ${resolvedAccentColor} 0%, rgba(255, 255, 255, 0) 24%)`,
    `conic-gradient(from var(--rotatingGradientClipAngle, 0deg) at 50% 50%, ${buildConicGradientStops(colors)})`,
  ].join(', ')
}

const rotatingGradientTextClipSx = {
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  '& *': {
    backgroundImage: 'inherit',
    backgroundSize: 'inherit',
    backgroundPosition: 'inherit',
    backgroundRepeat: 'inherit',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  },
} as const

const buildMaskClipSx = (maskImage: string, maskSize: string) =>
  ({
    WebkitMaskImage: maskImage,
    maskImage,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: maskSize,
    maskSize,
    '& > *': {
      opacity: 0,
    },
  }) as const

const buildBackgroundPositionKeyframes = (motionPositions: readonly string[]) => {
  if (motionPositions.length <= 1) {
    return {
      '0%, 100%': {
        '--rotatingGradientClipAngle': '0deg',
        backgroundPosition: motionPositions[0] ?? '50% 50%',
      },
    }
  }

  return motionPositions.reduce<Record<string, Record<string, string>>>((acc, backgroundPosition, index) => {
    const progress = Number(((index / (motionPositions.length - 1)) * 100).toFixed(3))
    acc[`${progress}%`] = {
      '--rotatingGradientClipAngle': `${progress * 3.6}deg`,
      backgroundPosition,
    }
    return acc
  }, {})
}

const resolveRotatingGradientDiscSize = (discSize: string | undefined, maskImage: string | undefined) => {
  if (discSize !== undefined) return discSize
  if (maskImage) return DEFAULT_ROTATING_GRADIENT_MASK_DISC_SIZE
  return DEFAULT_ROTATING_GRADIENT_TEXT_DISC_SIZE
}

const resolveRotatingGradientMotionPositions = (backgroundMotion: boolean, motionPositions: readonly string[] | undefined) => {
  if (backgroundMotion === false) return ['50% 50%']
  return motionPositions ?? DEFAULT_ROTATING_GRADIENT_MOTION_POSITIONS
}

const resolveRotatingGradientBackgroundImage = (
  gradientImage: string | undefined,
  gradientColors: readonly string[] | undefined,
  highlightColor: string | undefined,
  accentColor: string | undefined,
) => {
  if (gradientImage !== undefined) return gradientImage
  if (gradientColors !== undefined || highlightColor !== undefined || accentColor !== undefined) {
    return buildRotatingGradientImage(gradientColors, highlightColor, accentColor)
  }
  return DEFAULT_ROTATING_GRADIENT_IMAGE
}

const resolveRotatingGradientAnimation = (
  disableAnimation: boolean,
  rotationDuration: string | undefined,
  duration: string | undefined,
) => {
  if (disableAnimation) return 'none'
  return `rotatingGradientClipSpin ${rotationDuration ?? duration ?? DEFAULT_ROTATING_GRADIENT_ROTATION_DURATION} linear infinite`
}

const RotatingGradientClip = ({
  children,
  gradientColors,
  highlightColor,
  accentColor,
  gradientImage,
  discSize,
  rotationDuration,
  duration,
  backgroundMotion = true,
  motionPositions,
  maskImage,
  maskSize = '100% 100%',
  glowColor = DEFAULT_ROTATING_GRADIENT_GLOW_COLOR,
  disableAnimation = false,
  sx,
  ...boxProps
}: RotatingGradientClipProps) => {
  const clipSx = maskImage ? buildMaskClipSx(maskImage, maskSize) : rotatingGradientTextClipSx
  const resolvedDiscSize = resolveRotatingGradientDiscSize(discSize, maskImage)
  const resolvedMotionPositions = resolveRotatingGradientMotionPositions(backgroundMotion, motionPositions)
  const resolvedBackgroundImage = resolveRotatingGradientBackgroundImage(gradientImage, gradientColors, highlightColor, accentColor)
  const resolvedAnimation = resolveRotatingGradientAnimation(disableAnimation, rotationDuration, duration)

  return (
    <>
      <GlobalStyles styles={rotatingGradientClipGlobalStyles} />
      <Box
        component="span"
        {...boxProps}
        sx={[
          {
            '--rotatingGradientClipAngle': '0deg',
            display: 'inline-flex',
            alignItems: 'center',
            backgroundImage: resolvedBackgroundImage,
            backgroundSize: resolvedDiscSize,
            backgroundPosition: resolvedMotionPositions[0],
            backgroundRepeat: 'no-repeat',
            color: 'transparent',
            textShadow: glowColor ? `0 0 10px ${glowColor}` : undefined,
            animation: resolvedAnimation,
            '@keyframes rotatingGradientClipSpin': buildBackgroundPositionKeyframes(resolvedMotionPositions),
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          },
          clipSx,
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Box>
    </>
  )
}

export default RotatingGradientClip
