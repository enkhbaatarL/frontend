import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'

import type { FundamentalModelRunListItem, FundamentalModelRunStatus } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import MISearchInput from '@/components/common/input/MISearchInput'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'

export interface FundamentalModelRunListProps {
  runs: FundamentalModelRunListItem[]
  selectedId: string
  onSelect: (id: string) => void
  loading?: boolean
}

/** 상태 배지용 배경 - 글자색 (Figma Chip 톤) */
const statusVisual = (status: FundamentalModelRunStatus) => {
  if (status === 'in_progress') {
    return { bg: 'contentBG.PrimaryFade', color: 'mari.Primary', label: '진행 중' }
  }
  if (status === 'error') {
    return { bg: 'rgba(214, 51, 108, 0.1)', color: '#D6336C', label: '오류' }
  }
  return { bg: 'rgba(42, 141, 62, 0.1)', color: '#2A8D3E', label: '완료' }
}

/** 좌측 시뮬레이션 목록(검색 - 담당자 필터 - 카드 리스트) — Volume/Price 공통 */
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
        flexShrink: 0,
        bgcolor: 'commonColor.White',
        borderRadius: '10px',
        border: '1px solid',
        borderColor: 'gray.30',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 160px)',
        minHeight: 520,
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" px="20px" pt="20px">
        <Stack direction="row" alignItems="center" gap="6px">
          <Typography variant="heading3" color="gray.90" sx={{ fontSize: '20px', lineHeight: 1.4 }}>
            목록
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
              {loading ? '—' : runs.length}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          disableElevation
          sx={{
            bgcolor: '#2E3F5E',
            color: 'commonColor.White',
            textTransform: 'none',
            borderRadius: '10px',
            px: '10px',
            py: '8px',
            fontWeight: 600,
            fontSize: 14,
            '&:hover': { bgcolor: '#25324a' },
          }}
        >
          파일 추가
        </Button>
      </Stack>

      <Stack direction="row" alignItems="center" gap="8px" px="20px" py="8px">
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
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <MISearchInput
            storageKey="mi-fundamental-model-list"
            value={keyword}
            onChange={setKeyword}
            placeholder="검색"
            onSearch={(v) => {
              setCommittedKeyword(v)
            }}
            onClear={() => {
              setKeyword('')
              setCommittedKeyword('')
            }}
            height={40}
          />
        </Box>
      </Stack>

      <Stack sx={{ flex: 1, overflowY: 'auto', px: '12px', pb: '24px', gap: '4px' }}>
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
                  '&:hover': { bgcolor: selected ? 'gray.5' : 'gray.5' },
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 22,
                    px: '4px',
                    borderRadius: '4px',
                    bgcolor: sv.bg,
                    mb: '4px',
                  }}
                >
                  <Typography variant="body3SB12" sx={{ color: sv.color, lineHeight: 1, textTransform: 'uppercase' }}>
                    {sv.label}
                  </Typography>
                </Box>
                <Typography variant="body1SB16" color="gray.90" noWrap>
                  {run.title}
                </Typography>
                <Stack direction="row" alignItems="center" gap="8px" mt="4px" flexWrap="wrap">
                  <Typography variant="body3R12" color="gray.60">
                    {run.createdAtLabel}
                  </Typography>
                  <Stack direction="row" alignItems="center" gap="4px">
                    <Typography variant="body3M12" color="gray.60">
                      업데이트
                    </Typography>
                    <Typography variant="body3R12" color="gray.60">
                      {run.updatedAtLabel}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" alignItems="center" gap="4px" mt="4px">
                  <Typography variant="body3SB12" color="gray.60">
                    담당자
                  </Typography>
                  <Typography variant="body3R12" color="gray.60">
                    {run.managerName}
                  </Typography>
                </Stack>
              </Box>
            )
          })}
      </Stack>
    </Box>
  )
}

export default FundamentalModelRunList
