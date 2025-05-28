import InsertChartRoundedIcon from '@mui/icons-material/InsertChartRounded'
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded'
import { Box, Button, Typography } from '@mui/material'
import Tooltip from '@mui/material/Tooltip'
import React, { useEffect, useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
type ReferLink = { label: string; url: string }

const BtnRefernceLink = ({ text, url }: { text: string; url: string }) => {
  const areaRef = React.useRef<HTMLDivElement>(null)
  const [isOverflow, setIsOverflow] = React.useState(false)
  const checkOverflow = () => {
    if (areaRef.current) {
      setIsOverflow(areaRef.current.scrollWidth > areaRef.current.clientWidth)
    }
  }

  useEffect(() => {
    checkOverflow()

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow()
    })

    if (areaRef.current) {
      resizeObserver.observe(areaRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [text])

  return (
    <Tooltip disableHoverListener={!isOverflow} title={text}>
      <Button
        onClick={(e) => {
          e.preventDefault()
          // window.open(url)
          window.location.href = url
        }}
        endIcon={<KeyboardArrowRightRoundedIcon sx={{ color: '#868E96' }} fontSize={'small'} />}
        startIcon={<InsertChartRoundedIcon sx={{ color: '#343A40' }} fontSize={'small'} />}
        disableRipple
        sx={{
          borderRadius: '4px',
          background: '#fff',
          border: '1px solid',
          padding: '4px 8px',
          borderColor: 'gray.30',
          color: 'gray.70',
          fontSize: '12px',
          fontWeight: '400',
          lineHeight: '1.4',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxSizing: 'border-box',
          maxWidth: '100%',
          '&:hover': {
            backgroundColor: '#EDECEA',
            svg: {
              color: '#343A40',
            },
          },
        }}
      >
        <Typography
          ref={areaRef}
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          variant={'subtext2'}
          color={'gray.70'}
        >
          {text}
        </Typography>
      </Button>
    </Tooltip>
  )
}
const MIAgentRefernce = ({ referLink, onclick }: { referLink: ReferLink[]; onclick?: () => void }) => {
  const [showBtn, setShowBtn] = useState<boolean>(true)
  const handleLoadMore = () => {
    if (onclick) {
      onclick()
      setShowBtn(false)
    }
  }

  return (
    <>
      {referLink && (
        <Box display="flex" alignItems="start" flexDirection="column" gap={1.5}>
          <Typography py={1} component="div" variant="mariParagraph" color="gray.90">
            해당 정보는 다음의 데이터를 참고하였습니다.
          </Typography>

          <Typography pt={2} component="div" variant="mariDescription" color="gray.70">
            응답과 연관있는 데이터
          </Typography>

          {referLink.map((item, index) => (
            <BtnRefernceLink key={index} text={item.label} url={item.url} />
          ))}
          {showBtn && (
            <MIButton onClick={handleLoadMore} type="ghost" color="gray" size="h28" contentType="link">
              Load more data
            </MIButton>
          )}
        </Box>
      )}
    </>
  )
}

export default MIAgentRefernce
