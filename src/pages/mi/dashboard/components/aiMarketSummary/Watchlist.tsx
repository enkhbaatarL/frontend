import { Box, Stack, Typography, TypographyProps, Tooltip } from '@mui/material'
import { ReactNode, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import { useMarketData } from '@/contexts/MarketDataContext'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import { formatNumberToDecimal, formatValue } from '@/utils/number'

const HeaderCell = ({ children, width, textAlign }: { children: ReactNode; width: string; textAlign: TypographyProps['textAlign'] }) => (
  <Typography px="8px" variant="body2SB14" color="gray.60" width={width} boxSizing="border-box" textAlign={textAlign}>
    {children}
  </Typography>
)

interface BodyCellProps extends TypographyProps {
  width?: string
  textAlign: TypographyProps['textAlign']
  color: TypographyProps['color']
}

const BodyCell = ({ children, width, textAlign, color, ...props }: BodyCellProps) => {
  const textRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth
        setIsOverflowing(isOverflow)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)

    return () => window.removeEventListener('resize', checkOverflow)
  }, [children])

  const content = (
    <Typography
      ref={textRef}
      px="8px"
      variant="body2SB14"
      color={color}
      width={width}
      boxSizing="border-box"
      textAlign={textAlign}
      noWrap
      sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
      {...props}
    >
      {children}
    </Typography>
  )

  return isOverflowing ? (
    <Tooltip title={children} placement="top" followCursor>
      {content}
    </Tooltip>
  ) : (
    content
  )
}

const Watchlist = () => {
  const { marketDataList, marketDataIsLoading } = useMarketData()
  const navigate = useNavigate()

  return (
    <Box padding="12px">
      <SectionHeader
        title="Watchlist"
        link="/mi/market-data"
        tooltipTitle="시장에서 가장 중요하게 모니터링되는 가격 및 공급 지표를 제공합니다. 실시간 변동을 통해 시장의 단기 흐름과 가격 방향성을 파악할 수 있습니다."
        mb="10px"
        bold
      />
      <Stack sx={{ userSelect: 'none' }}>
        {marketDataIsLoading ? (
          <>
            <Stack direction="row" alignItems="center" height="32px" gap="4px" borderBottom="1px solid #868E96">
              <HeaderCell width="276px" textAlign="left">
                Name
              </HeaderCell>
              <HeaderCell width="100px" textAlign="right">
                Price
              </HeaderCell>
              <HeaderCell width="90px" textAlign="right">
                Change
              </HeaderCell>
              <HeaderCell width="90px" textAlign="right">
                Change %
              </HeaderCell>
            </Stack>
            {Array.from({ length: 10 }, (_, index) => (
              <Stack
                key={`watchlist-skeleton-${index}`}
                direction="row"
                alignItems="center"
                height="38px"
                gap="4px"
                borderTop={index === 0 ? 'none' : '1px solid #DEE2E6'}
              >
                <Box display="flex" alignItems="center" width="100%" gap="4px">
                  <Box width="34px" pr="3px" display="flex" alignItems="center" justifyContent="center">
                    <MIBaseSkeleton.Avatar width={20} height={20} />
                  </Box>
                  <Box width="238px" pl="3px">
                    <MIBaseSkeleton.TextLine width="180px" height={14} />
                  </Box>
                  <Box width="100px" display="flex" justifyContent="flex-end">
                    <MIBaseSkeleton.TextLine width="60px" height={14} />
                  </Box>
                  <Box width="90px" display="flex" justifyContent="flex-end">
                    <MIBaseSkeleton.TextLine width="50px" height={14} />
                  </Box>
                  <Box width="90px" display="flex" justifyContent="flex-end" pr="16px">
                    <MIBaseSkeleton.TextLine width="45px" height={14} />
                  </Box>
                </Box>
              </Stack>
            ))}
          </>
        ) : !marketDataList || marketDataList.length === 0 ? (
          <Stack height={352} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
            <Typography variant="body2SB14" color="gray.50">
              No data available to display.
            </Typography>
          </Stack>
        ) : (
          <>
            <Stack direction="row" alignItems="center" height="32px" gap="4px" borderBottom="1px solid #868E96">
              <HeaderCell width="276px" textAlign="left">
                Name
              </HeaderCell>
              <HeaderCell width="100px" textAlign="right">
                Price
              </HeaderCell>
              <HeaderCell width="90px" textAlign="right">
                Change
              </HeaderCell>
              <HeaderCell width="90px" textAlign="right">
                Change %
              </HeaderCell>
            </Stack>
            {marketDataList.slice(0, 15).map(({ isPermitted, marketMetaDataSummary: item }, index) => (
              <Stack
                key={`watchlist-item-${item.goodsNo}-${item.goodsDataNo}-${item.goodsDataSourceNo}`}
                direction="row"
                alignItems="center"
                height="38px"
                gap="4px"
                borderTop={index === 0 ? 'none' : '1px solid #DEE2E6'}
                sx={{
                  '&:hover': {
                    backgroundColor: isPermitted ? '#F8F9FA' : 'transparent',
                  },
                  cursor: isPermitted ? 'pointer' : 'auto',
                  position: 'relative',
                }}
                onClick={
                  isPermitted
                    ? () => {
                      navigate(`/mi/data-detail/${item.goodsNo}/${item.goodsDataNo}`, {
                        state: { goodsDataSrcNo: item.goodsDataSourceNo },
                      })
                    }
                    : undefined
                }
              >
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: '4px',
                    filter: isPermitted ? 'none' : 'blur(3px)',
                  }}
                >
                  <BodyCell width="34px" textAlign="left" color="gray.70" pr="3px">
                    <Stack
                      width="20px"
                      height="20px"
                      color="#FFFFFF"
                      borderRadius="50%"
                      alignItems="center"
                      justifyContent="center"
                      fontSize={12}
                      sx={{
                        backgroundColor: 'gray.50',
                      }}
                    >
                      {item.frequency ?? 'D'}
                    </Stack>
                  </BodyCell>
                  <BodyCell width="238px" textAlign="left" color="gray.70" pl="3px">
                    {item.goodsDataSourceNm}
                  </BodyCell>
                  <BodyCell width="100px" textAlign="right" color="gray.70">
                    {isPermitted ? formatValue(item.lastValue, '', 'en-US', 2) : '12.34'}
                  </BodyCell>
                  <BodyCell width="90px" textAlign="right" color={isPermitted ? item.changeColor : 'gray.70'}>
                    {isPermitted ? formatValue(item.change, '', 'en-US', 2) : '56.78'}
                  </BodyCell>
                  <BodyCell width="90px" textAlign="right" color={isPermitted ? item.changePercentColor : 'gray.70'}>
                    {isPermitted ? formatNumberToDecimal(item.changePercent) : '12.34'}%
                  </BodyCell>
                </Box>
                {!isPermitted && (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    position="absolute"
                    sx={{
                      inset: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.4)',
                      color: '#868E96',
                    }}
                  >
                    <LockOutlinedIcon width={20} height={20} />
                  </Box>
                )}
              </Stack>
            ))}
          </>
        )}
      </Stack>
    </Box>
  )
}

export default Watchlist
