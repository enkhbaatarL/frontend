import { Box, Button } from '@mui/material'
import { FC, useEffect, useMemo, useRef, useState } from 'react'

import MIAgentChatWindow from './MIAgentChatWindow'
import GeneratingIcon from '../icons/agent/GeneratingIcon'

import mariLogoTypo from '@/assets/mari-logo-typo.svg'
import mariSymbol from '@/assets/mari-symbol-animated.svg'
import { getScrollThumb } from '@/hooks/useScrollThumbRegistry'

export interface NewAgentButtonProps {
  top?: number
  right?: number
}

const NewAgentButton: FC<NewAgentButtonProps> = ({ top = 126, right }) => {
  const [showChatWindow, setShowChatWindow] = useState(false)
  const [windowExpend, setWindowExpend] = useState<boolean>(false)
  const [isClosing, setIsClosing] = useState(false)
  const [offsetLeft, setOffsetLeft] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [scrollThumbTop, setScrollThumbTop] = useState<string>('')

  const buttonRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLButtonElement>(null)

  const handleClose = () => {
    setWindowExpend(false)
    setIsClosing(true)
    setTimeout(() => {
      setShowChatWindow(false)
      setIsClosing(false)
    }, 400)
  }

  const onExpandWindow = (expanded: boolean | ((prevState: boolean) => boolean)) => {
    setWindowExpend(expanded)
  }

  const showMariText = useMemo(() => isHovered || scrollThumbTop === '0px', [isHovered, scrollThumbTop])

  useEffect(() => {
    let styleObserver: MutationObserver | null = null
    let domObserver: MutationObserver | null = null

    const setupThumbObserver = (thumbElement: HTMLElement) => {
      styleObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            setScrollThumbTop(thumbElement.style.top || '0px')
          }
        })
      })

      styleObserver.observe(thumbElement, {
        attributes: true,
        attributeFilter: ['style'],
      })

      setScrollThumbTop(thumbElement.style.top || '0px')
    }

    const findAndObserveThumb = () => {
      const thumbElement = getScrollThumb('main-scroll-wrapper')

      if (thumbElement) {
        setupThumbObserver(thumbElement)
        return true
      }
      return false
    }

    if (!findAndObserveThumb()) {
      domObserver = new MutationObserver(() => {
        if (findAndObserveThumb()) {
          domObserver?.disconnect()
          domObserver = null
        }
      })

      domObserver.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }

    return () => {
      styleObserver?.disconnect()
      domObserver?.disconnect()
    }
  }, [])

  // Update button position when mounted and on window resize
  useEffect(() => {
    const updateToolBarPosition = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topBar: any = document.getElementsByClassName('MuiToolbar-root')

      if (topBar.length > 0 && topBar[0]?.offsetLeft) {
        setOffsetLeft(topBar[0]?.offsetLeft)
      }
    }

    updateToolBarPosition()
    window.addEventListener('resize', updateToolBarPosition)

    return () => window.removeEventListener('resize', updateToolBarPosition)
  }, [])

  useEffect(() => {
    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showChatWindow) {
        handleClose()
      }
    }

    window.addEventListener('keydown', escapeHandler)

    return () => {
      window.removeEventListener('keydown', escapeHandler)
    }
  }, [showChatWindow])

  return (
    <>
      <Box
        ref={ref}
        onClick={handleClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1400, // Lower than the chat window but higher than most content
          opacity: showChatWindow ? 1 : 0,
          visibility: showChatWindow ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          top,
          transition: 'top 0.15s linear',
          right: right ?? offsetLeft,
          zIndex: showChatWindow ? 1500 : 999, // chat 영역 활성화 시 헤더보다 높게 조정
        }}
      >
        <Box
          sx={{
            opacity: showChatWindow ? 0 : 1,
            visibility: showChatWindow ? 'hidden' : 'visible',
            width: !showChatWindow ? 'auto' : '0px',
            height: '0px',
            borderRadius: '12px',
            position: 'relative',
          }}
        >
          <Button
            ref={buttonRef}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              width: 'auto',
              borderRadius: '200px',
              color: '#fff',
              background: showMariText ? 'linear-gradient(180deg, rgba(71, 109, 185, 0.1) 0%, rgba(21, 23, 76, 0.1) 100%)' : 'transparent',
              backdropFilter: showMariText ? 'blur(10px)' : 'none',
              fontSize: '18px',
              fontStyle: 'normal',
              fontWeight: '700',
              lineHeight: '1.4',
              padding: '3px',
              transition: 'all 0.3s cubic-bezier(0, 0.55, 0.45, 1)',
            }}
            disableRipple
            onClick={() => setShowChatWindow(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                width: showMariText ? '80px' : '0px',
                transition: 'width 0.3s ease-in-out',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                px="8px"
                sx={{
                  minWidth: '120px',
                  opacity: showMariText ? 1 : 0,
                  transition: 'opacity 0.2s ease-in-out 0.1s',
                }}
              >
                <GeneratingIcon />
                <img width={44} src={mariLogoTypo} alt="Mari" />
              </Box>
            </Box>
            <Box
              width="48px"
              height="48px"
              style={{
                filter: showMariText ? 'drop-shadow(0px 0px 2.4px rgba(54, 79, 199, 0.7))' : 'none',
                transition: 'filter 0.2s cubic-bezier(0, 0.55, 0.45, 1)',
              }}
            >
              <img width={48} height={48} src={mariSymbol} alt="Mari" />
            </Box>
          </Button>
        </Box>
        <Box
          sx={{
            transform: (() => {
              if (isClosing) return 'scale(0.1)'
              return showChatWindow ? 'scale(1)' : 'scale(0.1)'
            })(),
            opacity: showChatWindow && !isClosing ? 1 : 0,
            width: 'auto',
            height: 'auto',
            visibility: showChatWindow || isClosing ? 'visible' : 'hidden',
            transition:
              'width 0.4s cubic-bezier(0, 0.55, 0.45, 1), height 0.4s cubic-bezier(0, 0.55, 0.45, 1), opacity 0.4s cubic-bezier(0, 0.55, 0.45, 1), transform 0.4s cubic-bezier(0, 0.55, 0.45, 1)',
            pointerEvents: showChatWindow && !isClosing ? 'auto' : 'none',
            borderRadius: '12px',
            position: 'fixed',
            transformOrigin: 'top right',
            right: offsetLeft,
          }}
        >
          {showChatWindow && (
            <MIAgentChatWindow top={top} onChangeExpand={onExpandWindow} windowExpend={windowExpend} onClose={handleClose} />
          )}
        </Box>
      </Box>
    </>
  )
}

export default NewAgentButton
