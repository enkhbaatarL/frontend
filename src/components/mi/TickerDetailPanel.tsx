import { Box, Typography } from '@mui/material'
import cloneDeep from 'lodash-es/cloneDeep'
import { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
import { ProcessedMarketDataItem } from '@/components/mi/Ticker'

interface TickerDetailPanelProps {
  item: ProcessedMarketDataItem
  onClose?: (event: MouseEvent<HTMLButtonElement>) => void
  onViewDetails?: (event: MouseEvent<HTMLButtonElement>) => void
}

const TickerDetailPanel = ({ item: originalItem, onClose, onViewDetails }: TickerDetailPanelProps) => {
  const { t } = useTranslation()

  // TODO: 퍼블리싱을 위한 임시 값 제거
  const item = cloneDeep(originalItem)
  item.marketMetaDataSummary.change = -1.51
  item.marketMetaDataSummary.changePercent = -2.379
  item.marketMetaDataSummary.unit = 'USD/bbl'
  item.marketMetaDataSummary.period = 'DoD'
  item.marketMetaDataSummary.previousClose = 63.48
  item.marketMetaDataSummary.dayRange = '61.4500 - 63.4900'
  item.marketMetaDataSummary.source = 'LSEG'
  item.marketMetaDataSummary.description = t('temp.ticker.description')

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
          height: '22px',
          transform: 'rotate(0deg)',
          opacity: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Typography variant="contentTitle" color="gray.70">
          {item.marketMetaDataSummary.goodsDataSourceNm}
        </Typography>
      </Box>

      <MILine />

      <Box py="12px" display="flex" gap="8px">
        <Box flex={1} display="flex" flexDirection="column" gap="2px">
          <Typography variant="body3" color="gray.60">
            Last
          </Typography>
          <Typography variant="infoDocument" color="gray.70">
            {item.marketMetaDataSummary.lastValue}
          </Typography>
          <Typography variant="body1" color="decrease">
            {`${item.marketMetaDataSummary.change} (${item.marketMetaDataSummary.changePercent}%)`}
          </Typography>
          <Typography variant="body3" color="gray.60">
            {item.marketMetaDataSummary.lastUpdateDt}
          </Typography>
        </Box>
        <Box flex={1} display="flex" flexDirection="column" gap="16px">
          <Box display="flex">
            <Box flex={1} display="flex" flexDirection="column" gap="2px">
              <Typography variant="body3" color="gray.60">
                Unit
              </Typography>
              <Typography variant="body2SB14" color="gray.70">
                {item.marketMetaDataSummary.unit}
              </Typography>
            </Box>
            <Box flex={1} display="flex" flexDirection="column" gap="2px">
              <Typography variant="body3" color="gray.60">
                Period
              </Typography>
              <Typography variant="body2SB14" color="gray.70">
                {item.marketMetaDataSummary.period}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" flexDirection="column" gap="2px">
            <Typography variant="body3" color="gray.60">
              Previous Close
            </Typography>
            <Typography variant="body2SB14" color="gray.70">
              {item.marketMetaDataSummary.previousClose}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap="2px">
            <Typography variant="body3" color="gray.60">
              Day&apos;s Range
            </Typography>
            <Typography variant="body2SB14" color="gray.70">
              {item.marketMetaDataSummary.dayRange}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap="2px">
            <Typography variant="body3" color="gray.60">
              Source
            </Typography>
            <Typography variant="body2SB14" color="gray.70">
              {item.marketMetaDataSummary.source}
            </Typography>
          </Box>
        </Box>
      </Box>

      {item.marketMetaDataSummary.description && (
        <>
          <MILine />
          <Box py="8px">
            <Typography variant="body3" color="gray.60">
              {item.marketMetaDataSummary.description}
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
