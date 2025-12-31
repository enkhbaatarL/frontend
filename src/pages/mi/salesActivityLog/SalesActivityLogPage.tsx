// src/pages/mi/salesActivityLog/SalesActivityLogPage.tsx
import { Box, Grid2 as Grid, Stack, Typography } from '@mui/material'
import dayjs, { Dayjs } from 'dayjs'
import { disassembleToGroups } from 'es-hangul'
import { useCallback, useMemo, useState } from 'react'

import type { GridColDef } from '@mui/x-data-grid'

import AdminDatePicker from '@/components/admin/AdminDatePicker'
import MIButton from '@/components/common/button/MIButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIFilterDropdown from '@/components/common/filter/MIFilterDropdown'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import MISearchInput from '@/components/common/input/MISearchInput'
import MISelect from '@/components/common/select/MISelect'
import MITableUser from '@/components/common/table/MITableUser'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import theme from '@/theming'

type ActivityPriority = 'High' | 'Medium' | 'Low'
type ActivityType = '고객사' | '경쟁사' | '법규' | '기술' | '기타'

interface ActivityLogItem {
  id: number
  date: string
  type: ActivityType
  account: string
  description: string
  priority: ActivityPriority
  source: string
  assignee: string
  team: string
}

const DEFAULT_EVENTS: ActivityLogItem[] = [
  {
    id: 1,
    date: '2025-09-03',
    type: '고객사',
    account: '한국타이어테크놀로지',
    description: '유럽 지역 OE 수요 둔화, 생산량 조정 가능성, 단기 매출 하락 리스크',
    priority: 'High',
    source: 'Michelin report (2025 Q3)',
    assignee: '김종훈',
    team: 'Global Insight팀',
  },
  {
    id: 2,
    date: '2025-09-03',
    type: '경쟁사',
    account: '넥센타이어',
    description: 'EV 타이어 신제품 출시 및 북미 시장 점유율 상승, 시장 점검 심화 예상',
    priority: 'High',
    source: 'Goodyear press release',
    assignee: '지민 (Jimin)',
    team: 'AI Market Intelligence팀',
  },
  {
    id: 3,
    date: '2025-09-03',
    type: '법규',
    account: '미쉐린',
    description: '2026년 환경규제 강화안 발표, 원자재 수요 영향평가',
    priority: 'High',
    source: 'EU Tech Update',
    assignee: 'Emma Wang',
    team: '영업1팀',
  },
  {
    id: 4,
    date: '2025-09-03',
    type: '기술',
    account: '브리지스톤',
    description: 'Nisi ut aliquip ex ea commodo consequat.',
    priority: 'Medium',
    source: 'Michelin report (2025 Q3)',
    assignee: '민준 (Minjun)',
    team: '영업1팀',
  },
  {
    id: 5,
    date: '2025-09-03',
    type: '기타',
    account: '피렐리',
    description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
    priority: 'High',
    source: 'Goodyear press release',
    assignee: 'Lucas He',
    team: '영업3팀',
  },
]

const EVENT_TYPES: ActivityType[] = ['고객사', '경쟁사', '법규', '기술', '기타']
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const PRIORITY_OPTIONS = [
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
]
const TYPE_OPTIONS = [
  { label: '고객사', value: '고객사' },
  { label: '경쟁사', value: '경쟁사' },
  { label: '법규', value: '법규' },
  { label: '기술', value: '기술' },
  { label: '기타', value: '기타' },
]

