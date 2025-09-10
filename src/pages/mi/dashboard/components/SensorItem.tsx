import RegionIcon from '@mui/icons-material/SouthAmerica'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Typography, Divider, Collapse, Fade } from '@mui/material'
import { isEmpty } from 'lodash-es'
import { useState } from 'react'

import SourceDropdownChip from './SourceDropdownChip'
import Summarizing from './Summarizing'

import { SourceOption } from '@/service/mi/dashboard'

type OutlookType = 'positive' | 'negative' | 'neutral'
type RegionType = 'Global' | 'Asia Pacific'

export interface SensorItemData {
  id: string
  time: string
  date: string
  region: RegionType
  sources: SourceOption[]
  outlook?: OutlookType
  title: string
  content?: string
}

const OutlookIcon = ({ type, color }: { type: OutlookType; color?: string }) => {
  const iconProps = { fontSize: 'small' as const, sx: { color } }

  switch (type) {
    case 'positive':
      return <TrendingUpIcon {...iconProps} />
    case 'negative':
      return <TrendingDownIcon {...iconProps} />
    case 'neutral':
    default:
      return <TrendingFlatIcon {...iconProps} />
  }
}

const OutlookChip = ({ type }: { type: OutlookType }) => {
  const getColor = () => {
    if (type === 'positive') return '#498B47'
    if (type === 'negative') return '#CC4D50'
    return '#868E96'
  }

  return (
    <Box display="flex" alignItems="center" gap={0.5} padding="2px 4px" borderRadius="6px" height={24}>
      <OutlookIcon type={type} color={getColor()} />
    </Box>
  )
}

const RegionChip = ({ region }: { region: RegionType }) => (
  <Box display="flex" alignItems="center" gap={0.5}>
    <RegionIcon sx={{ fontSize: 16, color: '#868E96' }} />
    <Typography variant="body3" color="gray.70" fontSize={12} fontWeight={500}>
      {region}
    </Typography>
  </Box>
)

interface SensorItemProps {
  item: SensorItemData
  onSourceSelected?: (source: SourceOption) => void
  onContentLoad?: (item: SensorItemData, content: string) => void
}

const SensorItem = ({ item, onSourceSelected, onContentLoad }: SensorItemProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSourceSelected = (source: SourceOption) => {
    onSourceSelected?.(source)
  }

  const handleClick = () => {
    if (isEmpty(item.content)) {
      setIsOpen(true)
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        const content =
          'S&P, 관세 수익 반영해 미국 AA+ 신용 등급 유지\n\n관세 수익이 미국의 신용 등급에 긍정적 영향을 미침\nS&P가 미국의 AA+ 등급을 유지하기로 결정\n관세 정책이 경제에 미치는 영향에 대한 긍정적 평가\n향후 관세 정책의 지속 가능성에 대한 관심 증가'
        onContentLoad?.(item, content)
      }, 1000)
    } else {
      setIsOpen(!isOpen)
    }
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      padding="4px"
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: '#F4F6FF',
        },
      }}
      onClick={handleClick}
    >
      <Box display="flex">
        <Box display="flex" flexDirection="column" alignItems="center" gap="8px" width={60} px="5px" pb="8px">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            borderRadius="4px"
            textAlign="center"
            width={47}
            height={30}
            pt="10px"
          >
            <Typography variant="body2SB14" color="gray.70">
              {item.time}
            </Typography>
            <Typography variant="subtext4" color="gray.60" fontSize={11}>
              {item.date}
            </Typography>
          </Box>
          <Box width={0} height="100%" borderLeft="0.5px solid #ADB5BD" />
        </Box>

        <Box display="flex" flexDirection="column" gap="2px" py="8px" pr="8px" flex={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap="5px">
              <RegionChip region={item.region} />
              <Divider orientation="vertical" flexItem sx={{ margin: '6px 6px 0 5px', height: 8 }} />
              <SourceDropdownChip sources={item.sources} onSourceSelected={handleSourceSelected} />
            </Box>
            {item.outlook && <OutlookChip type={item.outlook} />}
          </Box>

          <Typography variant="body1" color="gray.90" fontWeight={600} fontSize={16} lineHeight={1.4}>
            {item.title}
          </Typography>

          <Collapse
            in={isOpen}
            timeout={300}
            sx={{
              '& .MuiCollapse-wrapper': {
                transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
              },
            }}
          >
            <Box>
              {isLoading ? (
                <Box pr="24px">
                  <Summarizing />
                </Box>
              ) : (
                <Box>
                  <Fade in={!isEmpty(item.content)} timeout={800}>
                    <Box pt="10px">
                      <Typography variant="body1R16" color="gray.60" sx={{ fontSize: 14, lineHeight: 1.4 }}>
                        {item.content}
                      </Typography>
                    </Box>
                  </Fade>
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Box>
  )
}

export default SensorItem
