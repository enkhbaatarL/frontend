import { useEffect, useRef, useState } from 'react'

export default function useEllipsisDetection() {
  const ref = useRef<HTMLElement>(null)
  const [isEllipsis, setIsEllipsis] = useState(false)
  const checkOverflow = () => {
    if (ref.current) {
      setIsEllipsis(ref.current.scrollWidth > ref.current.clientWidth)
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
  }, [])

  return { isEllipsis, ref }
}
