// types/skeleton.ts
import { SxProps, Theme } from '@mui/material'
import React, { ComponentType, JSX, ReactNode } from 'react'

/**
 * 🎯 스켈레톤 기본 타입 정의
 */

// 기본 스켈레톤 Props
export interface BaseSkeletonProps {
  width?: string | number
  height?: number
  sx?: SxProps<Theme>
}

// 스켈레톤 래퍼 Props
export interface SkeletonWrapperProps {
  children: ReactNode
  gap?: number
  direction?: 'row' | 'column'
  sx?: SxProps<Theme>
}

// 그리드 래퍼 추가 Props
export interface SkeletonGridProps extends SkeletonWrapperProps {
  columns?: number
}

/**
 * 🎯 스켈레톤 컴포넌트 타입
 */

// 스켈레톤 컴포넌트 기본 타입
export type SkeletonComponentType = React.ComponentType<Record<string, unknown>>

// 함수형 스켈레톤 컴포넌트 타입 (props 받을 수 있음)
export type SkeletonFunctionType<T = Record<string, unknown>> = (props?: T) => JSX.Element

// 스켈레톤 패턴별 Props 타입
export interface SkeletonPatternProps {
  // Dashboard 패턴
  Dashboard?: never // props 없음

  // List 패턴
  List?: {
    itemCount?: number
  }

  // Table 패턴
  Table?: {
    rows?: number
    columns?: number
  }

  // Form 패턴
  Form?: {
    fieldCount?: number
  }

  // Grid 패턴
  Grid?: {
    itemCount?: number
    columns?: number
  }

  // Insights 패턴
  Insights?: {
    itemCount?: number
  }

  // MarketData 패턴
  MarketData?: never

  // SignalMap 패턴
  SignalMap?: never

  // DataDetail 패턴
  DataDetail?: never

  // NoticeList 패턴
  NoticeList?: {
    itemCount?: number
  }

  // HelpCenter 패턴
  HelpCenter?: never
}

/**
 * 🎯 스켈레톤 옵션 및 설정
 */

// 스켈레톤 표시 옵션
export interface SkeletonOptions {
  minDisplayTime?: number // 최소 표시 시간 (ms)
  delayThreshold?: number // 이 시간 이하의 로딩은 스켈레톤 표시 안함 (ms)
}

// 스켈레톤 설정 프리셋
export interface SkeletonConfig {
  globalMinDisplayTime: number
  globalDelayThreshold: number
  enablePerformanceMode: boolean
  enableSkeletonAnalytics: boolean
}

// 로딩 상태 타입
export interface LoadingState {
  isLoading: boolean
  error?: unknown
}

// 쿼리 결과 타입 (React Query와 호환)
export interface QueryResult<T = unknown> extends LoadingState {
  data?: T
}

/**
 * 🎯 스켈레톤 훅 반환 타입
 */

// usePageSkeleton 훅 반환 타입
export interface UsePageSkeletonResult {
  shouldShowSkeleton: boolean
  SkeletonComponent: SkeletonComponentType
}

// useQuerySkeleton 훅 반환 타입
export interface UseQuerySkeletonResult<T = unknown> extends UsePageSkeletonResult {
  data?: T
  error?: unknown
  isLoading: boolean
}

// useSectionSkeleton 훅 반환 타입
export type UseSectionSkeletonResult = Record<string, boolean>

/**
 * 🎯 스켈레톤 분석 및 메트릭스
 */

// 스켈레톤 메트릭스 데이터
export interface SkeletonMetrics {
  skeletonType: string
  displayDuration: number
  loadingDuration: number
  timestamp: number
  route: string
  userAgent?: string
  networkSpeed?: 'slow' | 'fast' | 'unknown'
}

// 스켈레톤 성능 리포트
export interface SkeletonPerformanceReport {
  skeletonType: string
  count: number
  averageDisplayTime: number
  maxDisplayTime: number
  minDisplayTime: number
  routes: string[]
}

// 스켈레톤 분석 설정
export interface SkeletonAnalyticsConfig {
  enabled: boolean
  maxMetrics: number
  reportingInterval: number
  excludeRoutes?: string[]
}

/**
 * 🎯 커스텀 스켈레톤 관련
 */

// 커스텀 스켈레톤 빌더 옵션
export interface CustomSkeletonOptions {
  layout: 'grid' | 'list' | 'detail' | 'form'
  itemCount?: number
  showHeader?: boolean
  showFooter?: boolean
  cardHeight?: number
  columns?: number
}

// 스켈레톤 테마 설정
export interface SkeletonTheme {
  colors: {
    background: string
    highlight: string
    border?: string
  }
  borderRadius: {
    small: string
    medium: string
    large: string
  }
  animation: {
    duration: string
    easing: string
  }
}

/**
 * 🎯 HOC 및 컴포지션 관련
 */

