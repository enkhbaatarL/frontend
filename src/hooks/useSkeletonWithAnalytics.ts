import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { SkeletonType, usePageSkeleton } from '@/hooks/useSkeleton.ts'
import { useSkeletonConfig } from '@/providers/SkeletonProvider.tsx'
import { SkeletonOptions } from '@/types/skeleton.ts'
import { skeletonAnalytics } from '@/utils/skeletonAnalytics.ts'

export const useSkeletonWithAnalytics = (skeletonType: SkeletonType, isLoading: boolean, options?: SkeletonOptions) => {
  const { config } = useSkeletonConfig()
  const location = useLocation()
  const [startTime, setStartTime] = useState<number | null>(null)
  const [skeletonStartTime, setSkeletonStartTime] = useState<number | null>(null)

  const mergedOptions = {
    minDisplayTime: config.globalMinDisplayTime,
    delayThreshold: config.globalDelayThreshold,
    ...options,
  }

  const { shouldShowSkeleton, SkeletonComponent } = usePageSkeleton(skeletonType, isLoading, mergedOptions)

  // 로딩 시작 추적
  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now())
    }
  }, [isLoading, startTime])

  // 스켈레톤 표시 시작 추적
  useEffect(() => {
    if (shouldShowSkeleton && !skeletonStartTime) {
      setSkeletonStartTime(Date.now())
    }
  }, [shouldShowSkeleton, skeletonStartTime])

  // 로딩 완료 시 분석 데이터 수집
  useEffect(() => {
    if (!isLoading && startTime && config.enableSkeletonAnalytics) {
      const loadingDuration = Date.now() - startTime
      const displayDuration = skeletonStartTime ? Date.now() - skeletonStartTime : 0

      skeletonAnalytics.track({
        skeletonType,
        displayDuration,
        loadingDuration,
        timestamp: Date.now(),
        route: location.pathname,
      })

      setStartTime(null)
      setSkeletonStartTime(null)
    }
  }, [isLoading, startTime, skeletonStartTime, skeletonType, location.pathname, config.enableSkeletonAnalytics])

  return {
    shouldShowSkeleton,
    SkeletonComponent,
  }
}
