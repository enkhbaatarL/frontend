import { useLayoutEffect, useRef, useState } from 'react'

const useUtilizationViewport = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ scrollTop: 0, scrollLeft: 0, width: 1200, height: 600 })

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container) return undefined

    let frame: number | undefined
    const measure = () => {
      const next = {
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
        width: container.clientWidth,
        height: container.clientHeight,
      }
      setViewport((current) =>
        current.scrollTop === next.scrollTop &&
        current.scrollLeft === next.scrollLeft &&
        current.width === next.width &&
        current.height === next.height
          ? current
          : next,
      )
    }
    const scheduleMeasure = () => {
      if (frame !== undefined) return
      frame = requestAnimationFrame(() => {
        frame = undefined
        measure()
      })
    }

    measure()
    container.addEventListener('scroll', scheduleMeasure, { passive: true })
    const observer = new ResizeObserver(scheduleMeasure)
    observer.observe(container)
    return () => {
      container.removeEventListener('scroll', scheduleMeasure)
      observer.disconnect()
      if (frame !== undefined) cancelAnimationFrame(frame)
    }
  }, [])

  return { scrollRef, viewport }
}

export default useUtilizationViewport
