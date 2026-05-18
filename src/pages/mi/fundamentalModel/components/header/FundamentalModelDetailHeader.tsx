import { Box, Button, Divider, IconButton, Menu, MenuItem, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

import type { FundamentalModelDetail, FundamentalModelRunStatus } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import MoreVertIcon from '@/components/common/icons/MoreVertIcon'
import FundamentalModelMemoSection from '@/pages/mi/fundamentalModel/components/header/FundamentalModelMemoSection'

/** 본 페이지 우측 상세 헤더 props */
export interface FundamentalModelDetailHeaderProps {
  detail: FundamentalModelDetail | null
  /** 상세 로딩 */
  loading?: boolean
  /** 수정 메뉴 */
  onEdit?: () => void
  /** 삭제 메뉴 */
  onDelete?: () => void
}

interface HeaderMoreMenuProps {
  /** 수정 선택 */
  onEdit?: () => void
  /** 삭제 선택 */
  onDelete?: () => void
}

/** 헤더 세로 더보기(수정/삭제) 메뉴 */
const HeaderMoreMenu = ({ onEdit, onDelete }: HeaderMoreMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    onEdit?.()
    handleClose()
  }

  const handleDelete = () => {
    onDelete?.()
    handleClose()
  }

  return (
    <>
      <IconButton
        aria-label="추가 메뉴"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          width: 36,
          height: 36,
          p: '8px',
          border: '1px solid',
          borderColor: 'content.borderEnabled',
          borderRadius: '10px',
          color: 'content.iconActive',
          bgcolor: 'commonColor.White',
        }}
      >
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 120,
              borderRadius: '4px',
              border: '1px solid',
              borderColor: 'gray.30',
              boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.1)',
              mt: '4px',
            },
          },
          list: {
            sx: { py: '8px' },
          },
        }}
      >
        <MenuItem
          onClick={handleEdit}
          sx={{
            minHeight: 36,
            py: '8px',
            px: '12px',
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.4,
            color: 'content.textNormal',
            '&:hover': { bgcolor: 'gray.5' },
          }}
        >
          수정
        </MenuItem>
        <MenuItem
          onClick={handleDelete}
          sx={{
            minHeight: 36,
            py: '8px',
            px: '12px',
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.4,
            color: 'content.textNormal',
            '&:hover': { bgcolor: 'gray.5' },
          }}
        >
          삭제
        </MenuItem>
      </Menu>
    </>
  )
}

interface AttachmentListProps {
  /** 첨부 파일명 목록 */
  fileNames: string[]
}

/** 헤더 파일 목록 - 긴 파일명 줄바꿈 */
const AttachmentList = ({ fileNames }: AttachmentListProps) => {
  if (fileNames.length === 0) return null

  return (
    <Stack direction="row" flexWrap="wrap" gap="4px" py="10px" sx={{ width: '100%' }}>
      {fileNames.map((name) => (
        <Box
          key={name}
          sx={{
            alignSelf: 'flex-start',
            maxWidth: '100%',
            border: '1px solid',
            borderColor: 'content.borderEnabled',
            borderRadius: '4px',
            px: '8px',
            py: '5px',
            minHeight: 26,
            bgcolor: 'commonColor.White',
            boxSizing: 'border-box',
          }}
        >
          <Typography
            variant="body3SB12"
            color="content.textNormal"
            sx={{
              display: 'block',
              lineHeight: 1,
              wordBreak: 'break-all',
              whiteSpace: 'normal',
            }}
          >
            {name}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

/** 상세 상단 상태 칩 색상 */
const headerStatusSx = (status: FundamentalModelRunStatus) => {
  if (status === 'in_progress') {
    return { bg: 'contentBG.PrimaryFade', color: 'mari.Primary', label: 'IN PROGRESS' }
  }
  if (status === 'error') {
    return { bg: 'rgba(214, 51, 108, 0.1)', color: '#D6336C', label: 'ERROR' }
  }
  return { bg: 'rgba(42, 141, 62, 0.1)', color: '#2A8D3E', label: 'DONE' }
}

interface HeaderTitleProps {
  title: string
}

/** 헤더 제목 - 말줄임 + 툴팁 */
const HeaderTitle = ({ title }: HeaderTitleProps) => {
  const titleRef = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(false)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    setOverflow(el.scrollWidth > el.clientWidth)
  }, [title])

  const heading = (
    <Typography
      ref={titleRef}
      component="span"
      sx={{
        flex: 1,
        minWidth: 0,
        fontSize: 24,
        fontWeight: 700,
        lineHeight: 1.4,
        color: 'gray.90',
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {title}
    </Typography>
  )

  return overflow ? (
    <Tooltip title={title} arrow placement="top">
      {heading}
    </Tooltip>
  ) : (
    heading
  )
}

/** 우측 상세 헤더(상태|제목|메모|첨부) */
const FundamentalModelDetailHeader = ({ detail, loading = false, onEdit, onDelete }: FundamentalModelDetailHeaderProps) => {
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
          <Stack direction="row" gap="4px">
            <Skeleton variant="rounded" width={88} height={36} />
            <Skeleton variant="rounded" width={36} height={36} />
          </Stack>
        </Stack>
        <Skeleton variant="text" width="85%" height={44} sx={{ mb: 1 }} />
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
        <Typography variant="body3SB12" sx={{ color: st.color, fontSize: 13, lineHeight: 1, textTransform: 'uppercase' }}>
          {st.label}
        </Typography>
      </Box>

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap="4px" sx={{ mb: '4px' }}>
        <HeaderTitle title={detail.title} />
        <Stack direction="row" alignItems="center" gap="4px" flexShrink={0}>
          <Button
            variant="contained"
            disableElevation
            sx={{
              bgcolor: 'content.iconActive',
              color: 'commonColor.White',
              textTransform: 'none',
              borderRadius: '10px',
              px: '8px',
              py: '8px',
              minHeight: 36,
              fontWeight: 600,
              fontSize: 14,
              lineHeight: 1.4,
              '&:hover': { bgcolor: '#25324a' },
            }}
          >
            Export
          </Button>
          <HeaderMoreMenu onEdit={onEdit} onDelete={onDelete} />
        </Stack>
      </Stack>

      <FundamentalModelMemoSection text={detail.subtitle} />

      <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap" sx={{ color: 'content.textNormal' }}>
        <Typography variant="body2R14" color="content.textNormal" noWrap>
          {detail.managerName}
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ borderColor: 'gray.40', height: 10, alignSelf: 'center' }} />
        <Typography variant="body2R14" color="content.textNormal" noWrap>
          {detail.createdAtLabel}
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ borderColor: 'gray.40', height: 10, alignSelf: 'center' }} />
        <Typography variant="body2R14" color="content.textNormal" noWrap>
          {detail.durationLabel}
        </Typography>
      </Stack>

      <AttachmentList fileNames={detail.attachmentNames} />
    </Box>
  )
}

export default FundamentalModelDetailHeader
