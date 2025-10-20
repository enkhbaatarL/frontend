import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import { Box, Slider, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'

interface ContentReaderProps {
  audioUrl?: string
}

const ContentReader = ({ audioUrl }: ContentReaderProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current

    const handleTimeUpdate = () => {
      if (!audio) return
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      if (!audio) return
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentTime(0)
    }

    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('ended', handleEnded)
    }

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleTogglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      setIsPaused(true)
    } else {
      audioRef.current.play().then()
      setIsPlaying(true)
      setIsPaused(false)
    }
  }

  const handleStop = () => {
    if (!audioRef.current) return

    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setCurrentTime(0)
    setIsPlaying(false)
    setIsPaused(false)
  }

  const getBackgroundColor = () => {
    if (isPlaying || isPaused) return '#F1F3F5'
    if (isHovered) return '#F0F3F6'
    return '#FFFFFF'
  }

  const getHoverBackgroundColor = () => {
    if (isPlaying || isPaused) return '#F1F3F5'
    return '#F0F3F6'
  }

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    if (!audioRef.current) return

    const newTime = Array.isArray(newValue) ? newValue[0] : newValue
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const isShowListen = useMemo(() => (isHovered || isPlaying || isPaused) && !isPlaying && !isPaused, [isHovered, isPlaying, isPaused])

  const getWidth = () => {
    if (isPlaying || isPaused) return '210px' // 재생바
    if (isShowListen) return '92px' // Listen 표시
    return '36px'
  }

  return (
    <>
      <Box
        className="playWrapper"
        onClick={isShowListen ? handleTogglePlay : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        display="flex"
        alignItems="center"
        boxSizing="border-box"
        sx={{
          width: getWidth(),
          borderRadius: '10px',
          border: '1px solid',
          borderColor: isPlaying || isPaused || isHovered ? '#CED4DA' : '#DEE2E6',
          padding: '8px',
          backgroundColor: getBackgroundColor(),
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: isShowListen ? 'pointer' : 'default',
          overflow: 'hidden',
          '&:hover': {
            backgroundColor: getHoverBackgroundColor(),
          },
        }}
      >
        {/* 초기 플레이 버튼 */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            opacity: !isPlaying && !isPaused ? 1 : 0,
            width: !isPlaying && !isPaused ? '20px' : '0px',
            transition: `${!isPlaying && !isPaused ? 'all' : 'width'} 0.4s cubic-bezier(0.4, 0, 0.2, 1)`,
            pointerEvents: !isPlaying && !isPaused ? 'auto' : 'none',
          }}
        >
          <PlayArrowIcon sx={{ width: 20, height: 20, color: '#495057' }} />
        </Box>

        {/* 재생 중 컨트롤 버튼들 */}
        <Box
          display="flex"
          alignItems="center"
          sx={{
            opacity: isPlaying || isPaused ? 1 : 0,
            width: isPlaying || isPaused ? '48px' : '0px',
            gap: isPlaying || isPaused ? '8px' : '0px',
            marginRight: isPlaying || isPaused ? '8px' : '0px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isPlaying || isPaused ? 'auto' : 'none',
          }}
        >
          <Box
            onClick={handleStop}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <StopIcon sx={{ width: 20, height: 20, color: '#495057' }} />
          </Box>
          <Box
            onClick={handleTogglePlay}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isPlaying ? (
              <PauseIcon sx={{ width: 20, height: 20, color: '#495057' }} />
            ) : (
              <PlayArrowIcon sx={{ width: 20, height: 20, color: '#495057' }} />
            )}
          </Box>
        </Box>

        {/* Listen 텍스트 */}
        <Typography
          variant="body2M14"
          color="content.textNormal"
          ml="8px"
          sx={{
            opacity: isShowListen ? 1 : 0,
            width: isShowListen ? 'auto' : '0px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            pointerEvents: isShowListen ? 'auto' : 'none',
          }}
        >
          Listen
        </Typography>

        {/* 재생바 및 시간 */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            opacity: isPlaying || isPaused ? 1 : 0,
            width: isPlaying || isPaused ? 'auto' : '0px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isPlaying || isPaused ? 'auto' : 'none',
          }}
        >
          <Stack alignItems="center" justifyContent="center" sx={{ width: '80px' }}>
            <Slider
              value={currentTime}
              min={0}
              max={duration || 0}
              onChange={handleSliderChange}
              sx={{
                color: '#364FC7',
                height: 4,
                padding: 0,
                '& .MuiSlider-thumb': {
                  display: 'none',
                },
                '& .MuiSlider-track': {
                  backgroundColor: '#364FC7',
                  height: 4,
                  borderRadius: 2,
                },
                '& .MuiSlider-rail': {
                  backgroundColor: '#FFFFFF',
                  height: 4,
                  borderRadius: 2,
                },
              }}
            />
          </Stack>
          <Typography padding="0 12px 0 14px" variant="body2M14" color="content.textNormal" sx={{ whiteSpace: 'nowrap' }}>
            {formatTime(currentTime)}
          </Typography>
        </Stack>
      </Box>

      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata">
          <track kind="captions" />
        </audio>
      )}
    </>
  )
}

export default ContentReader
