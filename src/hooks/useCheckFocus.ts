import { useRef, useState } from 'react'

export default function useCheckFocus() {
  const ref = useRef<HTMLElement>(null)
  const outFocusListener = useRef<EventListenerOrEventListenerObject>(null)
  const [isFocus, setIsFocus] = useState(false)

  const registerClickOutListener = () => {
    setIsFocus(true)
    outFocusListener.current = (e) => {
      const focused = ref.current === e.target || ref.current?.contains(e.target as HTMLElement)

      if (outFocusListener.current && !focused) {
        setIsFocus(false)
        window.document.removeEventListener('click', outFocusListener.current)
        outFocusListener.current = null
      }
    }
    window.document.addEventListener('click', outFocusListener.current)
  }

  return {
    ref,
    isFocus,
    setIsFocus,
    registerClickOutListener,
  }
}
