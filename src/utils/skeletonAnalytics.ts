interface SkeletonMetrics {
  skeletonType: string
  displayDuration: number
  loadingDuration: number
  timestamp: number
  route: string
}

class SkeletonAnalytics {
  private metrics: SkeletonMetrics[] = []
  private enabled = false

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }

  track(metric: SkeletonMetrics) {
    if (!this.enabled) return

    this.metrics.push(metric)

    // 100개 이상 쌓이면 오래된 것 제거
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  getMetrics() {
    return this.metrics
  }

  getAverageDisplayTime(skeletonType?: string) {
    const filtered = skeletonType ? this.metrics.filter((m) => m.skeletonType === skeletonType) : this.metrics

    if (filtered.length === 0) return 0

    const total = filtered.reduce((sum, m) => sum + m.displayDuration, 0)
    return total / filtered.length
  }

  getSlowSkeletons(threshold = 2000) {
    return this.metrics.filter((m) => m.displayDuration > threshold)
  }

  generateReport() {
    const byType = this.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.skeletonType]) {
          acc[metric.skeletonType] = []
        }
        acc[metric.skeletonType].push(metric)
        return acc
      },
      {} as Record<string, SkeletonMetrics[]>,
    )

    return Object.entries(byType).map(([type, metrics]) => ({
      skeletonType: type,
      count: metrics.length,
      averageDisplayTime: this.getAverageDisplayTime(type),
      maxDisplayTime: Math.max(...metrics.map((m) => m.displayDuration)),
      minDisplayTime: Math.min(...metrics.map((m) => m.displayDuration)),
    }))
  }
}

export const skeletonAnalytics = new SkeletonAnalytics()
