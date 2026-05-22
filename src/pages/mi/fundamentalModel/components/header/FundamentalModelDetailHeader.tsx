import { Box, Divider, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { FundamentalModelDetail, FundamentalModelRunStatus } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import MoreVertIcon from '@/components/common/icons/MoreVertIcon'
import MIDropdownMenu from '@/components/common/menu/MIDropdownMenu'
import MIMorphingPopup, { type MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import useSnackbar from '@/hooks/useSnackbar'
import { FUNDAMENTAL_UPLOAD_POPUP_WIDTH } from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'
import FundamentalModelCaseEditPopupContent from '@/pages/mi/fundamentalModel/components/header/FundamentalModelCaseEditPopupContent'
import FundamentalModelMemoSection from '@/pages/mi/fundamentalModel/components/header/FundamentalModelMemoSection'

/** 본 페이지 우측 상세 헤더 props */
export interface FundamentalModelDetailHeaderProps {
  detail: FundamentalModelDetail | null
  /** 상세 로딩 */
  loading?: boolean
  /** 수정 메뉴 */
  onEdit?: () => void
  /** 삭제 메뉴 */
  onDelete?: () => boolean | void | Promise<boolean | void>
  /** 대시보드(아웃풋) 엑셀보내기 */
  onExportDashboardExcel?: () => void
  /** 중간파일 zip보내기 */
  onExportIntermediateZip?: () => void
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

/** 삭제 확인 다이얼로그 너비 (Figma 450px) */
const FUNDAMENTAL_DELETE_CONFIRM_WIDTH = 450

/** 우측 상세 헤더(상태|제목|메모|첨부) */
const FundamentalModelDetailHeader = ({
  detail,
  loading = false,
  onEdit,
  onDelete,
  onExportDashboardExcel,
  onExportIntermediateZip,
}: FundamentalModelDetailHeaderProps) => {
  const { showSnackbar } = useSnackbar()
  const editPopupRef = useRef<MIMorphingPopupRef>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showTitleDuplicateError, setShowTitleDuplicateError] = useState(false)

  const openEditPopup = useCallback(() => {
    if (!detail) return
    setEditTitle(detail.title)
    setEditDescription(detail.subtitle)
    setShowTitleDuplicateError(false)
    editPopupRef.current?.open()
  }, [detail])

  const closeEditPopup = useCallback(() => {
    editPopupRef.current?.close()
  }, [])

  const openDeleteConfirm = useCallback(() => {
    if (!detail) return
    setDeleteConfirmOpen(true)
  }, [detail])

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(false)
  }, [])

  const handleEditTitleChange = useCallback((value: string) => {
    setEditTitle(value)
    setShowTitleDuplicateError(false)
  }, [])

  const handleEditSubmit = useCallback(() => {
    if (!detail) return
    if (editTitle.trim() === detail.title.trim()) {
      setShowTitleDuplicateError(true)
      return
    }

    setShowTitleDuplicateError(false)
    // TODO: API 연동 후 수정 성공 시 리스트/상세 데이터 동기화 처리 필요.
    onEdit?.()
    editPopupRef.current?.close()
  }, [detail, editTitle, onEdit])

  const editPopupContent = (
    <FundamentalModelCaseEditPopupContent
      titleValue={editTitle}
      descriptionValue={editDescription}
      showTitleDuplicateError={showTitleDuplicateError}
      onTitleChange={handleEditTitleChange}
      onDescriptionChange={setEditDescription}
      onSubmit={handleEditSubmit}
      onCancel={closeEditPopup}
    />
  )

  const handleDeleteSubmit = useCallback(async () => {
    if (!detail) return

    try {
      const deleteResult = await onDelete?.()
      if (deleteResult === false) {
        throw new Error('FUNDAMENTAL_MODEL_DELETE_FAILED')
      }

      showSnackbar('삭제 완료되었습니다.', { variant: 'success' })
      setDeleteConfirmOpen(false)
    } catch (_error) {
      showSnackbar('삭제 실패되었습니다.', { variant: 'error' })
    }
  }, [detail, onDelete, showSnackbar])

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
    <>
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
            <MIDropdownMenu
              label="Export"
              variant="contained"
              placement="bottom-end"
              items={[
                { label: '대시보드 (아웃풋) 엑셀', action: () => onExportDashboardExcel?.() },
                { label: '중간파일 zip', action: () => onExportIntermediateZip?.() },
              ]}
              sx={{
                height: '36px',
              }}
              paperProps={{
                sx: {
                  minWidth: '180px',
                },
              }}
            />
            <MIMorphingPopup
              ref={editPopupRef}
              display="inline-flex"
              popup={{
                title: (
                  <Box component="span" sx={{ typography: 'body1B16', color: 'contentText.Normal' }}>
                    시뮬레이션 케이스 수정
                  </Box>
                ),
                content: editPopupContent,
                measureContent: editPopupContent,
                hideHeaderLine: true,
                showSkeleton: false,
                minWidth: FUNDAMENTAL_UPLOAD_POPUP_WIDTH,
                maxWidth: FUNDAMENTAL_UPLOAD_POPUP_WIDTH,
                borderRadius: '12px',
                onClose: () => setShowTitleDuplicateError(false),
              }}
            >
              <MIDropdownMenu
                label={<MoreVertIcon />}
                variant="outlined"
                placement="bottom-end"
                items={[
                  { label: '수정', action: openEditPopup },
                  { label: '삭제', action: openDeleteConfirm },
                ]}
                sx={{
                  height: '36px',
                  padding: '8px',
                }}
                paperProps={{
                  sx: {
                    minWidth: '120px',
                  },
                }}
              />
            </MIMorphingPopup>
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

      <MIConfirm
        open={deleteConfirmOpen}
        title="시뮬레이션 케이스 삭제"
        width={FUNDAMENTAL_DELETE_CONFIRM_WIDTH}
        handleClose={closeDeleteConfirm}
        actions={[
          { label: '취소', variant: 'outlined', color: 'gray', onClick: closeDeleteConfirm },
          { label: '확인', variant: 'filled', color: 'primary', onClick: handleDeleteSubmit },
        ]}
        contentSx={{ paddingTop: 0 }}
        titleSx={{ fontWeight: 700, fontSize: '16px' }}
      >
        {`삭제 후에는 복구할 수 없습니다.\n(${detail.title})을 삭제하시겠습니까?`}
      </MIConfirm>
    </>
  )
}

export default FundamentalModelDetailHeader
