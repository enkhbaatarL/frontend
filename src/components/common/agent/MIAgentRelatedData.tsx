import InsertChartRoundedIcon from '@mui/icons-material/InsertChartRounded'
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
import Tooltip from '@mui/material/Tooltip'
import { t } from 'i18next'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import { IChatQnaAnswerBundle } from '@/service/mi/agent'

interface Props {
  relatedData: IChatQnaAnswerBundle['relatedData']
}

interface RelatedDataBtnProps {
  goodsDatasourceNm: string
  goodsNo: number
  goodsDataNo: number
  goodsDatasourceNo: number
}

const RelatedDataBtn = ({ goodsDatasourceNm, goodsNo, goodsDataNo, goodsDatasourceNo }: RelatedDataBtnProps) => {
  const navigate = useNavigate()
  const [isEllipsis, setIsEllipsis] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const textElement = textRef.current

    if (!textElement) return

    const checkTextWidth = () => {
      textElement.textContent = goodsDatasourceNm
      const fullWidth = textElement.scrollWidth

      if (fullWidth > 320) {
        let currentText = goodsDatasourceNm
        while (textElement.scrollWidth > 320 && currentText.length > 0) {
          currentText = currentText.slice(0, -1)
          textElement.textContent = `${currentText  }...`
        }
        setDisplayText(`${currentText  }...`)
        setIsEllipsis(true)
      } else {
        setDisplayText(goodsDatasourceNm)
        setIsEllipsis(false)
      }
    }

    checkTextWidth()
  }, [goodsDatasourceNm])

  const button = (
    <Button
      onClick={(e) => {
        e.preventDefault()
        navigate(`/mi/data-detail/${goodsNo}/${goodsDataNo}`, { state: { goodsDataSrcNo: goodsDatasourceNo } })
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
        ref={textRef}
        sx={{
          whiteSpace: 'nowrap',
          maxWidth: '400px',
        }}
        variant={'subtext2'}
        color={'gray.70'}
      >
        {displayText}
      </Typography>
    </Button>
  )

  return isEllipsis ? (
    <Tooltip title={goodsDatasourceNm} followCursor disableInteractive>
      {button}
    </Tooltip>
  ) : (
    button
  )
}

const MAX_RELATED_DATA_COUNT = 3

const MIAgentRelatedData = ({ relatedData }: Props) => {
  const [isShowMore, setIsShowMore] = useState<boolean>((relatedData?.length ?? 0) <= MAX_RELATED_DATA_COUNT)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const relatedDataList = useMemo(
    () => (isShowMore ? relatedData : relatedData?.slice(0, MAX_RELATED_DATA_COUNT)),
    [isShowMore, relatedData],
  )

  const handleLoadMore = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsShowMore(true)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Box display="flex" alignItems="start" flexDirection="column" gap={1.5} mt={'12px'}>
      <Typography py={1} component="div" variant="mariParagraph" color="gray.90">
        {t('해당 정보는 다음의 데이터를 참고하였습니다.')}
      </Typography>

      <Typography pt={2} component="div" variant="mariDescription" color="gray.70">
        {t('응답과 연관있는 데이터')}
      </Typography>

      {relatedDataList?.map((item, index) => (
        <RelatedDataBtn
          key={index}
          goodsDatasourceNm={item.goodsDatasourceNm}
          goodsNo={item.goodsNo}
          goodsDataNo={item.goodsDataNo}
          goodsDatasourceNo={item.goodsDatasourceNo}
        />
      ))}
      {!isShowMore && (
        <MIButton onClick={handleLoadMore} type="ghost" color="gray" size="h28" contentType="link" disabled={isLoading}>
          {isLoading ? <CircularProgress size={16} sx={{ color: 'gray.70' }} /> : 'Load more data'}
        </MIButton>
      )}
    </Box>
  )
}

export default MIAgentRelatedData
