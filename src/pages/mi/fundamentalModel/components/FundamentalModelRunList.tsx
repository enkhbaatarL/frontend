import FlagOutlinedIcon from '@mui/icons-material/OutlinedFlag'
import { Box, Divider, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import AddIcon from '@/components/common/icons/AddIcon'
import AsyncAutocomplete from '@/components/common/input/AsyncAutocomplete'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import FundamentalModelInputEditorPopup from '@/pages/mi/fundamentalModel/components/FundamentalModelInputEditorPopup'
import { caseStatusVisual } from '@/pages/mi/fundamentalModel/fundamentalModelCaseStatus'
import { formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import fundamentalModelCaseService, {
  type FundamentalModelCaseListItem,
  type FundamentalModelCaseSearchType,
} from '@/service/mi/fundamentalModel/case'

/** left list container 고정 높이 */
const LIST_PANEL_HEIGHT = 900
export const FUNDAMENTAL_MODEL_RUN_LIST_STICKY_TOP_PX = 72
const LIST_PANEL_STICKY_BOTTOM_GAP = 24
const LIST_SCROLLBAR_GAP = 12
const LIST_SCROLL_THUMB_MAX_HEIGHT = 78
export const FUNDAMENTAL_MODEL_RUN_LIST_PANEL_HEIGHT_CSS = `min(${LIST_PANEL_HEIGHT}px, calc(100vh - ${
  FUNDAMENTAL_MODEL_RUN_LIST_STICKY_TOP_PX + LIST_PANEL_STICKY_BOTTOM_GAP
}px))`

/** 목록에 RUNNING 케이스가 있을 때 배지 갱신 주기 (ms) */
const LIST_POLL_INTERVAL_MS = 5000

export interface FundamentalModelRunListProps {
  selectedId: string
  onSelect: (id: string, status?: FundamentalModelCaseListItem['status']) => void
}

/** 목록 검색 기준 */
type RunListSearchField = 'managerName' | 'title'

const SEARCH_FIELD_ITEMS: SelectMenuItem<RunListSearchField>[] = [
  { value: 'managerName', label: '담당자명' },
  { value: 'title', label: '제목' },
]

const toCaseSearchType = (field: RunListSearchField): FundamentalModelCaseSearchType => (field === 'title' ? 'TITLE' : 'ASSIGNEE_NAME')

/** 목록 건수 배지 라벨 */
const formatRunCountLabel = (count: number) => {
  if (count > 9999) return '9,999+'
  return String(count)
}

interface TruncatedLabelProps {
  text: string
  variant?: React.ComponentProps<typeof Typography>['variant']
  color?: string
  sx?: React.ComponentProps<typeof Typography>['sx']
}

/** 말줄임 시 툴팁으로 전체 텍스트 노출 */
const TruncatedLabel = ({ text, variant = 'body1SB16', color = 'gray.90', sx }: TruncatedLabelProps) => {
  const textRef = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(false)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    setOverflow(el.scrollWidth > el.clientWidth)
  }, [text])

  const label = (
    <Typography ref={textRef} component="span" variant={variant} color={color} noWrap sx={{ display: 'block', minWidth: 0, ...sx }}>
      {text}
    </Typography>
  )

  return overflow ? (
    <Tooltip title={text} arrow placement="top">
      {label}
    </Tooltip>
  ) : (
    label
  )
}

