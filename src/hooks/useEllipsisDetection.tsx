import { useEffect, useRef, useState } from 'react'

const ELLIPSIS_OVERFLOW_TOLERANCE_PX = 1

export default function useEllipsisDetection(observedKey?: unknown) {
  const ref = useRef<HTMLElement>(null)
  const [isEllipsis, setIsEllipsis] = useState(false)
  const checkOverflow = () => {
    if (ref.current) {
      const widthOverflow = ref.current.scrollWidth - ref.current.clientWidth > ELLIPSIS_OVERFLOW_TOLERANCE_PX
      const heightOverflow = ref.current.scrollHeight - ref.current.clientHeight > ELLIPSIS_OVERFLOW_TOLERANCE_PX
      setIsEllipsis(widthOverflow || heightOverflow)
    }
  }

  useEffect(() => {
    checkOverflow()

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow()
    })

    if (ref.current) {
      resizeObserver.observe(ref.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [observedKey])

  return { isEllipsis, ref }
}
