'use client'

import { Box, Button } from '@mui/material'
import { styled } from '@mui/system'
import { FC, useEffect, useRef, useState } from 'react'

import MIAgentChatWindow from './MIAgentChatWindow'

import mariIcon from '@/assets/mariicon.svg'

const GradientBox = styled(Box)(() => ({
  background: '#1D1F20',
  position: 'relative',
  borderRadius: '200px',
  minWidth: '140px',
  width: 'auto',
  height: '56px',
  color: 'white',
  boxShadow: '2px 4px 40px 0px #276ACF4D, 0 0 0 1px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '4px 8px 50px 0px #276ACF6D, 0 0 0 1px rgba(0, 0, 0, 0.15)',
  },
  '&:active': {
    transform: 'scale(0.98)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '-2px',
    borderRadius: '200px',
    padding: '2px',
    background:
      'conic-gradient(from 0deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    zIndex: -1,
    opacity: 0,
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: 'blur(0.5px) brightness(1.1)',
  },
  '&:hover::before': {
    opacity: 0.9,
    animation: 'rotateGradientBorder 4s linear infinite',
  },
  '@keyframes rotateGradientBorder': {
    '0%': {
      background:
        'conic-gradient(from 0deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '5%': {
      background:
        'conic-gradient(from 18deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '10%': {
      background:
        'conic-gradient(from 36deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '15%': {
      background:
        'conic-gradient(from 54deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '20%': {
      background:
        'conic-gradient(from 72deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '25%': {
      background:
        'conic-gradient(from 90deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '30%': {
      background:
        'conic-gradient(from 108deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '35%': {
      background:
        'conic-gradient(from 126deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '40%': {
      background:
        'conic-gradient(from 144deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '45%': {
      background:
        'conic-gradient(from 162deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '50%': {
      background:
        'conic-gradient(from 180deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '55%': {
      background:
        'conic-gradient(from 198deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '60%': {
      background:
        'conic-gradient(from 216deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '65%': {
      background:
        'conic-gradient(from 234deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '70%': {
      background:
        'conic-gradient(from 252deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '75%': {
      background:
        'conic-gradient(from 270deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '80%': {
      background:
        'conic-gradient(from 288deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '85%': {
      background:
        'conic-gradient(from 306deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '90%': {
      background:
        'conic-gradient(from 324deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '95%': {
      background:
        'conic-gradient(from 342deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
    '100%': {
      background:
        'conic-gradient(from 360deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    },
  },
}))

// Styled component for the gradient text
const GradientText = styled('span')({
  background: 'linear-gradient(90deg, #FFFFFF, #BDF7FF)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
  display: 'inline-block',
})

export interface MIAgentButtonProps {
  top?: number
  right?: number
}

const MIAgentButton: FC<MIAgentButtonProps> = ({ top = 126, right }) => {
  const [showChatWindow, setShowChatWindow] = useState(false)
  const [windowExpend, setWindowExpend] = useState<boolean>(false)
  const [isClosing, setIsClosing] = useState(false)
  const [offsetLeft, setOffsetLeft] = useState(0)
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
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
          <GradientBox>
            <Button
              startIcon={<img width={36} height={36} src={mariIcon} alt="Mari Icon" />}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                minWidth: '140px',
                width: 'auto',
                height: '56px',
                borderRadius: '200px',
                color: '#fff',
                background: 'linear-gradient(100.9deg, #476DB9 15.49%, #15174C 101.21%)',
                fontSize: '18px',
                fontStyle: 'normal',
                fontWeight: '700',
                lineHeight: '1.4',
                padding: '0 16px',
                transition: 'all 0.2s cubic-bezier(0, 0.55, 0.45, 1)',
                '&:hover': {
                  background: 'linear-gradient(100.9deg, #5A7DC9 15.49%, #25276C 101.21%)',
                },
              }}
              disableRipple
              onClick={() => setShowChatWindow(true)}
              ref={buttonRef}
            >
              <GradientText>Find Mari</GradientText>
            </Button>
          </GradientBox>
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

export default MIAgentButton
