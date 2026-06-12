import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ListIcon from '@mui/icons-material/List'
import { Box, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import type { RelatedEventScenario, RelatedScenario } from '@/service/mi/nextGenMI/event'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import NextGenMIEventDetailBlockSkeleton from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailBlockSkeleton'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import ScenarioGroupInnerTable from '@/pages/mi/nextGenMI/components/common/ScenarioGroupInnerTable'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import { getNextGenMIEventDesignPath, getNextGenMIScenarioGroupDetailPath, getNextGenMITabPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'

interface EventDetailRelatedScenariosSectionProps {
  eventId?: string | number
  relatedEventScenario?: RelatedEventScenario | null
  onScenarioRowClick?: (row: RelatedScenario) => void
  loading?: boolean
}

const EventDetailRelatedScenariosSection = ({
  eventId,
  relatedEventScenario,
  onScenarioRowClick,
  loading = false,
}: EventDetailRelatedScenariosSectionProps) => {
  const navigate = useNavigate()
  const rows = relatedEventScenario?.scenarios ?? []
  const scenarioGroupId = relatedEventScenario?.scenarioGroupId
  const scenarioGroupLabel = relatedEventScenario?.groupName?.trim() ?? ''

  const hasScenarioGroupLink = scenarioGroupLabel.length > 0 && scenarioGroupId !== undefined && scenarioGroupId !== null
  const handleScenarioGroupClick = () => {
    if (scenarioGroupId === undefined || scenarioGroupId === null) return
    navigate(getNextGenMIScenarioGroupDetailPath(scenarioGroupId))
  }

  const handleScenarioDesignClick = () => {
    if (!eventId) {
      navigate(getNextGenMITabPath('scenarios'))
      return
    }
    navigate(getNextGenMIEventDesignPath(eventId), {
      state: { eventName: scenarioGroupLabel || undefined },
    })
  }

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
      {rows.length === 0 ? (
        <Box
          position="relative"
          height="260px"
          bgcolor="gray.5"
          borderRadius="10px"
          borderBottom="1px solid"
          borderColor="gray.30"
          overflow="hidden"
        >
          <Stack position="absolute" top="50%" left="50%" alignItems="center" gap="10px" sx={{ transform: 'translate(-50%, -50%)' }}>
            <ErrorOutlineRoundedIcon sx={{ fontSize: 24, color: 'gray.60' }} />
            <Typography variant="body3SB12" color="gray.60" lineHeight={1.4}>
              생성된 시나리오가 없습니다
            </Typography>
            <MIBaseButton
              variant="contained"
              prefix={<AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />}
              onClick={handleScenarioDesignClick}
              sx={{ height: '36px', borderRadius: '8px', padding: '6px 10px' }}
            >
              시나리오 설계
            </MIBaseButton>
          </Stack>
        </Box>
      ) : (
        <Box width="100%" minWidth={0} maxWidth="100%" bgcolor="gray.5" borderRadius="10px" p="24px" boxSizing="border-box">
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
              dimensionColumns={relatedEventScenario?.dimensionColumns ?? []}
              scenarios={rows}
              backgroundColor="commonColor.White"
              noRowMessage="관련 시나리오가 없습니다."
              onScenarioClick={onScenarioRowClick}
            />
          </Box>
        </Box>
      )}
    </Stack>
  )
}

export default EventDetailRelatedScenariosSection
