import { Box, Divider, FormControlLabel, Stack, Switch, Typography } from '@mui/material'
import { isEqual } from 'lodash-es'
import { Fragment, useEffect, useState } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MIFilterGroup from '@/components/common/filter/MIFilterGroup'
import MIMenu from '@/components/common/menu/MIMenu'
import MISelectMenu, { SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import MISkeleton from '@/components/mi/MISkeleton'
import useCodeData from '@/hooks/useCodeData'
import FeedItem from '@/pages/mi/dashboard/components/newsFeed/FeedItem'
import { DirectionType, INewsFeedItem } from '@/service/mi/dashboard'

const sentimentOptions = [
  { label: 'Upward', value: DirectionType.Upward },
  { label: 'Downward', value: DirectionType.Downward },
  { label: 'Neutral', value: DirectionType.Neutral },
]

const impactOptions = [
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
]

interface FeedProps {
  newsFeedItems?: INewsFeedItem[]
  onApplyFilters: (sentiments: string[], impactScores: string[], regions: string[], save?: boolean) => void
  appliedFiltersCount: number
  initialFilters?: {
    sentiments: string[]
    impactScores: string[]
    regions: string[]
  }
  order: string
  orderOptions: SelectMenuItem[]
  onOrderChange: (order: string) => void
  isLoading?: boolean
}

const Feed = ({
  newsFeedItems,
  onApplyFilters,
  appliedFiltersCount,
  initialFilters,
  order,
  orderOptions,
  onOrderChange,
  isLoading,
}: FeedProps) => {
  const [sentiments, setSentiments] = useState<string[]>(initialFilters?.sentiments ?? [])
  const [impactScores, setImpactScores] = useState<string[]>(initialFilters?.impactScores ?? [])
  const [regions, setRegions] = useState<string[]>(initialFilters?.regions ?? [])

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [save, setSave] = useState(false)

  const { regionCategoryCodeList } = useCodeData()

  const [hasChanges, setHasChanges] = useState(false)
  const [previousItemsLength, setPreviousItemsLength] = useState(4)

  useEffect(() => {
    if (
      initialFilters &&
      (initialFilters.sentiments.length > 0 || initialFilters.impactScores.length > 0 || initialFilters.regions.length > 0)
    ) {
      setSentiments(initialFilters.sentiments)
      setImpactScores(initialFilters.impactScores)
      setRegions(initialFilters.regions)
      setSave(true)
    }
  }, [initialFilters])

  useEffect(() => {
    const initialSentiments = initialFilters?.sentiments ?? []
    const initialImpactScores = initialFilters?.impactScores ?? []
    const initialRegions = initialFilters?.regions ?? []

    const sentimentsChanged = !isEqual(
      sentiments.slice().sort((a, b) => a.localeCompare(b)),
      initialSentiments.slice().sort((a, b) => a.localeCompare(b)),
    )
    const impactScoresChanged = !isEqual(
      impactScores.slice().sort((a, b) => a.localeCompare(b)),
      initialImpactScores.slice().sort((a, b) => a.localeCompare(b)),
    )
    const regionsChanged = !isEqual(
      regions.slice().sort((a, b) => a.localeCompare(b)),
      initialRegions.slice().sort((a, b) => a.localeCompare(b)),
    )

    setHasChanges(sentimentsChanged || impactScoresChanged || regionsChanged)
  }, [sentiments, impactScores, regions, initialFilters])

  useEffect(() => {
    if (newsFeedItems && newsFeedItems.length > 0) {
      setPreviousItemsLength(newsFeedItems.length)
    }
  }, [newsFeedItems])

  return (
    <Stack>
      <Stack direction="row" pl="6px" justifyContent="space-between" alignItems="center">
        <Stack direction="row" gap="8px" height="32px" alignItems="center">
          <Typography variant="sectionTitleTXL" color="black" height="32px" sx={{ userSelect: 'none' }}>
            Feed
          </Typography>
          <Box
            minWidth="32px"
            padding="4px 8px"
            borderRadius="100px"
            boxSizing="border-box"
            sx={{ backgroundColor: 'gray.30', userSelect: 'none' }}
          >
            <Typography component="div" variant="body2SB14" color="content.textBlack" textAlign="center">
              {newsFeedItems?.length ?? 0}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap="8px">
          <MIMenu
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            variant="outlined"
            label={
              <Stack direction="row" alignItems="center" gap="6px">
                <Typography variant="body2SB14">Filters</Typography>
                {appliedFiltersCount > 0 && (
                  <Stack
                    justifyContent="center"
                    alignItems="center"
                    minWidth="20px"
                    height="20px"
                    borderRadius="100px"
                    bgcolor="commonColor.Primary"
                  >
                    <Typography px="5px" variant="body2SB14" color="commonColor.White" textAlign="center">
                      {appliedFiltersCount}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            }
            displayType="select"
          >
            <Stack>
              <Stack direction="row" padding="12px" gap="12px" boxSizing="border-box">
                <Stack gap="12px">
                  <MIFilterGroup
                    title="Sentiments"
                    type="menu"
                    filters={sentimentOptions}
                    selectedFilters={sentiments}
                    onFilterChange={setSentiments}
                    padding="0"
                    width="146px"
                  />
                  <Divider flexItem sx={{ borderColor: 'contentBorder.Normal' }} />
                  <MIFilterGroup
                    title="Impacts"
                    type="menu"
                    filters={impactOptions}
                    selectedFilters={impactScores}
                    onFilterChange={setImpactScores}
                    padding="0"
                    width="146px"
                  />
                </Stack>
                <Divider orientation="vertical" flexItem sx={{ borderColor: 'contentBorder.Normal' }} />
                <MIFilterGroup
                  title="Regions"
                  type="menu"
                  filters={regionCategoryCodeList?.map((code) => ({ label: code.codeNm, value: code.codeId })) ?? []}
                  selectedFilters={regions}
                  onFilterChange={setRegions}
                  padding="0"
                  width="186px"
                />
              </Stack>
              <Stack
                direction="row"
                padding="10px 12px"
                justifyContent="space-between"
                alignItems="center"
                borderTop="1px solid"
                borderColor="contentBorder.Normal"
              >
                <FormControlLabel
                  label="Save"
                  control={
                    <Switch
                      size="small"
                      checked={save}
                      onChange={() => {
                        setSave(!save)
                      }}
                      sx={{
                        mt: '1px',
                      }}
                    />
                  }
                  sx={{ marginRight: 0 }}
                />
                <Stack direction="row" gap="10px">
                  <MIButton
                    type="outlined"
                    size="h28"
                    disabled={[...sentiments, ...impactScores, ...regions].length === 0}
                    onClick={() => {
                      setSentiments([])
                      setImpactScores([])
                      setRegions([])
                    }}
                  >
                    Clear
                  </MIButton>
                  <MIButton
                    type="filled"
                    size="h28"
                    disabled={!hasChanges}
                    onClick={() => {
                      onApplyFilters(sentiments, impactScores, regions, save)
                      setIsMenuOpen(false)
                    }}
                  >
                    Apply
                  </MIButton>
                </Stack>
              </Stack>
            </Stack>
          </MIMenu>
          <MISelectMenu variant="outlined" selected={order} onSelected={onOrderChange} items={orderOptions} sx={{ minWidth: 110 }} />
        </Stack>
      </Stack>
      <Stack mt="12px">
        {isLoading ? (
          <Stack gap="10px">
            {Array.from({ length: previousItemsLength }, (_, index) => {
              const uniqueId = `skeleton-${Date.now()}-${index}`

              return (
                <Fragment key={uniqueId}>
                  {index !== 0 && <Divider color="#DEE2E6" />}
                  <MISkeleton
                    loading={true}
                    custom={
                      <Stack
                        padding="12px 18px"
                        borderRadius="10px"
                        gap="8px"
                        sx={{
                          backgroundColor: 'commonColor.White',
                          border: '1px solid transparent',
                          boxSizing: 'border-box',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between">
                          <Box width="300px" height="26px" borderRadius="4px" sx={{ backgroundColor: 'gray.20' }} />
                        </Stack>

                        <Stack py="8px">
                          <Box width="90%" height="22px" borderRadius="4px" sx={{ backgroundColor: 'gray.20' }} mb="8px" />
                          <Stack direction="row" gap="8px" alignItems="center">
                            <Box width="50px" height="14px" borderRadius="4px" sx={{ backgroundColor: 'gray.20' }} />
                            <Box width="1px" height="12px" sx={{ backgroundColor: 'gray.20' }} />
                            <Box width="140px" height="14px" borderRadius="4px" sx={{ backgroundColor: 'gray.20' }} />
                          </Stack>
                        </Stack>
                      </Stack>
                    }
                  />
                </Fragment>
              )
            })}
          </Stack>
        ) : (
          <>
            {newsFeedItems?.map((item, index) => (
              <Fragment key={item.nwsSigId}>
                {index !== 0 && <Divider color="#DEE2E6" sx={{ my: '10px' }} />}
                <FeedItem item={item} />
              </Fragment>
            ))}
            {!newsFeedItems || newsFeedItems.length === 0 ? (
              <Stack height={452} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
                <Typography variant="body2SB14" color="content.textNormal">
                  No data available to display.
                </Typography>
              </Stack>
            ) : null}
          </>
        )}
      </Stack>
    </Stack>
  )
}

export default Feed
