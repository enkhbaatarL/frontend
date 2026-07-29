import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/Settings'
import SouthAmericaIcon from '@mui/icons-material/SouthAmerica'
import { Box, Divider, Stack, Switch, Typography, useTheme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import topicTrackerIcon from '@/assets/dashboard/topic-tracker.svg'
import MIButton from '@/components/common/button/MIButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import AsyncAutocomplete from '@/components/common/input/AsyncAutocomplete'
import MIMenu from '@/components/common/menu/MIMenu'
import { SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import MITopic, { Topic } from '@/components/common/topic/MITopic'
import { MIBaseSkeleton, SkeletonWrapper } from '@/components/mi/MIBaseSkeleton'
import useCodeData from '@/hooks/useCodeData'
import AiSummary, { AiSummaryHandle, AiSummaryData } from '@/pages/mi/dashboard/components/common/AiSummary'
import CategoryChip from '@/pages/mi/dashboard/components/common/CategoryChip'
import DashboardCard from '@/pages/mi/dashboard/components/common/DashboardCard'
import dashboardService from '@/service/mi/dashboard'
import topicTrackerService, { ITopicTrackerWidgetItem } from '@/service/mi/topicTracker'
import { getRandomNumber } from '@/utils/random'

const TopicTrackerItem = ({ item }: { item: ITopicTrackerWidgetItem }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const aiSummaryRef = useRef<AiSummaryHandle>(null)
  const { regionCategoryCodeList } = useCodeData()
  const navigate = useNavigate()

  const handleClick = () => {
    const newExpandedState = !isExpanded
    setIsExpanded(newExpandedState)

    if (newExpandedState) {
      aiSummaryRef.current?.open()
    } else {
      aiSummaryRef.current?.close()
    }
  }

  const handleViewOriginal = () => {
    navigate(`/mi/market-news/${item.newsSummaryId}`)
  }

  const fetchTopicSummary = async (): Promise<AiSummaryData> => {
    const summaryData: AiSummaryData = {
      title: item.title,
      summary: item.summary ?? [],
    }

    return new Promise<AiSummaryData>((resolve) => {
      setTimeout(() => {
        resolve(summaryData)
      }, 1000)
    })
  }

  return (
    <Stack
      padding="12px 10px"
      sx={{
        cursor: 'pointer',
        borderRadius: '10px',
        '&:hover': {
          backgroundColor: 'contentBG.Hover',
        },
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        userSelect: 'none',
      }}
    >
      <Stack direction="row" onClick={handleClick}>
        <Stack width="60px" alignItems="center" gap="8px" flexShrink={0}>
          <Stack>
            <Typography variant="body1M16" color="contentText.Normal">
              {dayjs(item.firstCreated).format('HH:mm')}
            </Typography>
            <Typography variant="body2M14" color="contentText.Subtext">
              {dayjs(item.firstCreated).format('MMM D')}
            </Typography>
          </Stack>
          <Divider orientation="vertical" variant="middle" component="div" color="contentBorder.Normal" sx={{ flex: 1, width: '1px' }} />
        </Stack>
        <Stack px="8px" flex={1} overflow="hidden">
          <Stack direction="row" gap="8px">
            <CategoryChip padding="6px 8px">
              <Typography variant="labelText" color="content.textNormal">
                # {item.newsTopicName}
              </Typography>
            </CategoryChip>
            {item.regions.map((region) => (
              <CategoryChip key={region} padding="6px 8px 6px 6px">
                <Stack direction="row" alignItems="center" gap="4px">
                  <SouthAmericaIcon sx={{ fontSize: 16, color: 'content.iconEnabled' }} />
                  <Typography variant="labelText" color="content.textNormal">
                    {regionCategoryCodeList?.find((code) => code.codeId === region)?.codeNm || region}
                  </Typography>
                </Stack>
              </CategoryChip>
            ))}
          </Stack>
          <Stack py="12px" gap="4px">
            <Typography
              py="4px"
              variant="heading4"
              fontWeight={500}
              sx={{
                overflow: isExpanded ? 'visible' : 'hidden',
                textOverflow: isExpanded ? 'unset' : 'ellipsis',
                whiteSpace: isExpanded ? 'normal' : 'nowrap',
                width: '100%',
              }}
            >
              {item.title}
            </Typography>
            <Stack direction="row" gap="8px">
              {item.provider && (
                <>
                  <Typography variant="body2R14" color="content.textNormal">
                    {item.provider}
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: '12px', borderColor: 'contentBorder.Normal' }} />
                </>
              )}
              <Typography variant="body2R14" color="content.textNormal">
                {dayjs(item.firstCreated).format('MMMM D, YYYY [at] hh:mm A')}
              </Typography>
            </Stack>
          </Stack>
          <AiSummary
            ref={aiSummaryRef}
            fetchSummary={fetchTopicSummary}
            viewOriginal={handleViewOriginal}
            itemIsViewable={item.isViewable}
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

const SettingsMenuItem = ({
  item: { label, value, disabled },
  isDisplayed,
  onToggle,
}: {
  item: SelectMenuItem
  isDisplayed: boolean
  onToggle: (value: string) => void
}) => (
  <Box
    key={value}
    onClick={() => (disabled ? null : onToggle(value))}
    borderRadius="10px"
    py="4px"
    sx={{
      cursor: disabled ? 'default' : 'pointer',
      textWrap: 'nowrap',
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap="12px" component="div">
      <Typography
        variant="body2M14"
        color={isDisplayed ? 'gray.70' : 'gray.60'}
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {label}
      </Typography>
      <Switch
        checked={isDisplayed}
        size="small"
        disabled={disabled}
        sx={{
          margin: 0,
        }}
      />
    </Stack>
  </Box>
)

interface Props {
  criteriaDate?: string
}

const TopicTracker = ({ criteriaDate }: Props) => {
  const [demo] = useState(true)

  const theme = useTheme()

  const [selectedTopic, setSelectedTopic] = useState<number | undefined>(undefined)
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const [displayStates, setDisplayStates] = useState<{ [key: string]: boolean }>({})
  const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false)
  const [topicName, setTopicName] = useState('')
  const [previousItemsLength, setPreviousItemsLength] = useState(4)

  const { data: topicsData, isLoading: isTopicsLoading } = useQuery({
    queryKey: ['topicTrackerTopics'],
    queryFn: topicTrackerService.getTopics,
  })

  const topics: Topic[] = [
    {
      newsTopicId: undefined,
      iconImagePath: '',
      newsTopicName: 'All',
      userRegisteredYn: 'N',
    },
    ...(topicsData || []),
  ]

  const { data: widgetData, isLoading: isWidgetLoading } = useQuery({
    queryKey: ['topicTrackerWidget', criteriaDate, selectedTopic],
    queryFn: async () => {
      const data = await topicTrackerService.getWidgetData({
        criteriaDate: criteriaDate!,
        newsTopicId: selectedTopic,
      })
      return data
    },
    enabled: !!topicsData && !!criteriaDate,
  })

  const filteredData = widgetData?.filter((item) => {
    if (selectedTopic === undefined) {
      return true
    }
    return item.newsTopicId === selectedTopic
  })

  useEffect(() => {
    if (topicsData && Object.keys(displayStates).length === 0) {
      const initialStates: { [key: string]: boolean } = {}
      topicsData.forEach((topic) => {
        if (topic.newsTopicId !== undefined && topic.newsTopicId !== null) {
          initialStates[topic.newsTopicId.toString()] = true
        }
      })
      setDisplayStates(initialStates)
    }
  }, [topicsData])

  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      setPreviousItemsLength(filteredData.length)
    }
  }, [filteredData])

  const switchOptions: SelectMenuItem[] = []

  const handleSwitchToggle = (value: string) => {
    setDisplayStates((prev) => ({
      ...prev,
      [value]: !prev[value],
    }))
  }

  const handleAddTopic = (_name: string) => {
    // TODO: 실제 API 호출로 토픽 추가 로직 구현
    setIsAddTopicDialogOpen(false)
    setTopicName('')
  }

  const handleAddTopicClick = () => {
    setTopicName('')
    setIsAddTopicDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsAddTopicDialogOpen(false)
    setTopicName('')
  }

  return (
    <DashboardCard
      icon={topicTrackerIcon}
      title="Topic Tracker"
      link="/mi/topic-tracker"
      headerContent={
        <Stack direction="row" gap="8px">
          {!demo && (
            <MIButton
              type="outlined"
              size="h36"
              borderRadius="10px"
              startIcon={
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    '& svg': {
                      fontSize: 20,
                      '& path': {
                        fill: theme.palette.gray[70],
                      },
                    },
                  }}
                >
                  <AddIcon />
                </Box>
              }
              onClick={handleAddTopicClick}
            >
              Add a Topic
            </MIButton>
          )}
          {!demo && (
            <MIMenu
              open={isSettingsMenuOpen}
              label={<SettingsIcon sx={{ width: 20, height: 20, color: 'gray.70' }} />}
              variant="outlined"
              placement="bottom-end"
              menuPositionOffset={{ right: -10 }}
              onOpenChange={setIsSettingsMenuOpen}
              enableHoverBackground
              sx={{
                height: '36px',
                padding: '8px',
              }}
            >
              <Stack padding="12px" gap="12px" minWidth={154} boxSizing="border-box">
                {switchOptions.map((item) => (
                  <SettingsMenuItem key={item.value} item={item} isDisplayed={displayStates[item.value]} onToggle={handleSwitchToggle} />
                ))}
              </Stack>
            </MIMenu>
          )}
        </Stack>
      }
      sx={{
        overflow: 'visible',
      }}
      direction="column"
      collapsedHeight={630}
      gap="20px"
    >
      {isTopicsLoading ? (
        <Stack py="12px">
          <SkeletonWrapper.Row gap="10px">
            {Array.from({ length: 4 }, (_, index) => (
              <MIBaseSkeleton.Chip
                key={index}
                width={getRandomNumber() * 40 + 100}
                height={36}
                sx={{
                  borderRadius: '100px',
                  flexShrink: 0,
                }}
              />
            ))}
          </SkeletonWrapper.Row>
        </Stack>
      ) : (
        <MITopic topics={topics} selectedTopic={selectedTopic} onClick={(topic) => setSelectedTopic(topic.newsTopicId)} />
      )}
      <Stack gap="10px">
        {isWidgetLoading ? (
          <Stack gap="10px">
            {Array.from({ length: previousItemsLength }, (_, index) => {
              const uniqueId = `skeleton-${Date.now()}-${index}`

              return (
                <Fragment key={uniqueId}>
                  {index !== 0 && <Divider color="#DEE2E6" />}
                  <Stack
                    padding="12px 10px"
                    borderRadius="10px"
                    direction="row"
                    gap="8px"
                    sx={{
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  >
                    <Stack width="60px" alignItems="center" gap="8px" flexShrink={0}>
                      <Stack gap="4px">
                        <MIBaseSkeleton.TextLine width={40} height={16} />
                        <MIBaseSkeleton.TextLine width={35} height={14} />
                      </Stack>
                      <Divider
                        orientation="vertical"
                        variant="middle"
                        component="div"
                        color="contentBorder.Normal"
                        sx={{ flex: 1, width: '1px' }}
                      />
                    </Stack>

                    <Stack px="8px" flex={1} gap="8px">
                      <SkeletonWrapper.Row gap="8px">
                        <MIBaseSkeleton.Button width={getRandomNumber() * 30 + 80} height={22} />
                        {index % 2 === 0 && <MIBaseSkeleton.Button width={getRandomNumber() * 20 + 60} height={22} />}
                      </SkeletonWrapper.Row>

                      <Stack my="10px" py="4px" gap="8px">
                        <MIBaseSkeleton.Title width={`${getRandomNumber() * 20 + 85}%`} height={22} sx={{ borderRadius: '4px' }} />
                        <SkeletonWrapper.Row gap="8px" sx={{ alignItems: 'center' }}>
                          <MIBaseSkeleton.TextLine width={60} height={14} />
                          <Divider orientation="vertical" flexItem sx={{ height: '12px', borderColor: 'contentBorder.Normal' }} />
                          <MIBaseSkeleton.TextLine width={180} height={14} />
                        </SkeletonWrapper.Row>
                      </Stack>
                    </Stack>
                  </Stack>
                </Fragment>
              )
            })}
          </Stack>
        ) : (
          <>
            {filteredData?.map((item, index) => (
              <Fragment key={item.newsTopicRelationshipId}>
                {index !== 0 && <Divider color="#DEE2E6" sx={{ my: '10px' }} />}
                <TopicTrackerItem item={item} />
              </Fragment>
            ))}
            {!filteredData || filteredData.length === 0 ? (
              <Stack height={352} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
                <Typography variant="body2SB14" color="gray.50">
                  No data available to display.
                </Typography>
              </Stack>
            ) : null}
          </>
        )}
      </Stack>
      <MIConfirm
        open={isAddTopicDialogOpen}
        title="Add a Topic to Track"
        width={450}
        handleClose={handleDialogClose}
        actions={[
          {
            label: 'Cancel',
            variant: 'outlined',
            color: 'gray',
            onClick: handleDialogClose,
          },
          {
            label: 'Add',
            variant: 'filled',
            color: 'primary',
            disabled: !topicName.trim(),
            onClick: () => handleAddTopic(topicName.trim()),
          },
        ]}
      >
        <AsyncAutocomplete
          height={46}
          asyncFunction={dashboardService.getTopicSimilarKeywords}
          value={topicName}
          textFieldProps={{
            placeholder: 'Type a topic',
            autoFocus: true,
          }}
          onInputChange={(_, newValue) => setTopicName(newValue)}
        />
      </MIConfirm>
    </DashboardCard>
  )
}

export default TopicTracker
