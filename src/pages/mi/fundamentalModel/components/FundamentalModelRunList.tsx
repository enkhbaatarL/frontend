import { Box, Divider, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import AddIcon from '@/components/common/icons/AddIcon'
import AsyncAutocomplete from '@/components/common/input/AsyncAutocomplete'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import MIMorphingPopup, { type MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import useSnackbar from '@/hooks/useSnackbar'
import FundamentalModelFileUploadPopupContent from '@/pages/mi/fundamentalModel/components/FundamentalModelFileUploadPopupContent'
import {
  FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES,
  FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB,
  FUNDAMENTAL_UPLOAD_MAX_FILES,
  FUNDAMENTAL_UPLOAD_POPUP_WIDTH,
  UPLOAD_FILE_REQUIRED_BODY,
  UPLOAD_FILE_REQUIRED_TITLE,
  hasRequiredFundamentalModelFiles,
  isFundamentalUploadExcelFile,
  isSameFundamentalUploadFile,
} from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'
import { caseStatusVisual } from '@/pages/mi/fundamentalModel/fundamentalModelCaseStatus'
import { formatWorkbenchDateTime } from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'
import fundamentalModelCaseService, {
  type FundamentalModelCaseSearchType,
  type IFundamentalModelCaseListItem,
} from '@/service/mi/fundamentalModel/case'

/** left list container 고정 높이 */
const LIST_PANEL_HEIGHT = 900

/** 목록에 RUNNING 케이스가 있을 때 배지 갱신 주기 (ms) */
const LIST_POLL_INTERVAL_MS = 5000

export interface FundamentalModelRunListProps {
  selectedId: string
  onSelect: (id: string) => void
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
  const uploadPopupRef = useRef<MIMorphingPopupRef>(null)
  const { showSnackbar } = useSnackbar()
  const [searchField, setSearchField] = useState<RunListSearchField>('managerName')
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [showUploadTitleValidationError, setShowUploadTitleValidationError] = useState(false)

  const resetUploadPopup = useCallback(() => {
    setUploadTitle('')
    setUploadDescription('')
    setUploadFiles([])
    setShowUploadTitleValidationError(false)
  }, [])

  const handleUploadTitleChange = useCallback((value: string) => {
    setUploadTitle(value)
    setShowUploadTitleValidationError(false)
  }, [])

  const handleFilesAdd = useCallback(
    (selectedFiles: FileList | File[] | null) => {
      const incomingFiles = Array.from(selectedFiles ?? [])
      if (incomingFiles.length === 0) return

      let failureBody = ''
      const nextFiles = [...uploadFiles]

      incomingFiles.forEach((file) => {
        if (nextFiles.length >= FUNDAMENTAL_UPLOAD_MAX_FILES) {
          failureBody = `최대 ${FUNDAMENTAL_UPLOAD_MAX_FILES}개의 Excel 파일만 업로드할 수 있습니다.`
          return
        }
        if (!isFundamentalUploadExcelFile(file)) {
          failureBody = `${file.name}은(는) Excel 파일이 아닙니다.`
          return
        }
        if (file.size > FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES) {
          failureBody = `${file.name}은(는) ${FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB}MB를 초과합니다.`
          return
        }
        if (nextFiles.some((uploadedFile) => isSameFundamentalUploadFile(uploadedFile, file))) return

        nextFiles.push(file)
      })

      setUploadFiles(nextFiles)

      if (failureBody) {
        showSnackbar('파일 업로드가 실패했습니다.', { variant: 'error', body: failureBody })
      }
    },
    [showSnackbar, uploadFiles],
  )

  const handleRemoveUploadFile = useCallback((targetFile: File) => {
    setUploadFiles((prev) => prev.filter((file) => !isSameFundamentalUploadFile(file, targetFile)))
  }, [])

  const handleUploadSubmit = useCallback(() => {
    if (!uploadTitle.trim()) {
      setShowUploadTitleValidationError(true)
      return
    }

    if (!hasRequiredFundamentalModelFiles(uploadFiles)) {
      showSnackbar(UPLOAD_FILE_REQUIRED_TITLE, { variant: 'error', body: UPLOAD_FILE_REQUIRED_BODY })
      return
    }

    setShowUploadTitleValidationError(false)
    showSnackbar('파일 업로드가 완료되었습니다.', { variant: 'success' })
    uploadPopupRef.current?.close()
  }, [showSnackbar, uploadFiles, uploadTitle])

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
      const items = query.state.data?.cases ?? []
      return items.some((item) => item.status === 'RUNNING') ? LIST_POLL_INTERVAL_MS : false
    },
  })

  const cases = caseList?.cases ?? []
  const totalCount = caseList?.totalCount ?? cases.length

  useEffect(() => {
    if (listLoading || cases.length === 0 || selectedId) return
    onSelect(String(cases[0].caseId))
  }, [cases, listLoading, onSelect, selectedId])

  const uploadPopupContent = (
    <FundamentalModelFileUploadPopupContent
      titleValue={uploadTitle}
      descriptionValue={uploadDescription}
      files={uploadFiles}
      showTitleValidationError={showUploadTitleValidationError}
      onTitleChange={handleUploadTitleChange}
      onDescriptionChange={setUploadDescription}
      onFilesAdd={handleFilesAdd}
      onRemoveFile={handleRemoveUploadFile}
      onSubmit={handleUploadSubmit}
      onCancel={() => uploadPopupRef.current?.close()}
    />
  )

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
              {listLoading ? '—' : formatRunCountLabel(totalCount)}
            </Typography>
          </Box>
        </Stack>
        <MIMorphingPopup
          ref={uploadPopupRef}
          display="inline-flex"
          popup={{
            title: (
              <Box component="span" sx={{ typography: 'body1B16', color: 'contentText.Normal' }}>
                파일 추가
              </Box>
            ),
            content: uploadPopupContent,
            measureContent: uploadPopupContent,
            hideHeaderLine: true,
            showSkeleton: false,
            minWidth: FUNDAMENTAL_UPLOAD_POPUP_WIDTH,
            maxWidth: FUNDAMENTAL_UPLOAD_POPUP_WIDTH,
            borderRadius: '12px',
            onClose: resetUploadPopup,
          }}
        >
          <MIBaseButton
            variant="contained"
            prefix={<AddIcon />}
            onClick={() => uploadPopupRef.current?.open()}
            sx={{
              height: '36px',
            }}
          >
            Add File
          </MIBaseButton>
        </MIMorphingPopup>
      </Stack>

      <Stack direction="row" alignItems="center" gap="8px" px="20px" py="8px" flexShrink={0} width="100%" boxSizing="border-box">
        <MISelectMenu
          variant="outlined"
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
          {listLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <Box key={`sk-card-${i}`} sx={{ px: '12px', py: '16px', borderRadius: '10px' }}>
                <Skeleton width={88} height={22} sx={{ borderRadius: '4px', mb: 1 }} />
                <Skeleton width="80%" height={22} sx={{ mb: 1 }} />
                <Skeleton width="60%" height={16} sx={{ mb: 0.5 }} />
                <Skeleton width="50%" height={16} />
              </Box>
            ))}

          {!listLoading &&
            cases.map((item: IFundamentalModelCaseListItem) => {
              const caseId = String(item.caseId)
              const selected = caseId === selectedId
              const sv = caseStatusVisual(item.status)
              const createdAtLabel = formatWorkbenchDateTime(item.createdAt)
              const updatedAtLabel = formatWorkbenchDateTime(item.updatedAt)

              return (
                <Box
                  key={caseId}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(caseId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(caseId)
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
            })}
        </Stack>
      </Box>
    </Box>
  )
}

export default FundamentalModelRunList
