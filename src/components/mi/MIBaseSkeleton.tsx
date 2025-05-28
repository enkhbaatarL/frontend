import { Box, Skeleton, SxProps, Theme } from '@mui/material'
import { ReactNode } from 'react'

interface BaseSkeletonProps {
  width?: string | number
  height?: string | number
  sx?: SxProps<Theme>
}

interface SkeletonWrapperProps {
  children: ReactNode
  gap?: string | number
  direction?: 'row' | 'column'
  sx?: SxProps<Theme>
}

export const MIBaseSkeleton = {
  // 기본 텍스트 라인
  TextLine: ({ width = '100%', height = 16, sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: '2px', ...sx }} />
  ),

  // 제목/헤딩
  Title: ({ width = 200, height = 24, sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: '2px', ...sx }} />
  ),

  // 부제목
  Subtitle: ({ width = 150, height = 18, sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: '2px', ...sx }} />
  ),

  // 버튼
  Button: ({ width = 80, height = 34, sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: '4px', ...sx }} />
  ),

  // 아바타/프로필
  Avatar: ({ width = 40, height, sx }: BaseSkeletonProps) => <Skeleton variant="circular" width={width} height={height || width} sx={sx} />,

  // 이미지/차트 영역
  Image: ({ width = '100%', height = 200, sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: '8px', ...sx }} />
  ),

  // 카드 컨테이너
  Card: ({ width = '100%', height = 150, sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: '8px', ...sx }} />
  ),

  // 입력 필드
  InputField: ({ width = '100%', height = 34, sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: '4px', ...sx }} />
  ),

  // 칩/태그
  Chip: ({ width = 60, height = 20, sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: '10px', ...sx }} />
  ),

  // 아이콘
  Icon: ({ width = 20, height, sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height || width} sx={{ borderRadius: '2px', ...sx }} />
  ),

  // 이미지/차트 영역
  BaseElement: ({ width = '100%', height = '100%', sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: '2px', ...sx }} />
  ),

  // 테이블 영역
  Table: ({ width = '100%', height = '100%', sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: '4px', ...sx }} />
  ),

  // 이미지/차트 영역
  BaseElement2: ({ width = '100%', height = '100%', sx }: BaseSkeletonProps) => (
    <Skeleton variant="rectangular" width={width} height={height} sx={{ ...sx }} />
  ),
}

// 스켈레톤 래퍼 컴포넌트들
export const SkeletonWrapper = {
  // 수직 배치
  Column: ({ children, gap = 2, sx }: SkeletonWrapperProps) => (
    <Box display="flex" flexDirection="column" gap={gap} sx={sx}>
      {children}
    </Box>
  ),

  // 수평 배치
  Row: ({ children, gap, sx }: SkeletonWrapperProps) => (
    <Box display="flex" alignItems="center" gap={gap} sx={sx}>
      {children}
    </Box>
  ),

  // 그리드 배치
  Grid: ({ children, columns = 2, gap = 2, sx }: SkeletonWrapperProps & { columns?: number }) => (
    <Box display="grid" gridTemplateColumns={`repeat(${columns}, 1fr)`} gap={gap} sx={sx}>
      {children}
    </Box>
  ),

  // 컨테이너
  Container: ({ children, sx }: SkeletonWrapperProps) => (
    <Box p={3} sx={sx}>
      {children}
    </Box>
  ),
}
