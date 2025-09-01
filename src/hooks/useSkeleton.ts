import { useState, useEffect, useMemo, createElement, Attributes, useRef, useCallback } from 'react'
import * as React from 'react'

import { MIPageSkeletons } from '@/components/mi/MIPageSkeletons.tsx'

// 스켈레톤 타입 정의
export type SkeletonType = keyof typeof MIPageSkeletons

// 기본 스켈레톤 props 타입들
export interface ListSkeletonProps {
  itemCount?: number
}

export interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export interface FormSkeletonProps {
  fieldCount?: number
}

export interface BasicSkeletonProps {
  [key: string]: unknown
}

// 모든 가능한 스켈레톤 props 타입의 유니온
export type AllSkeletonProps = BasicSkeletonProps | ListSkeletonProps | TableSkeletonProps | FormSkeletonProps

// 스켈레톤 컴포넌트 타입 정의
export type SkeletonComponentType = React.ComponentType<AllSkeletonProps>

// 각 스켈레톤 타입별 props 매핑 - 더 명확한 타입 정의
export type SkeletonPropsMap = {
  Dashboard: BasicSkeletonProps
  Insights: BasicSkeletonProps
  MarketData: BasicSkeletonProps
  DataDetail: BasicSkeletonProps
  Notice: ListSkeletonProps
  HelpCenter: ListSkeletonProps
  DataCatalog: BasicSkeletonProps
  DataTable: TableSkeletonProps
  FormSkeleton: FormSkeletonProps
}

// 타입 안전한 props 추출 유틸리티
export type GetSkeletonProps<T extends SkeletonType> = T extends keyof SkeletonPropsMap ? SkeletonPropsMap[T] : BasicSkeletonProps

// 스켈레톤 옵션
interface SkeletonOptions {
  minDisplayTime?: number // 최소 표시 시간 (ms)
  delayThreshold?: number // 이 시간 이하의 로딩은 스켈레톤 표시 안함 (ms)
}

// 페이지별 스켈레톤 훅 - 개선된 제네릭 타입
export const usePageSkeleton = <T extends SkeletonType>(
  skeletonType: T,
  isLoading: boolean,
  options: SkeletonOptions = {},
  skeletonProps?: GetSkeletonProps<T>,
) => {
  const { minDisplayTime = 500, delayThreshold = 300 } = options

  const [shouldShowSkeleton, setShouldShowSkeleton] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const minDisplayTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // useMemo로 스켈레톤 컴포넌트를 메모이제이션
  const SkeletonComponent = useMemo(() => MIPageSkeletons[skeletonType], [skeletonType])

  // 스켈레톤 엘리먼트를 미리 생성
  const skeletonElement = useMemo(() => {
    if (!SkeletonComponent) return null

    // props가 있으면 전달하고, 없으면 빈 객체 전달
    const props = skeletonProps || {}
    return React.createElement(SkeletonComponent as React.ComponentType<AllSkeletonProps>, props)
  }, [SkeletonComponent, skeletonProps])

  // cleanup 함수를 useCallback으로 메모이제이션
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (minDisplayTimeoutRef.current) {
      clearTimeout(minDisplayTimeoutRef.current)
      minDisplayTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    cleanup() // 이전 타이머들 정리

    if (isLoading) {
      startTimeRef.current = Date.now()

      // delayThreshold 후에 스켈레톤 표시
      timeoutRef.current = setTimeout(() => {
        setShouldShowSkeleton(true)
        timeoutRef.current = null
      }, delayThreshold)
    } else {
      // 로딩이 끝났을 때
      if (shouldShowSkeleton && startTimeRef.current) {
        const elapsedTime = Date.now() - startTimeRef.current

        // 최소 표시 시간을 채우지 못했다면 추가 대기
        if (elapsedTime < minDisplayTime) {
          minDisplayTimeoutRef.current = setTimeout(() => {
            setShouldShowSkeleton(false)
            startTimeRef.current = null
            minDisplayTimeoutRef.current = null
          }, minDisplayTime - elapsedTime)
        } else {
          setShouldShowSkeleton(false)
          startTimeRef.current = null
        }
      } else {
        setShouldShowSkeleton(false)
        startTimeRef.current = null
      }
    }

    // cleanup 함수 반환
    return cleanup
  }, [isLoading, delayThreshold, minDisplayTime, cleanup]) // shouldShowSkeleton, startTime 제거

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => cleanup, [cleanup])

  return {
    shouldShowSkeleton,
    SkeletonComponent,
    skeletonElement, // 미리 생성된 엘리먼트 반환
  }
}