/** 좌측 시뮬레이션 목록(검색 기준 선택 - 검색 - 카드 리스트) */
const FundamentalModelRunList = ({ selectedId, onSelect }: FundamentalModelRunListProps) => {
  const [searchField, setSearchField] = useState<RunListSearchField>('managerName')
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')

  const listRequest = useMemo(() => {
    const trimmedKeyword = committedKeyword.trim()
    if (!trimmedKeyword) return {}
    return {
      searchType: toCaseSearchType(searchField),
      keyword: trimmedKeyword,
    }
  }, [committedKeyword, searchField])

  const { data: caseList, isLoading: listLoading } = useQuery({
    queryKey: ['fundamentalModel', 'cases', listRequest],
    queryFn: () => fundamentalModelCaseService.listCases(listRequest),
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const { miBase, cases } = query.state.data ?? {}
      return miBase?.status === 'RUNNING' || cases?.some((item) => item.status === 'RUNNING') ? LIST_POLL_INTERVAL_MS : false
    },
  })

  const cases = useMemo(() => caseList?.cases ?? [], [caseList?.cases])
  const miBase = caseList?.miBase ?? null
  const totalCount = caseList?.totalCount ?? cases.length + (miBase ? 1 : 0)

  useEffect(() => {
    if (listLoading || !selectedId) return
    const selectedCase = miBase?.caseId === Number(selectedId) ? miBase : cases.find((item) => String(item.caseId) === selectedId)
    if (!selectedCase) return
    onSelect(selectedId, selectedCase.status)
  }, [cases, listLoading, miBase, onSelect, selectedId])

  const renderCaseItem = (item: FundamentalModelCaseListItem) => {
    const caseId = String(item.caseId)
    const selected = caseId === selectedId
    const sv = caseStatusVisual(item.status)
    const createdAtLabel = formatNextGenMIDateTime(item.createdAt)
    const updatedAtLabel = formatNextGenMIDateTime(item.updatedAt)

    return (
      <Box
        key={caseId}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(caseId, item.status)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(caseId, item.status)
          }
        }}
        sx={{
          px: '12px',
          py: '16px',
          borderRadius: '10px',
          cursor: 'pointer',
          border: '1px solid',
          borderColor: selected ? 'mari.Primary' : 'transparent',

          bgcolor: selected ? 'gray.5' : 'commonColor.White',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flexShrink: 0,
          '&:hover': { bgcolor: 'gray.5' },
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            height: 22,
            px: '4px',
            borderRadius: '4px',
            bgcolor: sv.bg,
          }}
        >
          <Typography
            variant="body3SB12"
            sx={{
              color: sv.color,
              fontSize: 13,
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            {sv.label}
          </Typography>
        </Box>

        <TruncatedLabel text={item.title} />

        <Stack direction="row" alignItems="center" gap="8px" sx={{ minWidth: 0 }}>
          <Typography variant="body3R12" color="content.textNormal" noWrap>
            {createdAtLabel}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ borderColor: 'gray.40', height: 10, alignSelf: 'center' }} />
          <Stack direction="row" alignItems="center" gap="4px" sx={{ minWidth: 0 }}>
            <Typography variant="body3M12" color="content.textNormal" noWrap>
              업데이트
            </Typography>
            <Typography variant="body3R12" color="content.textNormal" noWrap>
              {updatedAtLabel}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" gap="4px" sx={{ minWidth: 0 }}>
          <Typography variant="body3SB12" color="content.textNormal" flexShrink={0}>
            담당자
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TruncatedLabel text={item.assigneeName} variant="body3R12" color="content.textNormal" />
          </Box>
        </Stack>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: FUNDAMENTAL_MODEL_RUN_LIST_PANEL_HEIGHT_CSS,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 7,
        }}
      >
        <Box
          data-testid="fundamental-run-list"
          sx={{
            width: '100%',
            height: FUNDAMENTAL_MODEL_RUN_LIST_PANEL_HEIGHT_CSS,
            bgcolor: 'commonColor.White',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'sticky',
            top: FUNDAMENTAL_MODEL_RUN_LIST_STICKY_TOP_PX,
            pointerEvents: 'auto',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" pl="4px" pr="12px" pt="20px" flexShrink={0}>
            <Stack direction="row" alignItems="center" gap="6px">
              <Typography variant="heading3" color="gray.90" sx={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.4 }}>
                List
              </Typography>
              <Box
                sx={{
                  height: 26,
                  px: '8px',
                  borderRadius: '100px',
                  bgcolor: 'gray.30',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 'fit-content',
                }}
              >
                <Typography variant="body2SB14" color="gray.90">
                  {listLoading ? '—' : formatRunCountLabel(totalCount)}
                </Typography>
              </Box>
            </Stack>
            <FundamentalModelInputEditorPopup
              onCreated={(caseId, status) => {
                setKeyword('')
                setCommittedKeyword('')
                onSelect(caseId, status)
              }}
            >
              <MIBaseButton variant="contained" prefix={<AddIcon />} sx={{ height: '36px' }}>
                수급모델 실행
              </MIBaseButton>
            </FundamentalModelInputEditorPopup>
          </Stack>

          <Stack direction="row" alignItems="center" gap="8px" pr="12px" py="8px" flexShrink={0} width="100%" boxSizing="border-box">
            <MISelectMenu
              variant="outlined"
              selectionIconPosition="left"
              selected={searchField}
              onSelected={(v: RunListSearchField) => setSearchField(v)}
              items={SEARCH_FIELD_ITEMS}
              sx={{
                flexShrink: 0,
                height: 40,
                borderRadius: '10px',
                color: 'content.textNormal',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 14,
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0, width: 0 }}>
              <AsyncAutocomplete
                value={keyword}
                onInputChange={(_event, newValue) => {
                  setKeyword(newValue)
                }}
                onSearch={(v) => {
                  setCommittedKeyword(v)
                }}
                onClear={() => {
                  setKeyword('')
                  setCommittedKeyword('')
                }}
                showSearchIcon={true}
                showOptionsOnFocus={false}
                disableCache={true}
                textFieldProps={{ placeholder: 'Search' }}
                height={40}
                width="100%"
              />
            </Box>
          </Stack>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              pb: '24px',
            }}
          >
            <ScrollWrapper
              height="100%"
              maxHeight="100%"
              scrollbarGap={LIST_SCROLLBAR_GAP}
              reserveScrollbarGap
              thumbInsetTop={6}
              thumbInsetBottom={6}
              thumbWidth={4}
              thumbMaxHeight={LIST_SCROLL_THUMB_MAX_HEIGHT}
              showScrollbarOnHover
              contentKey={listLoading ? 'loading' : `${miBase?.caseId ?? ''}-${cases.length}`}
              sx={{
                flex: 1,
                minHeight: 0,
                width: '100%',
              }}
            >
              <Stack gap="18px">
                {listLoading && (
                  <Stack gap="4px">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Box key={`sk-card-${i}`} sx={{ px: '12px', py: '16px', borderRadius: '10px' }}>
                        <Skeleton width={88} height={22} sx={{ borderRadius: '4px', mb: 1 }} />
                        <Skeleton width="80%" height={22} sx={{ mb: 1 }} />
                        <Skeleton width="60%" height={16} sx={{ mb: 0.5 }} />
                        <Skeleton width="50%" height={16} />
                      </Box>
                    ))}
                  </Stack>
                )}

                {!listLoading && miBase && (
                  <Stack>
                    <Stack direction="row" alignItems="center" gap="2px" height="38px" padding="4px 12px" boxSizing="border-box">
                      <FlagOutlinedIcon sx={{ fontSize: '16px', color: 'gray.50' }} />
                      <Typography variant="body2M14" color="gray.50">
                        기준값 (MI Base)
                      </Typography>
                    </Stack>
                    {renderCaseItem(miBase)}
                  </Stack>
                )}
                {!listLoading && cases.length > 0 && (
                  <Stack>
                    <Stack direction="row" alignItems="center" gap="10px" height="38px" padding="4px 0" boxSizing="border-box">
                      <Divider sx={{ flex: 1, borderColor: 'gray.30' }} />
                      <Typography variant="body2M14" color="gray.50" whiteSpace="nowrap">
                        그 외 실행 케이스
                      </Typography>
                      <Divider sx={{ flex: 1, borderColor: 'gray.30' }} />
                    </Stack>
                    <Stack gap="4px">{cases.map(renderCaseItem)}</Stack>
                  </Stack>
                )}
              </Stack>
            </ScrollWrapper>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default FundamentalModelRunList
