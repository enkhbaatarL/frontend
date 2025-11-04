import { Box, Typography, Tooltip } from '@mui/material'
import { MouseEvent, useRef, useState, useEffect } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
import { ExtendedMarketDataItemInfo } from '@/service/mi/forecast'

interface TickerDetailPanelProps {
  item: ExtendedMarketDataItemInfo
  onClose?: (event: MouseEvent<HTMLButtonElement>) => void
  onViewDetails?: (event: MouseEvent<HTMLButtonElement>) => void
}

const TruncatedTextWithTooltip = ({ text, ...typographyProps }: { text: string } & React.ComponentProps<typeof Typography>) => {
  const textRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const element = textRef.current
    if (element) {
      setIsOverflowing(element.scrollWidth > element.clientWidth)
    }
  }, [text])

  const typography = (
    <Typography ref={textRef} {...typographyProps}>
      {text}
    </Typography>
  )

  return isOverflowing ? (
    <Tooltip title={text} arrow>
      {typography}
    </Tooltip>
  ) : (
    typography
  )
}

const TickerDetailPanel = ({ item, onClose, onViewDetails }: TickerDetailPanelProps) => {
  // change 값에 따른 색상 결정
  const getChangeColor = (value: number) => {
    if (value > 0) return 'increase'
    if (value < 0) return 'decrease'
    return 'gray.70'
  }

  const titleText = item.marketMetaDataSummary.goodsDataSourceNm

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #DEE2E6',
        width: '400px',
        borderRadius: '4px',
        gap: '8px',
        borderWidth: '1px',
        padding: '12px 14px',
        opacity: 1,
        boxShadow: '0px 0px 8px 0px #00000026',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '21px',
          transform: 'rotate(0deg)',
          opacity: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <TruncatedTextWithTooltip
          text={titleText}
          variant="contentTitle"
          color="gray.70"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
            flex: 1,
          }}
        />
      </Box>

      <Box sx={{ mt: '-1px' }}>
        <MILine />
      </Box>

      <Box py="12px" display="flex" gap="8px">
        <Box flex={1} display="flex" flexDirection="column" gap="2px">
          <Typography variant="body3" color="gray.60">
            Last
          </Typography>
          <Typography variant="infoDocument" color="gray.70" sx={{ mt: '-3px' }}>
            {item.marketMetaDataSummary.lastValue}
          </Typography>
          <Typography variant="body1" color={getChangeColor(item.marketMetaDataSummary.change)} sx={{ mt: '-1px' }}>
            {`${item.marketMetaDataSummary.change} (${item.marketMetaDataSummary.changePercent}%)`}
          </Typography>
          <Typography variant="body3" color="gray.60" sx={{ mt: '-2px' }}>
            {item.marketMetaDataSummary.lastUpdateDt}
          </Typography>
        </Box>
        <Box flex={1} display="flex" flexDirection="column" gap="16px">
          <Box display="flex">
            <Box flex={1} display="flex" flexDirection="column" gap="2px">
              <Typography variant="body3" color="gray.60">
                Unit
              </Typography>
              <Typography variant="body2SB14" color="gray.70" sx={{ mt: '-2px' }}>
                {item.marketMetaDataSummary.unit}
              </Typography>
            </Box>
            <Box flex={1} display="flex" flexDirection="column" gap="2px">
              <Typography variant="body3" color="gray.60">
                Period
              </Typography>
              <Typography variant="body2SB14" color="gray.70" sx={{ mt: '-2px' }}>
                {item.marketMetaDataSummary.period}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" flexDirection="column" gap="2px" sx={{ mt: '-3px' }}>
            <Typography variant="body3" color="gray.60">
              Previous Close
            </Typography>
            <Typography variant="body2SB14" color="gray.70" sx={{ mt: '-2px' }}>
              {item.marketMetaDataSummary.previousValue}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap="2px" sx={{ mt: '-4px' }}>
            <Typography variant="body3" color="gray.60">
              Source
            </Typography>
            <Typography variant="body2SB14" color="gray.70" sx={{ mt: '-1px' }}>
              {item.marketMetaDataSummary.providerName}
            </Typography>
          </Box>
        </Box>
      </Box>

      {item.marketMetaDataSummary.goodsDataSourceExpn && (
        <>
          <Box sx={{ mt: '-1px', mb: '4px' }}>
            <MILine />
          </Box>
          <Box sx={{ mt: '3px', mb: '8px' }}>
            <Typography variant="body3M12" color="gray.60" style={{ lineHeight: '1.4', display: 'inline-block' }}>
              {item.marketMetaDataSummary.goodsDataSourceExpn}
            </Typography>
          </Box>
        </>
      )}

      <Box display="flex" justifyContent="space-between">
        <MIButton size="h32" type="outlined" color="gray" onClick={onClose}>
          Close
        </MIButton>
        <MIButton size="h32" type="filled" color="primary" onClick={onViewDetails}>
          View details
        </MIButton>
      </Box>
    </Box>
  )
}

export default TickerDetailPanel
