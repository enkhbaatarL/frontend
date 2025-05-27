'use client'

import { Box, Button } from '@mui/material'
import { styled } from '@mui/system'
import { useEffect, useRef, useState } from 'react'

import MIAgentChatWindow from './MIAgentChatWindow'

import type React from 'react'

const GradientBox = styled(Box)(() => ({
  background: '#1D1F20',
  position: 'relative',
  borderRadius: '200px',
  width: '140px',
  height: '56px',
  color: 'white',
  boxShadow: '2px 4px 40px 0px #276ACF4D',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '-2px', // Shorthand for top, right, bottom, left
    borderRadius: '200px',
    padding: '2px', // Creates the border width
    background:
      'conic-gradient(from 0deg, #7DE5F3 0%, #A9E7F6 5%, #6DAFD9 15%, #518EE1 30%, #6DAFD9 45%, #7DE5F3 60%, #BDF7FF 75%, #F8FDFE 90%, #BDF7FF 95%, #7DE5F3 100%)',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    zIndex: -1,
    opacity: 0,
    animation: 'none',
  },
  '&:hover::before': {
    opacity: 1,
    animation: 'rotateGradientBorder 1.5s linear infinite',
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
  // animation: 'textShine 3s linear infinite',
  // '@keyframes textShine': {
  //   '0%': {
  //     backgroundPosition: '0% center',
  //   },
  //   '100%': {
  //     backgroundPosition: '200% center',
  //   },
  // },
})

export interface MIAgentButtonProps {
  top?: number
  right?: number
}

const MIAgentButton: React.FC<MIAgentButtonProps> = ({ top = 126 }) => {
  const [showChatWindow, setshowChatWindow] = useState(false)
  const [windowExpaned, setwindowExpaned] = useState<boolean>(false)
  const [isClosing, setIsClosing] = useState(false)
  const [offsetLeft, setoffsetLeft] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLButtonElement>(null)

  const handleClose = () => {
    setwindowExpaned(false)
    setIsClosing(true)
    setTimeout(() => {
      setshowChatWindow(false)
      setIsClosing(false)
    }, 500) // Match this with the transition duration
  }

  const onExpandWindow = (expanded: boolean | ((prevState: boolean) => boolean)) => {
    setwindowExpaned(expanded)
  }

  // Update button position when mounted and on window resize
  useEffect(() => {
    const updateToolBarPosition = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topBar: any = document.getElementsByClassName('MuiToolbar-root')

      if (topBar.length > 0 && topBar[0]?.offsetLeft) {
        setoffsetLeft(topBar[0]?.offsetLeft)
      }
    }

    updateToolBarPosition()
    window.addEventListener('resize', updateToolBarPosition)

    return () => window.removeEventListener('resize', updateToolBarPosition)
  }, [])

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
          right: offsetLeft,
          zIndex: 1500,
        }}
      >
        <Box
          sx={{
            opacity: showChatWindow ? 0 : 1,
            visibility: showChatWindow ? 'hidden' : 'visible',
            width: !showChatWindow ? '140px' : '0px',
            height: '0px',
            borderRadius: '12px',
            position: 'relative',
          }}
        >
          <GradientBox>
            <Button
              startIcon={<img width={36} height={36} src="/src/assets/mariicon.svg" alt="Mari Icon" />}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                width: '140px',
                height: '56px',
                borderRadius: '200px',
                color: '#fff',
                background: 'linear-gradient(100.9deg, #476DB9 15.49%, #15174C 101.21%)',
                fontSize: '18px',
                fontStyle: 'normal',
                fontWeight: '700',
                lineHeight: '1.4',
              }}
              disableRipple
              onClick={() => setshowChatWindow(true)}
              ref={buttonRef}
            >
              <GradientText>Ask Mari</GradientText>
            </Button>
          </GradientBox>
        </Box>
        <Box
          sx={{
            transform: isClosing ? 'scale(0.1)' : showChatWindow ? 'scale(1)' : 'scale(0.1)',
            opacity: showChatWindow && !isClosing ? 1 : 0,
            width: 'auto',
            height: 'auto',
            visibility: showChatWindow || isClosing ? 'visible' : 'hidden',
            transition: 'all 0.5s ease',
            pointerEvents: showChatWindow && !isClosing ? 'auto' : 'none',
            borderRadius: '12px',
            position: 'fixed',
            transformOrigin: 'top right',
            top: windowExpaned ? top - 56 : top,
            right: offsetLeft,
          }}
        >
          <MIAgentChatWindow onChangeExpand={onExpandWindow} windowExpaned={windowExpaned} onClose={handleClose} />
        </Box>
      </Box>
    </>
  )
}

export default MIAgentButton
