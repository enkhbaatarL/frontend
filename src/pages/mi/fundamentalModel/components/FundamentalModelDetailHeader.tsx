import { Box, Button, IconButton, Skeleton, Stack, Typography } from '@mui/material'

import type { FundamentalModelDetail, FundamentalModelRunStatus } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import MoreIcon from '@/components/common/icons/agent/MoreIcon'

/** 본 페이지 우측 상세 헤더 props */
export interface FundamentalModelDetailHeaderProps {
  detail: FundamentalModelDetail | null
  /** 상세 로딩 */
  loading?: boolean
}

/** 상세 상단 상태 칩 색상 */
const headerStatusSx = (status: FundamentalModelRunStatus) => {
  if (status === 'in_progress') {
    return { bg: 'contentBG.PrimaryFade', color: 'mari.Primary', label: '진행 중' }
  }
  if (status === 'error') {
    return { bg: 'rgba(214, 51, 108, 0.1)', color: '#D6336C', label: '오류' }
  }
  return { bg: 'rgba(42, 141, 62, 0.1)', color: '#2A8D3E', label: '완료' }
}

/** 우측 상세 헤더(상태·제목·보내기·첨부 — Volumes/Price 탭은 페이지에서 분리) */
const FundamentalModelDetailHeader = ({ detail, loading = false }: FundamentalModelDetailHeaderProps) => {
  if (loading || !detail) {
    return (
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'gray.30',
          bgcolor: 'commonColor.White',
          pt: '20px',
          pr: '10px',
        }}
      >
        <Skeleton width={72} height={22} sx={{ borderRadius: '4px', mb: 1 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} mb={1}>
          <Skeleton variant="text" width="70%" height={40} />
          <Stack direction="row" gap={1}>
            <Skeleton variant="rounded" width={88} height={40} />
            <Skeleton variant="rounded" width={40} height={40} />
          </Stack>
        </Stack>
        <Skeleton variant="text" width="85%" height={28} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="55%" height={22} sx={{ mb: 2 }} />
        <Stack direction="row" gap={1} flexWrap="wrap" mb={1}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`fb-${i}`} variant="rounded" width={220} height={28} />
          ))}
        </Stack>
      </Box>
    )
  }

  const st = headerStatusSx(detail.status)

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'gray.30',
        bgcolor: 'commonColor.White',
        pt: '20px',
        pr: '10px',
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 22,
          px: '4px',
          borderRadius: '4px',
          bgcolor: st.bg,
          mb: '4px',
        }}
      >
        <Typography variant="body3SB12" sx={{ color: st.color, lineHeight: 1, textTransform: 'uppercase' }}>
          {st.label}
        </Typography>
      </Box>

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
        <Typography variant="heading2" color="gray.90" sx={{ flex: 1, minWidth: 0 }} noWrap title={detail.title}>
          {detail.title}
        </Typography>
        <Stack direction="row" alignItems="center" gap="4px" flexShrink={0}>
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
            Export
          </Button>
          <IconButton
            aria-label="추가 메뉴"
            sx={{
              border: '1px solid',
              borderColor: 'content.borderEnabled',
              borderRadius: '10px',
              color: 'content.iconActive',
            }}
          >
            <MoreIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Typography variant="body1M16" color="gray.70" sx={{ mt: '4px', pb: '6px' }} noWrap title={detail.subtitle}>
        {detail.subtitle}
      </Typography>

      <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap" sx={{ color: 'gray.70' }}>
        <Typography variant="body2R14" color="gray.70">
          {detail.managerName}
        </Typography>
        <Typography variant="body2R14" color="gray.70">
          {detail.createdAtLabel}
        </Typography>
        <Typography variant="body2R14" color="gray.70">
          {detail.durationLabel}
        </Typography>
      </Stack>

      <Stack direction="row" gap="4px" flexWrap="wrap" py="10px">
        {detail.attachmentNames.map((name: string) => (
          <Box
            key={name}
            sx={{
              border: '1px solid',
              borderColor: 'content.borderEnabled',
              borderRadius: '4px',
              px: '8px',
              py: '5px',
              minHeight: 26,
              maxWidth: '100%',
            }}
          >
            <Typography variant="body3SB12" color="gray.70" noWrap title={name}>
              {name}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

export default FundamentalModelDetailHeader