const SalesActivityLogPage = () => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [events, setEvents] = useState<ActivityLogItem[]>(DEFAULT_EVENTS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<ActivityLogItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    account: '',
    type: undefined as ActivityType | undefined,
    priority: undefined as ActivityPriority | undefined,
    description: '',
    team: '',
    date: null as Dayjs | null,
    source: '',
  })

  const normalizeText = (text: string) => disassembleToGroups(text).flat().join('').toLowerCase()

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeText(appliedSearch.trim())

    return events.filter((event) => {
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(event.type)
      if (!normalizedQuery) {
        return matchesType
      }

      const searchFields = [
        event.account,
        event.description,
        event.source,
        event.assignee,
        event.team,
        event.type,
        event.priority,
        dayjs(event.date).isValid() ? dayjs(event.date).format('YYYY-MM-DD') : event.date,
      ]

      const matchesSearch = searchFields.some((field) => {
        if (!field) return false
        return normalizeText(String(field)).includes(normalizedQuery)
      })

      return matchesType && matchesSearch
    })
  }, [appliedSearch, selectedTypes, events])

  // const handleSearchChange = useCallback((value: string) => {
  //   setSearchKeyword(value)
  // }, [])

  const handleSearch = useCallback((searchTerm: string) => {
    setAppliedSearch(searchTerm)
    setPage(1)
  }, [])

  const handleSearchClear = useCallback(() => {
    setSearchKeyword('')
    setAppliedSearch('')
    setPage(1)
  }, [])

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredRows.slice(startIndex, startIndex + pageSize)
  }, [filteredRows, page, pageSize])

  const paginationMeta = useMemo(
    () => ({
      totalPages: Math.max(1, Math.ceil(filteredRows.length / pageSize)),
      totalElements: filteredRows.length,
      currentPage: page,
      numberOfElements: paginatedRows.length,
      size: pageSize,
      isFirst: page <= 1,
      isLast: page >= Math.ceil(filteredRows.length / pageSize),
      hasPrevious: page > 1,
      hasNext: page < Math.ceil(filteredRows.length / pageSize),
      detail: paginatedRows,
    }),
    [filteredRows.length, page, pageSize, paginatedRows],
  )

  const typeFilterOptions = useMemo(
    () =>
      EVENT_TYPES.map((type) => ({
        label: type,
        value: type,
      })),
    [],
  )

  const handleTypeApply = (values: string[]) => {
    setSelectedTypes(values as ActivityType[])
    setPage(1)
  }

  const handleTypeClear = () => {
    setSelectedTypes([])
    setPage(1)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setFormData({
      account: '',
      type: undefined as ActivityType | undefined,
      priority: undefined as ActivityPriority | undefined,
      description: '',
      team: '',
      date: null,
      source: '',
    })
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleRowClick = (params: { row: ActivityLogItem }) => {
    setSelectedRow(params.row)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedRow(null)
  }

  const handleSave = () => {
    if (
      !formData.account ||
      formData.type === undefined ||
      formData.priority === undefined ||
      !formData.description ||
      !formData.team ||
      !formData.date ||
      !formData.source
    ) {
      return
    }

    const newEvent: ActivityLogItem = {
      id: Math.max(...events.map((e) => e.id), 0) + 1,
      date: formData.date.format('YYYY-MM-DD'),
      type: formData.type!,
      account: formData.account,
      description: formData.description,
      priority: formData.priority!,
      source: formData.source,
      assignee: '',
      team: formData.team,
    }

    setEvents((prev) => [newEvent, ...prev])
    setIsModalOpen(false)
    setPage(1)
  }

  const isSaveDisabled = useMemo(
    () =>
      !formData.account ||
      formData.type === undefined ||
      formData.priority === undefined ||
      !formData.description ||
      !formData.team ||
      !formData.date ||
      !formData.source,
    [formData],
  )

  const columns: GridColDef<ActivityLogItem>[] = useMemo(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        minWidth: 120,
        flex: 0,
        valueFormatter: ({ value }) => dayjs(value as string).format('YYYY-MM-DD'),
        renderCell: (params) => (
          <Typography
            sx={{
              fontSize: '14px',
              color: '#868E96',
            }}
          >
            {dayjs(params.value as string).format('YYYY-MM-DD')}
          </Typography>
        ),
      },
      {
        field: 'type',
        headerName: 'Type',
        minWidth: 120,
        flex: 0,
        type: 'singleSelect',
        valueOptions: EVENT_TYPES,
        renderCell: (params) => (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 8px',
              borderRadius: '12px',
              backgroundColor: '#F1F3F5',
              height: '20px',
              boxSizing: 'border-box',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#495057',
                lineHeight: 1,
              }}
            >
              {params.value as ActivityType}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'account',
        headerName: 'Account',
        minWidth: 180,
        flex: 0,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1,
        minWidth: 320,
      },
      {
        field: 'priority',
        headerName: 'Priority',
        minWidth: 120,
        flex: 0,
        type: 'singleSelect',
        valueOptions: ['High', 'Medium', 'Low'],
      },
      {
        field: 'source',
        headerName: 'Source',
        minWidth: 200,
        flex: 0,
      },
      {
        field: 'assignee',
        headerName: 'Assignee',
        minWidth: 140,
        flex: 0,
      },
      {
        field: 'team',
        headerName: 'Team',
        minWidth: 140,
        flex: 0,
      },
    ],
    [],
  )

  return (
    <Box>
      <MIPageHeadline title="Sales Activity Log" gradientStart="#021728" gradientEnd="#135F7A" />
      <Box boxSizing="border-box" paddingX={7.5} minWidth="1440px" width="1440px" margin="auto" py={12.5}>
        <Stack spacing={6}>
          <Grid container wrap="nowrap" gap={2.5} alignItems="center" justifyContent="space-between">
            <Grid container wrap="nowrap" gap={2.5} alignItems="center">
              <Box sx={{ width: 300 }}>
                <MISearchInput
                  storageKey="sales-activity-log"
                  value={searchKeyword}
                  onChange={(value) => {
                    setSearchKeyword(value)
                    if (value.trim() === '' && appliedSearch !== '') {
                      setAppliedSearch('')
                      setPage(1)
                    }
                  }}
                  placeholder="Search for description"
                  onSearch={handleSearch}
                  onClear={handleSearchClear}
                  width={300}
                  height={36}
                />
              </Box>
              <MIFilterDropdown
                label="Type"
                options={typeFilterOptions}
                selectedValues={selectedTypes}
                onApply={handleTypeApply}
                onClear={handleTypeClear}
              />
            </Grid>
            <MIButton
              type="filled"
              color="primary"
              size="h34"
              onClick={handleOpenModal}
              width={101}
              borderRadius="10px"
              sx={{
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              + Add Item
            </MIButton>
          </Grid>

          <MITableUser<ActivityLogItem>
            tableProps={{
              rowId: 'id',
              columns,
              rows: paginatedRows,
              disableColumnSorting: false,
              onRowClick: handleRowClick,
              initialState: {
                sorting: {
                  sortModel: [{ field: 'date', sort: 'desc' }],
                },
              },
            }}
            paginationProps={{
              data: paginationMeta,
              onPageChange: (value) => setPage(value),
              onSizeChange: (value) => {
                setPageSize(value)
                setPage(1)
              },
              size: pageSize,
              sizeList: PAGE_SIZE_OPTIONS,
            }}
          />
        </Stack>
      </Box>

      <MIConfirm
        open={isModalOpen}
        title="Add Item"
        width={500}
        height={527}
        handleClose={handleCloseModal}
        paperSx={{
          width: '500px !important',
          minWidth: '500px !important',
          maxWidth: '500px !important',
          boxSizing: 'border-box !important',
          border: '1px solid #DEE2E6',
        }}
        contentSx={{
          overflow: 'hidden',
          height: '361px',
          paddingLeft: '20px !important',
          paddingRight: '20px !important',
          paddingTop: '0px !important',
          paddingBottom: '0px !important',
          '& .MuiDialogContentText-root': {
            padding: '0 !important',
            margin: '0 !important',
            width: '460px !important',
            maxWidth: '460px !important',
            boxSizing: 'border-box !important',
          },
        }}
        actions={[
          {
            label: 'Cancel',
            variant: 'outlined',
            color: 'gray',
            onClick: handleCloseModal,
          },
          {
            label: 'Save',
            variant: 'filled',
            color: 'primary',
            disabled: isSaveDisabled,
            onClick: handleSave,
          },
        ]}
      >
        <Box display="flex" flexDirection="column" gap="20px" overflow="hidden">
          <Box display="flex" gap="20px">
            <Box width={220}>
              <MIField label="Account" required>
                <MIInput
                  placeholder="Type the account"
                  width={220}
                  size="h36"
                  value={formData.account}
                  onChange={(e) => setFormData((prev) => ({ ...prev, account: e.target.value }))}
                  sx={{
                    '& .MuiInputBase-root': {
                      borderRadius: '10px',
                      height: '36px',
                    },
                  }}
                />
              </MIField>
            </Box>
            <Box width={220}>
              <MIField label="Team" required>
                <MIInput
                  placeholder="Type assignee's team"
                  width={220}
                  size="h36"
                  value={formData.team}
                  onChange={(e) => setFormData((prev) => ({ ...prev, team: e.target.value }))}
                  sx={{
                    '& .MuiInputBase-root': {
                      borderRadius: '10px',
                      height: '36px',
                    },
                  }}
                />
              </MIField>
            </Box>
          </Box>

          <Box display="flex" gap="20px">
            <Box width={220}>
              <MIField label="Type" required>
                <MISelect
                  placeholder="Select type"
                  value={formData.type}
                  options={TYPE_OPTIONS}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as ActivityType }))}
                  width={220}
                  sizeSelect="h36"
                  useAllOption={false}
                  type="button"
                  sx={{
                    '& .MuiInputBase-root': {
                      borderRadius: '10px',
                    },
                    '& .MuiOutlinedInput-root': {
                      height: '36px !important',
                    },
                    '& .MuiOutlinedInput-root .MuiAutocomplete-input': {
                      paddingLeft: '2px !important',
                    },
                  }}
                />
              </MIField>
            </Box>
            <Box width={220}>
              <MIField label="Date" required>
                <AdminDatePicker
                  defaultValue={formData.date}
                  value={formData.date}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, date: value }))
                  }}
                  size="h36"
                  slotProps={{
                    textField: {
                      sx: {
                        width: '220px',
                        minWidth: '220px',
                        maxWidth: '220px',
                        '& .MuiInputBase-root': {
                          borderRadius: '10px',
                          overflow: 'hidden',
                        },
                        '& .MuiInputAdornment-root': {
                          marginRight: '4px',
                          '& .MuiIconButton-root': {
                            borderRadius: '4px',
                            padding: '4px',
                            width: '28px',
                            height: '28px',
                            '& svg': {
                              width: '20px',
                              height: '20px',
                            },
                            '&:hover': {
                              borderRadius: '4px',
                              backgroundColor: theme.palette.content.backgroundHover,
                            },
                          },
                        },
                      },
                    },
                  }}
                />
              </MIField>
            </Box>
          </Box>

          <Box display="flex" gap="20px">
            <Box width={220}>
              <MIField label="Priority" required>
                <MISelect
                  placeholder="Select priority"
                  value={formData.priority}
                  options={PRIORITY_OPTIONS}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as ActivityPriority }))}
                  width={220}
                  sizeSelect="h36"
                  useAllOption={false}
                  type="button"
                  sx={{
                    '& .MuiInputBase-root': {
                      borderRadius: '10px',
                    },
                    '& .MuiOutlinedInput-root': {
                      height: '36px !important',
                    },
                    '& .MuiOutlinedInput-root .MuiAutocomplete-input': {
                      paddingLeft: '2px !important',
                    },
                  }}
                />
              </MIField>
            </Box>
            <Box width={220}>
              <MIField label="Source" required>
                <MIInput
                  placeholder="Enter source"
                  width={220}
                  size="h36"
                  value={formData.source}
                  onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
                  sx={{
                    '& .MuiInputBase-root': {
                      borderRadius: '10px',
                      height: '36px',
                    },
                  }}
                />
              </MIField>
            </Box>
          </Box>

          <Box>
            <MIField label="Description" required>
              <MIInput
                placeholder="Describe the sales activity"
                fullWidth
                multiline
                maxLength={500}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </MIField>
          </Box>
        </Box>
      </MIConfirm>

      {selectedRow && (
        <MIConfirm
          open={isDetailModalOpen}
          title="Activity Detail"
          width={500}
          height={527}
          handleClose={handleCloseDetailModal}
          paperSx={{
            width: '500px !important',
            minWidth: '500px !important',
            maxWidth: '500px !important',
            boxSizing: 'border-box !important',
            border: '1px solid #DEE2E6',
          }}
          contentSx={{
            overflow: 'hidden',
            height: '361px',
            paddingLeft: '20px !important',
            paddingRight: '20px !important',
            paddingTop: '0px !important',
            paddingBottom: '0px !important',
            '& .MuiDialogContentText-root': {
              padding: '0 !important',
              margin: '0 !important',
              width: '460px !important',
              maxWidth: '460px !important',
              boxSizing: 'border-box !important',
            },
          }}
          actions={[
            {
              label: 'Close',
              variant: 'filled',
              color: 'primary',
              onClick: handleCloseDetailModal,
            },
          ]}
        >
          <Box display="flex" flexDirection="column" gap="20px" overflow="hidden">
            <Box display="flex" gap="20px">
              <Box width={220}>
                <MIField label="Account">
                  <MIInput
                    placeholder="Type the account"
                    width={220}
                    size="h36"
                    value={selectedRow.account}
                    readOnly
                    sx={{
                      '& .MuiInputBase-root': {
                        borderRadius: '10px',
                        height: '36px',
                      },
                    }}
                  />
                </MIField>
              </Box>
              <Box width={220}>
                <MIField label="Team">
                  <MIInput
                    placeholder="Type assignee's team"
                    width={220}
                    size="h36"
                    value={selectedRow.team}
                    readOnly
                    sx={{
                      '& .MuiInputBase-root': {
                        borderRadius: '10px',
                        height: '36px',
                      },
                    }}
                  />
                </MIField>
              </Box>
            </Box>

            <Box display="flex" gap="20px">
              <Box width={220}>
                <MIField label="Type">
                  <Box
                    sx={{
                      width: '220px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '10px',
                      backgroundColor: '#F1F3F5',
                      boxSizing: 'border-box',
                      padding: '0 12px',
                      color: '#495057',
                      fontSize: '14px',
                    }}
                  >
                    {selectedRow.type}
                  </Box>
                </MIField>
              </Box>
              <Box width={220}>
                <MIField label="Date">
                  <AdminDatePicker
                    defaultValue={selectedRow.date ? dayjs(selectedRow.date) : null}
                    value={selectedRow.date ? dayjs(selectedRow.date) : null}
                    readOnly
                    size="h36"
                    slotProps={{
                      textField: {
                        sx: {
                          width: '220px',
                          minWidth: '220px',
                          maxWidth: '220px',
                          '& .MuiInputBase-root': {
                            borderRadius: '10px',
                          },
                        },
                      },
                    }}
                  />
                </MIField>
              </Box>
            </Box>

            <Box display="flex" gap="20px">
              <Box width={220}>
                <MIField label="Priority">
                  <Box
                    sx={{
                      width: '220px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '10px',
                      backgroundColor: '#F1F3F5',
                      boxSizing: 'border-box',
                      padding: '0 12px',
                      color: '#495057',
                      fontSize: '14px',
                    }}
                  >
                    {selectedRow.priority}
                  </Box>
                </MIField>
              </Box>
              <Box width={220}>
                <MIField label="Source">
                  <MIInput
                    placeholder="Enter source"
                    width={220}
                    size="h36"
                    value={selectedRow.source}
                    readOnly
                    sx={{
                      '& .MuiInputBase-root': {
                        borderRadius: '10px',
                        height: '36px',
                      },
                    }}
                  />
                </MIField>
              </Box>
            </Box>

            <Box>
              <MIField label="Description">
                <MIInput
                  placeholder="Describe the sales activity"
                  fullWidth
                  multiline
                  maxLength={500}
                  value={selectedRow.description}
                  readOnly
                />
              </MIField>
            </Box>
          </Box>
        </MIConfirm>
      )}
    </Box>
  )
}

export default SalesActivityLogPage
