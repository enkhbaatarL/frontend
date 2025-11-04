import { Box, Tooltip, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useMemo, useState, useRef, useEffect, MouseEvent, useCallback } from 'react'
import Marquee from 'react-fast-marquee'
import { useNavigate } from 'react-router-dom'

import TickerDetailPanel from './TickerDetailPanel'

import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { ExtendedMarketDataItemInfo } from '@/service/mi/forecast'
import { formatNumberToDecimal, formatValue } from '@/utils/number'

interface Props {
  data?: ExtendedMarketDataItemInfo[]
}

interface DisplayData {
  goodsDataSourceNm: string
  lastValue: number
  change: number
  changePercent: number
  lastUpdateDt: string
  period: string
  currency: string
}

const MarketItemContent = ({
  displayData,
  color,
  isPermitted,
  selected,
}: {
  displayData: DisplayData
  color: string
  isPermitted: boolean
  selected: boolean
}) => (
  <Tooltip
    title={selected ? '' : displayData.goodsDataSourceNm}
    placement="right-start"
    disableInteractive
    followCursor
    slotProps={{
      popper: {
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [14, -6],
            },
          },
        ],
      },
    }}
  >
    <Box display={'flex'} alignItems={'center'} gap={'6px'}>
      <Typography
        fontWeight={600}
        color="#495057"
        component="div"
        fontSize={'14px'}
        lineHeight={1}
        sx={{
          maxWidth: '100px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
        }}
        variant="fileName"
      >
        {displayData.goodsDataSourceNm}
      </Typography>
      <Box display={'flex'} alignItems={'center'} gap={'4px'}>
        <Typography lineHeight={1.4} color="#495057" variant="body2" fontWeight={600} fontSize={'14px'}>
          {formatValue(displayData.lastValue)}
        </Typography>
        <Typography lineHeight={1.4} color={!isPermitted ? '#495057' : color} variant="body2" fontWeight={600} fontSize={'14px'}>
          {formatNumberToDecimal(displayData.changePercent)}%
        </Typography>
      </Box>
    </Box>
  </Tooltip>
)

const MarketItem = ({
  item,
  selected,
  onClickItem,
}: {
  item: ExtendedMarketDataItemInfo
  selected: boolean
  onClickItem: (event: MouseEvent) => void
}) => {
  const summary = item.marketMetaDataSummary
  const isPermitted = item.isPermitted

  const displayData = {
    goodsDataSourceNm: summary.goodsDataSourceNm,
    lastValue: isPermitted ? (summary.lastValue ?? 0.0) : 0.0,
    change: isPermitted ? summary.change : 0.0,
    changePercent: isPermitted ? summary.changePercent : 0.0,
    lastUpdateDt: isPermitted ? dayjs(summary.lastUpdateDt).format('YYYY-MM-DD') : 'YYYY-MM-DD',
    period: isPermitted ? summary.period : '-',
    currency: isPermitted ? summary.currency : 'N/A',
  }

  return (
    <Box
      flexShrink={0}
      bgcolor={'#fff'}
      mx={'20px'}
      p={'4px'}
      data-marquee-item
      onClick={isPermitted ? (event) => onClickItem(event) : undefined}
      sx={{
        cursor: isPermitted ? 'pointer' : 'auto',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: '28px',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ filter: !isPermitted ? 'blur(3px)' : 'none' }}>
          <MarketItemContent displayData={displayData} color={summary.changeColor} isPermitted={isPermitted} selected={selected} />
        </Box>
        {!isPermitted && (
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
            position={'absolute'}
            sx={{ inset: '-4px -8px', backgroundColor: 'rgba(255, 255, 255, 0.4)', color: '#868E96' }}
          >
            <LockOutlinedIcon width={24} height={24} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

const Ticker = ({ data = [] }: Props) => {
  const navigate = useNavigate()

  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const [selectedItemLeft, setSelectedItemLeft] = useState<number>(8)

  const panelRef = useRef<HTMLDivElement>(null)

  const mappedList: ExtendedMarketDataItemInfo[] = useMemo(() => data, [data])

  const handleItemClick = useCallback(
    (index: number, event: MouseEvent) => {
      if (selectedItemIndex === index) {
        setSelectedItemIndex(null)
      } else {
        setSelectedItemIndex(index)
        const rect = event.currentTarget.getBoundingClientRect()
        const popoverWidth = 400
        const windowWidth = window.innerWidth
        const padding = 8

        let left = Math.max(rect.left, padding)

        if (left + popoverWidth > windowWidth - padding) {
          left = windowWidth - popoverWidth - padding
        }

        setSelectedItemLeft(left)
      }
    },
    [selectedItemIndex],
  )

  const handleViewDetails = useCallback(() => {
    if (selectedItemIndex !== null) {
      const selectedItem = mappedList[selectedItemIndex]
      if (selectedItem?.isPermitted) {
        navigate(`/mi/data-detail/${selectedItem.marketMetaDataSummary.goodsNo}/${selectedItem.marketMetaDataSummary.goodsDataNo}`, {
          state: { goodsDataSrcNo: selectedItem.marketMetaDataSummary.goodsDataSourceNo },
        })
      }
    }
  }, [selectedItemIndex, mappedList, navigate])

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      const clickedElement = event.target as Element
      if (clickedElement.closest('[data-marquee-item]')) {
        return
      }

      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setSelectedItemIndex(null)
      }
    }

    const preventScroll = (e: Event) => {
      e.preventDefault()
    }

    if (selectedItemIndex !== null) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('wheel', preventScroll, { passive: false })
      document.addEventListener('touchmove', preventScroll, { passive: false })
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.position = 'unset'
      document.body.style.width = 'unset'
      document.removeEventListener('wheel', preventScroll)
      document.removeEventListener('touchmove', preventScroll)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('wheel', preventScroll)
      document.removeEventListener('touchmove', preventScroll)
      document.body.style.overflow = 'unset'
      document.body.style.position = 'unset'
      document.body.style.width = 'unset'
    }
  }, [selectedItemIndex])

  return (
    <>
      <Box
        sx={{
          overflowX: 'hidden',
          bgcolor: '#fff',
          borderBottom: '1px solid #DEE2E6',
          height: '40px',
        }}
      >
        <Marquee
          pauseOnHover={true}
          gradient={false}
          speed={20}
          style={{ height: '40px', backgroundColor: '#FFFFFF' }}
          autoFill
          play={selectedItemIndex === null}
        >
          {mappedList.map((item, index) => (
            <Box key={`${item.marketMetaDataSummary.goodsDataSourceNo}-${item.marketMetaDataSummary.goodsNo}`} position="relative">
              <MarketItem item={item} selected={selectedItemIndex === index} onClickItem={(event) => handleItemClick(index, event)} />
            </Box>
          ))}
        </Marquee>
      </Box>
      {selectedItemIndex !== null && (
        <Box ref={panelRef} position="fixed" top={146} left={selectedItemLeft} zIndex={10}>
          <TickerDetailPanel
            item={mappedList[selectedItemIndex]}
            onClose={() => setSelectedItemIndex(null)}
            onViewDetails={handleViewDetails}
          />
        </Box>
      )}
    </>
  )
}

export default Ticker