// HOC Props 타입
export interface WithSkeletonProps {
  isLoading: boolean
}

// HOC 옵션
export interface SkeletonHOCOptions extends SkeletonOptions {
  fallbackComponent?: ComponentType
  errorComponent?: ComponentType<{ error: unknown }>
}

/**
 * 🎯 컨텍스트 관련
 */

// 스켈레톤 컨텍스트 타입
export interface SkeletonContextType {
  config: SkeletonConfig
  updateConfig: (newConfig: Partial<SkeletonConfig>) => void
  analytics?: SkeletonAnalyticsConfig
  theme?: SkeletonTheme
}

// 스켈레톤 프로바이더 Props
export interface SkeletonProviderProps {
  children: ReactNode
  config?: Partial<SkeletonConfig>
  analytics?: Partial<SkeletonAnalyticsConfig>
  theme?: Partial<SkeletonTheme>
}

/**
 * 🎯 유틸리티 타입들
 */

// 스켈레톤 타입 추출 (PageSkeletons에서 자동으로 추출됨)
export type SkeletonType = string // 실제로는 PageSkeletons의 키들

// 스켈레톤 상태 열거형
export enum SkeletonState {
  HIDDEN = 'hidden',
  DELAYED = 'delayed',
  SHOWING = 'showing',
  MIN_TIME = 'min_time',
}

// 로딩 속도 분류
export enum LoadingSpeed {
  INSTANT = 'instant', // < 100ms
  FAST = 'fast', // 100ms - 500ms
  NORMAL = 'normal', // 500ms - 2s
  SLOW = 'slow', // 2s - 5s
  VERY_SLOW = 'very_slow', // > 5s
}

// 스켈레톤 우선순위
export enum SkeletonPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * 🎯 에러 처리 관련
 */

// 스켈레톤 에러 타입
export interface SkeletonError {
  type: 'INVALID_SKELETON_TYPE' | 'RENDER_ERROR' | 'TIMEOUT_ERROR'
  message: string
  skeletonType?: string
  timestamp: number
}

// 에러 핸들러 타입
export type SkeletonErrorHandler = (error: SkeletonError) => void

/**
 * 🎯 개발 도구 관련
 */

// 개발 도구 옵션
export interface SkeletonDevToolsOptions {
  enabled: boolean
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showMetrics: boolean
  showConfig: boolean
  logToConsole: boolean
}

// 스켈레톤 디버그 정보
export interface SkeletonDebugInfo {
  skeletonType: string
  renderTime: number
  props: Record<string, unknown>
  isVisible: boolean
  startTime: number
  endTime?: number
}

/**
 * 🎯 플러그인 시스템 (확장 가능)
 */

// 스켈레톤 플러그인 인터페이스
export interface SkeletonPlugin {
  name: string
  version: string
  install: (context: SkeletonContextType) => void
  uninstall?: () => void
}

// 플러그인 등록 옵션
export interface SkeletonPluginOptions {
  autoInstall?: boolean
  dependencies?: string[]
}

/**
 * 🎯 타입 가드 함수들
 */

// 스켈레톤 타입 가드
export type SkeletonTypeGuard<T> = (value: unknown) => value is T

// 로딩 상태 타입 가드
export const isLoadingState = (value: unknown): value is LoadingState => typeof value === 'object' && value !== null && 'isLoading' in value

// 쿼리 결과 타입 가드
export const isQueryResult = (value: unknown): value is QueryResult => isLoadingState(value) && ('data' in value || 'error' in value)

/**
 * 🎯 고급 타입 조작
 */

// 조건부 스켈레톤 Props
export type ConditionalSkeletonProps<T extends SkeletonType> = T extends keyof SkeletonPatternProps ? SkeletonPatternProps[T] : never

// 스켈레톤 컴포넌트 매핑
export type SkeletonComponentMap = {
  [K in SkeletonType]: SkeletonFunctionType<ConditionalSkeletonProps<K>>
}

// 스켈레톤 훅 결과 매핑
export type SkeletonHookMap = {
  [K in SkeletonType]: () => UsePageSkeletonResult
}

/**
 * 🎯 내보내기 (re-export용)
 */

// 자주 사용되는 타입들의 별칭
export type { BaseSkeletonProps as SkeletonProps, SkeletonOptions as SkeletonSettings, UsePageSkeletonResult as SkeletonHookResult }

// 기본 설정 상수
export const DEFAULT_SKELETON_CONFIG: SkeletonConfig = {
  globalMinDisplayTime: 500,
  globalDelayThreshold: 300,
  enablePerformanceMode: false,
  enableSkeletonAnalytics: false,
}

export const DEFAULT_SKELETON_OPTIONS: Required<SkeletonOptions> = {
  minDisplayTime: 500,
  delayThreshold: 300,
}
