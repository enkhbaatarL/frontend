import { Box, Button, Divider, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { FundamentalModelRunListItem, FundamentalModelRunStatus } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import AddIcon from '@/components/common/icons/AddIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'

/** left list container 고정 높이 */
const LIST_PANEL_HEIGHT = 900

export interface FundamentalModelRunListProps {
  runs: FundamentalModelRunListItem[]
  selectedId: string
  onSelect: (id: string) => void
  loading?: boolean
}

/** 목록 건수 배지 라벨 */
const formatRunCountLabel = (count: number) => {
  if (count > 9999) return '9,999+'
  return String(count)
}

/** 상태 배지 스타일 */
const statusVisual = (status: FundamentalModelRunStatus) => {
  if (status === 'in_progress') {
    return { bg: 'contentBG.PrimaryFade', color: 'mari.Primary', label: 'IN PROGRESS' }
  }
  if (status === 'error') {
    return { bg: 'rgba(214, 51, 108, 0.1)', color: '#D6336C', label: 'ERROR' }
  }
  return { bg: 'rgba(42, 141, 62, 0.1)', color: '#2A8D3E', label: 'DONE' }
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

/** 좌측 시뮬레이션 목록(검색 - 담당자 필터 - 카드 리스트) */
const FundamentalModelRunList = ({ runs, selectedId, onSelect, loading = false }: FundamentalModelRunListProps) => {
  const [managerKey, setManagerKey] = useState<string>('all')
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')

  const managerItems: SelectMenuItem<string>[] = useMemo(() => {
    const names = Array.from(new Set(runs.map((r) => r.managerName))).sort()
    const items: SelectMenuItem<string>[] = [{ value: 'all', label: '담당자 전체' }, ...names.map((name) => ({ value: name, label: name }))]
    return items
  }, [runs])

  const filteredRuns = useMemo(() => {
    const q = committedKeyword.trim().toLowerCase()
    return runs.filter((run) => {
      if (managerKey !== 'all' && run.managerName !== managerKey) return false
      if (!q) return true
      return run.title.toLowerCase().includes(q) || run.managerName.toLowerCase().includes(q)
    })
  }, [committedKeyword, managerKey, runs])

  return (
    <Box
      sx={{
        width: 350,
        height: LIST_PANEL_HEIGHT,
        flexShrink: 0,
        bgcolor: 'commonColor.White',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" px="20px" pt="20px" flexShrink={0}>
        <Stack direction="row" alignItems="center" gap="6px">
          <Typography variant="heading3" color="gray.90" sx={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.4 }}>
            List
          </Typography>
          <Box
            sx={{
              minWidth: 32,
              height: 26,
              px: '8px',
              borderRadius: '100px',
              bgcolor: 'gray.30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2SB14" color="gray.90">
              {loading ? '—' : formatRunCountLabel(runs.length)}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          disableElevation
          startIcon={<AddIcon />}
          sx={{
            bgcolor: 'content.iconActive',
            color: 'commonColor.White',
            textTransform: 'none',
            borderRadius: '10px',
            gap: '6px',
            px: '8px',
            py: '8px',
            minHeight: 36,
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.4,
            '& .MuiButton-startIcon': { margin: 0 },
            '&:hover': { bgcolor: '#25324a' },
          }}
        >
          Add File
        </Button>
      </Stack>

      <Stack direction="row" alignItems="center" gap="8px" px="20px" py="8px" flexShrink={0} width="100%" boxSizing="border-box">
        <MISelectMenu
          variant="outlined"
          selected={managerKey}
          onSelected={(v: string) => setManagerKey(v)}
          items={managerItems}
          placeholder="담당자명"
          sx={{
            flexShrink: 0,
            height: 40,
            borderRadius: '10px',
            borderColor: 'content.borderEnabled',
            color: 'content.textNormal',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 14,
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0, width: 0 }}>
          <MISearchInput
            storageKey="mi-fundamental-model-list"
            value={keyword}
            onChange={setKeyword}
            placeholder="Search"
            onSearch={(v) => {
              setCommittedKeyword(v)
            }}
            onClear={() => {
              setKeyword('')
              setCommittedKeyword('')
            }}
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
          px: '12px',
          pb: '24px',
        }}
      >
        <Stack
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            gap: '4px',
            pr: '4px',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'gray.40', borderRadius: '1000px' },
          }}
        >
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <Box key={`sk-card-${i}`} sx={{ px: '12px', py: '16px', borderRadius: '10px' }}>
                <Skeleton width={88} height={22} sx={{ borderRadius: '4px', mb: 1 }} />
                <Skeleton width="80%" height={22} sx={{ mb: 1 }} />
                <Skeleton width="60%" height={16} sx={{ mb: 0.5 }} />
                <Skeleton width="50%" height={16} />
              </Box>
            ))}

          {!loading &&
            filteredRuns.map((run) => {
              const selected = run.id === selectedId
              const sv = statusVisual(run.status)
              return (
                <Box
                  key={run.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(run.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(run.id)
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

                  <TruncatedLabel text={run.title} />

                  <Stack direction="row" alignItems="center" gap="8px" sx={{ minWidth: 0 }}>
                    <Typography variant="body3R12" color="content.textNormal" noWrap>
                      {run.createdAtLabel}
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{ borderColor: 'gray.40', height: 10, alignSelf: 'center' }} />
                    <Stack direction="row" alignItems="center" gap="4px" sx={{ minWidth: 0 }}>
                      <Typography variant="body3M12" color="content.textNormal" noWrap>
                        업데이트
                      </Typography>
                      <Typography variant="body3R12" color="content.textNormal" noWrap>
                        {run.updatedAtLabel}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack direction="row" alignItems="center" gap="4px" sx={{ minWidth: 0 }}>
                    <Typography variant="body3SB12" color="content.textNormal" flexShrink={0}>
                      담당자
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <TruncatedLabel text={run.managerName} variant="body3R12" color="content.textNormal" />
                    </Box>
                  </Stack>
                </Box>
              )
            })}
        </Stack>
      </Box>
    </Box>
  )
}

export default FundamentalModelRunList
