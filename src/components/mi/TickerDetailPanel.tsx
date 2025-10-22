import { Box, Typography, Tooltip } from '@mui/material'
import cloneDeep from 'lodash-es/cloneDeep'
import { MouseEvent, useRef, useEffect, useState } from 'react'
// import { useTranslation } from 'react-i18next'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
import { ProcessedMarketDataItem } from '@/components/mi/Ticker'

interface TickerDetailPanelProps {
  item: ProcessedMarketDataItem
  onClose?: (event: MouseEvent<HTMLButtonElement>) => void
  onViewDetails?: (event: MouseEvent<HTMLButtonElement>) => void
}

const TickerDetailPanel = ({ item: originalItem, onClose, onViewDetails }: TickerDetailPanelProps) => {
  const titleRef = useRef<HTMLSpanElement>(null)
  const [isTitleOverflow, setIsTitleOverflow] = useState(false)

  const item = cloneDeep(originalItem)

  const getChangeData = () => {
    const { dodChangeValue, dodChangeRate, wowChangeValue, wowChangeRate, momChangeValue, momChangeRate } = item.marketMetaDataSummary

    if (dodChangeValue !== null && dodChangeValue !== undefined && dodChangeRate !== null && dodChangeRate !== undefined) {
      return { change: dodChangeValue, changePercent: dodChangeRate, period: 'DoD' }
    }
    if (wowChangeValue !== null && wowChangeValue !== undefined && wowChangeRate !== null && wowChangeRate !== undefined) {
      return { change: wowChangeValue, changePercent: wowChangeRate, period: 'WoW' }
    }
    if (momChangeValue !== null && momChangeValue !== undefined && momChangeRate !== null && momChangeRate !== undefined) {
      return { change: momChangeValue, changePercent: momChangeRate, period: 'MoM' }
    }
    return { change: 0, changePercent: 0, period: undefined }
  }

  const changeData = getChangeData()
  item.marketMetaDataSummary.change = changeData.change
  item.marketMetaDataSummary.changePercent = changeData.changePercent
  const currency = item.marketMetaDataSummary.currency || ''
  const currentUnitCd = item.marketMetaDataSummary.currentUnitCd || ''
  const unitParts = [currency, currentUnitCd].filter(Boolean)
  item.marketMetaDataSummary.unit = unitParts.length > 0 ? unitParts.join('/') : '-'
  item.marketMetaDataSummary.period = changeData.period ? changeData.period : '-'
  item.marketMetaDataSummary.previousValue = item.marketMetaDataSummary.previousValue || '-'
  item.marketMetaDataSummary.providerName = item.marketMetaDataSummary.providerName || '-'
  item.marketMetaDataSummary.goodsDataSourceExpn = item.marketMetaDataSummary.goodsDataSourceExpn ||  undefined

  // change 값에 따른 색상 결정
  const getChangeColor = (value: number) => {
    if (value > 0) return 'increase'
    if (value < 0) return 'decrease'
    return 'gray.70'
  }

  const titleText = item.marketMetaDataSummary.goodsDataSourceNm

  useEffect(() => {
    if (titleRef.current) {
      setIsTitleOverflow(titleRef.current.scrollWidth > titleRef.current.clientWidth)
    }
  }, [titleText])

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
        {isTitleOverflow ? (
          <Tooltip title={titleText} arrow>
            <Typography
              ref={titleRef}
              variant="contentTitle"
              color="gray.70"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
                flex: 1,
              }}
            >
              {titleText}
            </Typography>
          </Tooltip>
        ) : (
          <Typography
            ref={titleRef}
            variant="contentTitle"
            color="gray.70"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
              flex: 1,
            }}
          >
            {titleText}
          </Typography>
        )}
      </Box>

      <Box sx={{ mt: '-1px' }}>
        <MILine />
      </Box>

      <Box py="12px" display="flex" gap="8px">
        <Box flex={1} display="flex" flexDirection="column" gap="2px">
          <Typography variant="body3" color="gray.60" >
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
              <Typography variant="body3" color="gray.60" >
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
            <Typography variant="body3M12" color="gray.60" style={{  lineHeight: '1.4', display: 'inline-block' }}>
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
