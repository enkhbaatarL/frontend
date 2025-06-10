import { disassembleToGroups, assemble } from 'es-hangul'
import { useEffect, useRef, useState } from 'react'

const splitIntoSegments = (text: string): string[] => {
  const segments: string[] = []
  let currentSegment = ''
  let isHangul = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const isCurrentHangul = /[가-힣]/.test(char)

    if (i === 0) {
      isHangul = isCurrentHangul
      currentSegment = char
    } else if (isHangul === isCurrentHangul) {
      currentSegment += char
    } else {
      segments.push(currentSegment)
      currentSegment = char
      isHangul = isCurrentHangul
    }
  }
  if (currentSegment) {
    segments.push(currentSegment)
  }
  return segments
}

const processHangulSegment = (segment: string, currentText: string): string[] => {
  const steps: string[] = []
  const groups = disassembleToGroups(segment)

  for (let i = 0; i < groups.length; i++) {
    const syllableGroup = groups[i]
    for (let j = 1; j <= syllableGroup.length; j++) {
      const partial = syllableGroup.slice(0, j)
      steps.push(currentText + assemble(groups.slice(0, i).concat([partial]).flat()))
    }
  }
  return steps
}

const processNonHangulSegment = (segment: string, currentText: string): string[] => {
  const steps: string[] = []
  for (let i = 1; i <= segment.length; i++) {
    steps.push(currentText + segment.slice(0, i))
  }
  return steps
}

export const useTypingEffect = (speed: number = 20, lineDelay: number = 500) => {
  const [typedText, setTypedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const currentStepRef = useRef<number>(0)
  const stepsRef = useRef<string[]>([])
  const isWaitingRef = useRef<boolean>(false)
  const waitStartTimeRef = useRef<number>(0)

  const processText = (text: string): string[] => {
    const lines = text.split('\n')
    const allSteps: string[] = []
    let currentText = ''

    for (const line of lines) {
      const segments = splitIntoSegments(line)
      for (const segment of segments) {
        const steps = /[가-힣]/.test(segment) ? processHangulSegment(segment, currentText) : processNonHangulSegment(segment, currentText)
        allSteps.push(...steps)
        currentText += segment
      }
      currentText += '\n'
      allSteps.push(currentText)
    }
    return allSteps
  }

  const startTyping = (text: string): Promise<void> =>
    new Promise((resolve) => {
      stepsRef.current = processText(text)
      currentStepRef.current = 0
      lastUpdateTimeRef.current = performance.now()
      setTypedText('')
      setIsTyping(true)
      isWaitingRef.current = false

      const animate = (currentTime: number) => {
        if (currentStepRef.current >= stepsRef.current.length) {
          setIsTyping(false)
          resolve()
          return
        }

        if (isWaitingRef.current) {
          if (currentTime - waitStartTimeRef.current >= lineDelay) {
            isWaitingRef.current = false
            lastUpdateTimeRef.current = currentTime
          }
          animationFrameRef.current = requestAnimationFrame(animate)
          return
        }

        const elapsed = currentTime - lastUpdateTimeRef.current
        if (elapsed >= speed) {
          const currentStep = stepsRef.current[currentStepRef.current]
          setTypedText(currentStep)
          currentStepRef.current++
          lastUpdateTimeRef.current = currentTime

          // 줄바꿈이 있는 경우 대기
          if (currentStep.endsWith('\n')) {
            isWaitingRef.current = true
            waitStartTimeRef.current = currentTime
          }

          // 프레임 생략 로직 추가
          const framesToSkip = Math.floor(elapsed / speed) - 1
          if (framesToSkip > 0) {
            currentStepRef.current = Math.min(currentStepRef.current + framesToSkip, stepsRef.current.length - 1)
          }
        }

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    })

  useEffect(
    () => () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        setIsTyping(false)
      }
    },
    [],
  )

  return { typedText, startTyping, isTyping }
}