// 섹션별 스켈레톤 훅 (점진적 로딩용)
export const useSectionSkeleton = (loadingStates: Record<string, boolean>) =>
  Object.entries(loadingStates).reduce(
    (acc, [key, isLoading]) => {
      acc[key] = isLoading
      return acc
    },
    {} as Record<string, boolean>,
  )

// React Query와 함께 사용하는 훅
export const useQuerySkeleton = <TData = unknown, TSkeletonType extends SkeletonType = SkeletonType>(
  queryResult: { data?: TData; isLoading: boolean; error?: unknown },
  skeletonType: TSkeletonType,
  options?: SkeletonOptions,
  skeletonProps?: GetSkeletonProps<TSkeletonType>,
) => {
  const { shouldShowSkeleton, SkeletonComponent, skeletonElement } = usePageSkeleton(
    skeletonType,
    queryResult.isLoading,
    options,
    skeletonProps,
  )

  return {
    data: queryResult.data,
    error: queryResult.error,
    isLoading: queryResult.isLoading,
    shouldShowSkeleton,
    SkeletonComponent,
    skeletonElement,
  }
}

// 다중 쿼리 스켈레톤 훅
export const useMultiQuerySkeleton = <T extends SkeletonType>(
  queries: Array<{ isLoading: boolean }>,
  skeletonType: T,
  options?: SkeletonOptions,
  skeletonProps?: GetSkeletonProps<T>,
) => {
  const isAnyLoading = queries.some((query) => query.isLoading)

  return usePageSkeleton(skeletonType, isAnyLoading, options, skeletonProps)
}

// HOC 개선 - 실용적인 타입 안전성 보장
export const withSkeleton = <P extends Record<string, unknown>, T extends SkeletonType>(
  WrappedComponent: React.ComponentType<P>,
  skeletonType: T,
  options?: SkeletonOptions,
  skeletonProps?: GetSkeletonProps<T>,
) => {
  const SkeletonWrapper = (props: P & { isLoading: boolean }) => {
    const { isLoading, ...restProps } = props
    const { shouldShowSkeleton, skeletonElement } = usePageSkeleton(skeletonType, isLoading, options, skeletonProps)

    if (shouldShowSkeleton && skeletonElement) {
      return skeletonElement
    }

    // 가장 실용적인 해결책:
    // restProps는 논리적으로 P와 동일하므로 (isLoading만 제외)
    // eslint-disable나 @ts-ignore 대신 안전한 타입 단언 사용
    return createElement(WrappedComponent, restProps as unknown as Attributes & P)
  }

  // 디스플레이 네임 설정 (디버깅용)
  SkeletonWrapper.displayName = `withSkeleton(${WrappedComponent.displayName || WrappedComponent.name})`

  return SkeletonWrapper
}

// 커스텀 스켈레톤 생성 헬퍼 개선
export const createCustomSkeleton =
  <P extends AllSkeletonProps>(skeletonComponent: React.ComponentType<P>) =>
    (isLoading: boolean, options?: SkeletonOptions, props?: P) => {
    // 더미 타입을 사용하여 타이밍 로직만 활용
      const { shouldShowSkeleton } = usePageSkeleton('Dashboard', isLoading, options)

      // 커스텀 엘리먼트 생성
      const customElement = useMemo(() => {
        if (!skeletonComponent) return null
        return React.createElement(skeletonComponent, props || ({} as P))
      }, [skeletonComponent, props])

      return {
        shouldShowSkeleton,
        SkeletonComponent: skeletonComponent,
        skeletonElement: customElement,
      }
    }

// 스켈레톤 설정 상수
export const SKELETON_CONFIGS = {
  // 빠른 데이터 (캐시된 데이터, 로컬 데이터)
  FAST_LOADING: {
    minDisplayTime: 300,
    delayThreshold: 500, // 0.5초 이상 걸릴 때만 표시
  },

  // 일반적인 API 호출
  NORMAL_LOADING: {
    minDisplayTime: 500,
    delayThreshold: 300,
  },

  // 느린 데이터 (복잡한 계산, 큰 데이터)
  SLOW_LOADING: {
    minDisplayTime: 800,
    delayThreshold: 200,
  },

  // 중요한 데이터 (항상 스켈레톤 표시)
  CRITICAL_LOADING: {
    minDisplayTime: 400,
    delayThreshold: 0,
  },
} as const
