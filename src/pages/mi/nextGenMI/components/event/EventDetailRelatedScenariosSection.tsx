import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ListIcon from '@mui/icons-material/List'
import { Box, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import type { RelatedEventScenario, RelatedScenario } from '@/service/mi/nextGenMI/event'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import NextGenMIEventDetailBlockSkeleton from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailBlockSkeleton'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import ScenarioGroupInnerTable from '@/pages/mi/nextGenMI/components/common/ScenarioGroupInnerTable'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import { getNextGenMIEventDesignPath, getNextGenMIScenarioGroupDetailPath, getNextGenMITabPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'

interface EventDetailRelatedScenariosSectionProps {
  eventId?: string | number
  relatedEventScenarios?: RelatedEventScenario[]
  scenarioSuggestReason?: string | null
  scenarioDesignDisabled?: boolean
  scenarioDesignDisabledTooltipTitle?: string
  onScenarioDesignClick?: () => void
  onScenarioRowClick?: (group: RelatedEventScenario, row: RelatedScenario) => void
  loading?: boolean
}

const EventDetailRelatedScenariosSection = ({
  eventId,
  relatedEventScenarios = [],
  scenarioSuggestReason,
  scenarioDesignDisabled = false,
  scenarioDesignDisabledTooltipTitle,
  onScenarioDesignClick,
  onScenarioRowClick,
  loading = false,
}: EventDetailRelatedScenariosSectionProps) => {
  const navigate = useNavigate()
  const groups = relatedEventScenarios.filter((group) => (group.scenarios?.length ?? 0) > 0)
  const trimmedScenarioSuggestReason = scenarioSuggestReason?.trim() ?? ''

  const handleScenarioDesignClick = () => {
    if (onScenarioDesignClick) {
      onScenarioDesignClick()
      return
    }
    if (!eventId) {
      navigate(getNextGenMITabPath('scenarios'))
      return
    }
    navigate(getNextGenMIEventDesignPath(eventId))
  }

  const scenarioDesignButton = (
    <Box component="span" display="inline-flex" sx={{ cursor: scenarioDesignDisabled ? 'not-allowed' : undefined }}>
      <MIBaseButton
        variant="contained"
        prefix={<AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />}
        disabled={scenarioDesignDisabled}
        onClick={handleScenarioDesignClick}
        gap="4px"
        sx={{
          height: '36px',
          borderRadius: '8px',
          padding: '8px 10px 8px 6px',
          backgroundColor: 'mari.Primary',
          '&:hover:not(:disabled)': {
            backgroundColor: 'mari.Primary',
          },
          '&:active:not(:disabled)': {
            backgroundColor: 'mari.Primary',
          },
        }}
      >
        시나리오 설계
      </MIBaseButton>
    </Box>
  )

  if (loading) {
    return (
      <Stack width="100%" gap="12px" py="20px">
        <EventDetailSectionHeader
          icon={<ListIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
          title="관련 시나리오"
          tooltipTitle=""
        />
        <Box bgcolor="gray.5" borderRadius="10px" p="24px">
          <NextGenMIEventDetailBlockSkeleton height="280px" />
        </Box>
      </Stack>
    )
  }

  return (
    <Stack width="100%" minWidth={0} maxWidth="100%" gap="12px" py="20px">
      <EventDetailSectionHeader
        icon={<ListIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
        title="관련 시나리오"
        tooltipTitle=""
      />
      {groups.length === 0 ? (
        <Box position="relative" height="260px" bgcolor="gray.5" borderBottom="1px solid" borderColor="gray.30" overflow="hidden">
          <Stack
            position="absolute"
            top="50%"
            left="50%"
            alignItems="center"
            gap="20px"
            width="calc(100% - 48px)"
            sx={{ transform: 'translate(-50%, -50%)' }}
          >
            <Stack alignItems="center" gap="10px">
              <ErrorOutlineRoundedIcon sx={{ fontSize: 24, color: 'gray.60' }} />
              <Typography variant="body3SB12" color="gray.60" lineHeight={1.4}>
                생성된 시나리오가 없습니다
              </Typography>
            </Stack>
            {trimmedScenarioSuggestReason && (
              <Stack
                alignItems="center"
                gap="10px"
                padding="24px"
                border="1px solid"
                borderColor="contentBorder.Normal"
                borderRadius="10px"
                boxSizing="border-box"
                maxWidth="100%"
              >
                {scenarioDesignDisabled && scenarioDesignDisabledTooltipTitle ? (
                  <NextGenMIFollowCursorTooltip title={scenarioDesignDisabledTooltipTitle}>
                    {scenarioDesignButton}
                  </NextGenMIFollowCursorTooltip>
                ) : (
                  scenarioDesignButton
                )}
                <Typography
                  variant="body3SB12"
                  color="gray.60"
                  lineHeight={1.4}
                  textAlign="center"
                  maxWidth="100%"
                  sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
                >
                  {trimmedScenarioSuggestReason}
                </Typography>
              </Stack>
            )}
            {!trimmedScenarioSuggestReason &&
              (scenarioDesignDisabled && scenarioDesignDisabledTooltipTitle ? (
                <NextGenMIFollowCursorTooltip title={scenarioDesignDisabledTooltipTitle}>
                  {scenarioDesignButton}
                </NextGenMIFollowCursorTooltip>
              ) : (
                scenarioDesignButton
              ))}
          </Stack>
        </Box>
      ) : (
        <Stack gap="16px">
          {groups.map((group, groupIndex) => {
            const scenarioGroupId = group.scenarioGroupId
            const scenarioGroupLabel = group.groupName?.trim() ?? ''
            const hasScenarioGroupLink = scenarioGroupLabel.length > 0 && scenarioGroupId !== undefined && scenarioGroupId !== null
            const handleScenarioGroupClick = () => {
              if (scenarioGroupId === undefined || scenarioGroupId === null) return
              navigate(getNextGenMIScenarioGroupDetailPath(scenarioGroupId))
            }

            return (
              <Box
                key={scenarioGroupId ?? `related-group-${groupIndex}`}
                width="100%"
                minWidth={0}
                maxWidth="100%"
                bgcolor="gray.5"
                borderRadius="10px"
                p="24px"
                boxSizing="border-box"
              >
                <Stack gap="8px" py="6px" mb="8px">
                  <Typography variant="body2SB14" color="contentText.Normal" px="6px" lineHeight={1.4}>
                    시나리오 그룹
                  </Typography>
                  {hasScenarioGroupLink ? (
                    <Box px="6px" sx={{ width: 'fit-content', maxWidth: '100%' }}>
                      <NextGenMIHoverLinkCell value={scenarioGroupLabel} variant="body1B16" onClick={handleScenarioGroupClick} />
                    </Box>
                  ) : (
                    <Typography variant="body1B16" color="contentText.Black" px="6px" lineHeight={1.4}>
                      {'-'}
                    </Typography>
                  )}
                </Stack>
                <Box
                  width="100%"
                  minWidth={0}
                  maxWidth="100%"
                  bgcolor="commonColor.White"
                  border="1px solid"
                  borderColor="contentBorder.Normal"
                  borderRadius="10px"
                  p="12px"
                  boxSizing="border-box"
                >
                  <ScenarioGroupInnerTable<RelatedScenario>
                    dimensionColumns={group.dimensionColumns ?? []}
                    scenarios={group.scenarios ?? []}
                    backgroundColor="commonColor.White"
                    noRowMessage="관련 시나리오가 없습니다."
                    onScenarioClick={(row) => onScenarioRowClick?.(group, row)}
                  />
                </Box>
              </Box>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}

export default EventDetailRelatedScenariosSection
