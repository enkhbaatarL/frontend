import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import {
  Box,
  Collapse,
  Divider,
  Fade,
  IconButton,
  InputAdornment,
  Paper,
  Popper,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import LoadingSpinner from '@/components/common/influence-factor-chart/icons/LoadingSpinIcon'
import MIInputClearIcon from '@/components/common/input/MIInputClearIcon'
import useSnackbar from '@/hooks/useSnackbar'
import nextGenMIEventKeywordService, { type EventKeywordSetting } from '@/service/mi/nextGenMI/eventKeyword'

interface KeywordAlertSettingDialogProps {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
}

const EVENT_KEYWORD_QUERY_KEY = ['nextGenMIEventKeywords'] as const

const normalizeKeywordName = (value: string) => value.trim().replace(/\s+/g, ' ').normalize('NFC')

const resolveKeywordError = (draft: string, keywords: EventKeywordSetting[]) => {
  const keywordName = normalizeKeywordName(draft)
  if (keywordName.length === 0) return ''
  if (keywordName.length < 2) return '2자 이상 입력하세요.'
  if (keywordName.length > 30) return '키워드는 30자 이하로 입력하세요.'
  if (keywords.some((item) => item.keywordName.toLowerCase() === keywordName.toLowerCase())) return '이미 등록된 키워드입니다.'
  return ''
}

const getApiErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError<{ message?: string }>(error)) return ''
  return error.response?.data?.message?.trim() ?? ''
}

const KeywordAlertSettingDialog = ({ open, anchorEl, onClose }: KeywordAlertSettingDialogProps) => {
  const paperRef = useRef<HTMLDivElement>(null)
  const keywordFormRef = useRef<HTMLDivElement>(null)
  const keywordListRef = useRef<HTMLDivElement>(null)
  const keywordRowsRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const sideBySide = useMediaQuery('(min-width: 848px)')
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const { data, isLoading, isError } = useQuery({
    queryKey: EVENT_KEYWORD_QUERY_KEY,
    queryFn: () => nextGenMIEventKeywordService.getKeywordSettings(),
    enabled: open,
  })
  const keywords = data?.keywords ?? []
  const keywordCount = data?.keywordCount ?? keywords.length
  const maxKeywordCount = data?.maxKeywordCount ?? 20
  const [draft, setDraft] = useState('')
  const [serverError, setServerError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<EventKeywordSetting | null>(null)
  const clientError = resolveKeywordError(draft, keywords)
  const errorMessage = serverError || clientError
  const isFull = keywordCount >= maxKeywordCount
  const canAdd = !isLoading && !isError && !isFull && normalizeKeywordName(draft).length >= 2 && errorMessage === ''

  const refreshKeywords = () => queryClient.invalidateQueries({ queryKey: EVENT_KEYWORD_QUERY_KEY })

  const { mutate: createKeyword, isPending: isCreating } = useMutation({
    mutationFn: (keywordName: string) => nextGenMIEventKeywordService.createKeywordSetting(keywordName),
    onSuccess: async () => {
      setDraft('')
      setServerError('')
      await refreshKeywords()
    },
    onError: (error) => {
      setServerError(getApiErrorMessage(error) || '키워드 등록에 실패했습니다.')
    },
  })

  const {
    mutate: updateNotificationUse,
    isPending: isUpdating,
    variables: updatingKeyword,
  } = useMutation({
    mutationFn: (item: EventKeywordSetting) =>
      nextGenMIEventKeywordService.updateNotificationUse(item.keywordSettingId, !item.isNotificationUse),
    onSuccess: async () => {
      await refreshKeywords()
    },
    onError: (error) => {
      showSnackbar(getApiErrorMessage(error) || '키워드 알림 설정 변경에 실패했습니다.', { variant: 'error' })
    },
  })

  const { mutate: deleteKeyword, isPending: isDeleting } = useMutation({
    mutationFn: (keywordSettingId: number) => nextGenMIEventKeywordService.deleteKeywordSetting(keywordSettingId),
    onSuccess: async () => {
      setPendingDelete(null)
      await refreshKeywords()
    },
    onError: (error) => {
      showSnackbar(getApiErrorMessage(error) || '키워드 삭제에 실패했습니다.', { variant: 'error' })
    },
  })

  const handleAdd = () => {
    const keywordName = normalizeKeywordName(draft)
    if (!canAdd || isCreating || keywordName.length < 2) return
    setServerError('')
    createKeyword(keywordName)
  }

  const handleClose = useCallback(() => {
    if (isCreating || isDeleting) return
    setDraft('')
    setServerError('')
    setPendingDelete(null)
    onClose()
  }, [isCreating, isDeleting, onClose])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event: PointerEvent) => {
      if (pendingDelete || isCreating || isDeleting) return
      const target = event.target
      if (paperRef.current && target instanceof Node && paperRef.current.contains(target)) return
      if (anchorEl && target instanceof Node && anchorEl.contains(target)) return
      if (target instanceof Element && target.closest('.MuiDialog-root')) return
      handleClose()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [anchorEl, handleClose, isCreating, isDeleting, open, pendingDelete])

  return (
    <>
      <Popper
        open={open && anchorEl !== null}
        anchorEl={anchorEl}
        placement="bottom-start"
        popperOptions={{ strategy: 'fixed' }}
        modifiers={[
          { name: 'offset', options: { offset: [0, 8] } },
          { name: 'flip', enabled: false },
          { name: 'preventOverflow', options: { padding: 24, altAxis: false } },
          {
            name: 'keywordAlertHeight',
            enabled: true,
            phase: 'beforeRead',
            fn: ({ state }) => {
              if (!anchorEl || !paperRef.current) return
              const maxHeight = Math.max(
                0,
                document.documentElement.clientHeight - Math.max(24, anchorEl.getBoundingClientRect().bottom + 8) - 24,
              )
              if (!keywordListRef.current) return
              const listOffset =
                keywordListRef.current.getBoundingClientRect().top -
                paperRef.current.getBoundingClientRect().top +
                paperRef.current.scrollTop
              const bottomInset = sideBySide ? 21 : 31
              const listMaxHeight = Math.max(0, maxHeight - listOffset - bottomInset)
              const lastVisibleRow = keywordRowsRef.current?.children[Math.min(keywords.length, 5) - 1]
              const visibleRowsHeight =
                lastVisibleRow && keywordRowsRef.current
                  ? lastVisibleRow.getBoundingClientRect().bottom - keywordRowsRef.current.getBoundingClientRect().top
                  : 96
              const listHeight = Math.min(Math.max(visibleRowsHeight, 96), listMaxHeight)
              const formBottom = keywordFormRef.current
                ? keywordFormRef.current.getBoundingClientRect().bottom -
                  paperRef.current.getBoundingClientRect().top +
                  paperRef.current.scrollTop
                : 0
              state.elements.popper.style.setProperty(
                '--keyword-alert-height',
                `${Math.min(Math.max(listOffset + listHeight, formBottom) + bottomInset, maxHeight)}px`,
              )
              state.elements.popper.style.setProperty('--keyword-alert-list-height', `${listHeight}px`)
            },
            effect: ({ instance }) => {
              let frame = 0
              let previousAnchorRect = anchorEl?.getBoundingClientRect()
              // 헤더 전환 중에는 스크롤 이벤트 없이도 버튼의 화면 좌표가 바뀐다.
              const syncAnchorPosition = () => {
                if (!anchorEl) return
                const anchorRect = anchorEl.getBoundingClientRect()
                if (
                  !previousAnchorRect ||
                  anchorRect.top !== previousAnchorRect.top ||
                  anchorRect.left !== previousAnchorRect.left ||
                  anchorRect.width !== previousAnchorRect.width ||
                  anchorRect.height !== previousAnchorRect.height
                ) {
                  previousAnchorRect = anchorRect
                  void instance.update()
                }
                frame = requestAnimationFrame(syncAnchorPosition)
              }
              frame = requestAnimationFrame(syncAnchorPosition)
              const observer = new ResizeObserver(() => {
                void instance.update()
              })
              if (keywordFormRef.current) observer.observe(keywordFormRef.current)
              if (keywordRowsRef.current) observer.observe(keywordRowsRef.current)
              return () => {
                cancelAnimationFrame(frame)
                observer.disconnect()
              }
            },
          },
        ]}
        sx={{ zIndex: 1300 }}
      >
        <Paper
          ref={paperRef}
          className="disabledScroll"
          elevation={0}
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || pendingDelete) return
            event.stopPropagation()
            handleClose()
          }}
          sx={{
            width: sideBySide ? '800px' : '500px',
            maxWidth: 'calc(100vw - 32px)',
            height: 'var(--keyword-alert-height, auto)',
            transition: reduceMotion ? 'none' : 'height 220ms cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'auto',
            scrollbarWidth: 'none',
            border: '1px solid',
            borderColor: 'contentBorder.Normal',
            borderRadius: '12px',
            boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
            bgcolor: 'commonColor.White',
          }}
        >
          <Stack direction="row" alignItems="center" padding="20px 20px 10px">
            <Typography flex={1} color="contentText.Normal" fontSize="16px" fontWeight={700} lineHeight={1.4}>
              키워드 알림 설정
            </Typography>
            <MIBaseButton
              aria-label="닫기"
              variant="text"
              onClick={handleClose}
              sx={{ height: '32px', width: '32px', minWidth: '32px', padding: '6px' }}
            >
              <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
            </MIBaseButton>
          </Stack>

          <Stack
            direction={sideBySide ? 'row' : 'column'}
            alignItems={sideBySide ? 'flex-start' : 'stretch'}
            gap={sideBySide ? '20px' : '0px'}
            padding={sideBySide ? '0 20px 20px' : '0px'}
          >
            <Stack ref={keywordFormRef} flex={sideBySide ? 1 : undefined} minWidth={0}>
              <Typography padding={sideBySide ? '0px' : '0 20px'} color="contentText.Normal" variant="body2R14">
                등록된 키워드가 포함된 이벤트 발생 시 알림 메일이 발송됩니다.
              </Typography>
              <Stack gap="4px" padding={sideBySide ? '20px 0 0' : '30px 20px 0'}>
                <Typography color="contentText.Normal" variant="body2M14">
                  키워드 추가
                </Typography>
                <Stack direction="row" alignItems="center" gap="8px">
                  <TextField
                    fullWidth
                    hiddenLabel
                    disabled={isFull || isCreating}
                    error={Boolean(errorMessage)}
                    placeholder={sideBySide ? '키워드를 입력하세요.' : '키워드를 입력하세요. (예: 호르무즈, JKM)'}
                    value={draft}
                    onChange={(event) => {
                      setServerError('')
                      setDraft(event.target.value.slice(0, 30))
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleAdd()
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            {draft ? (
                              <IconButton
                                aria-label="입력 지우기"
                                size="small"
                                disabled={isFull || isCreating}
                                onClick={() => setDraft('')}
                              >
                                <MIInputClearIcon width={20} height={20} />
                              </IconButton>
                            ) : (
                              <Typography variant="body2R14" color="contentText.Placeholder">
                                {`${draft.length}/30`}
                              </Typography>
                            )}
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        borderRadius: '10px',
                        paddingRight: '8px',
                        backgroundColor: 'common.white',
                        '& fieldset': { border: 'none' },
                        '&.Mui-error, &:hover.Mui-error, &.Mui-focused.Mui-error': {
                          borderColor: 'contentText.Error',
                        },
                        '&.Mui-disabled': { backgroundColor: 'contentBG.Disabled' },
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '8px 12px',
                        fontSize: '14px',
                        lineHeight: 1.4,
                        '&::placeholder': { color: 'contentText.Placeholder', opacity: 1 },
                      },
                    }}
                  />
                  <MIBaseButton
                    variant="contained"
                    disabled={!canAdd || isCreating}
                    onClick={handleAdd}
                    labelColor={canAdd && !isCreating ? 'contentText.White' : 'contentText.Disabled'}
                    sx={{
                      height: '36px',
                      minWidth: '61px',
                      borderRadius: '8px',
                      padding: '7px 16px',
                      flexShrink: 0,
                      backgroundColor: canAdd && !isCreating ? 'contentIcon.ActivePrimary' : 'contentBG.Disabled',
                      '&:hover:not(:disabled)': { backgroundColor: 'contentIcon.ActivePrimary' },
                      '&.Mui-disabled': { backgroundColor: 'contentBG.Disabled' },
                    }}
                  >
                    추가
                  </MIBaseButton>
                </Stack>
                {sideBySide && (
                  <Typography marginTop="4px" color="contentText.Subtext" fontSize="12px" lineHeight={1.4}>
                    예: 호르무즈, JKM
                  </Typography>
                )}
                {errorMessage && (
                  <Typography color="contentText.Error" fontSize="12px" lineHeight={1.4}>
                    {errorMessage}
                  </Typography>
                )}
              </Stack>
            </Stack>

            <Divider
              orientation={sideBySide ? 'vertical' : 'horizontal'}
              flexItem
              sx={{ borderColor: 'contentBorder.Normal', margin: sideBySide ? '0px' : '30px 20px' }}
            />

            <Stack gap="20px" flex={sideBySide ? 1 : undefined} minWidth={0} padding={sideBySide ? '0px' : '0 20px 30px'}>
              <Typography color="contentText.Normal" variant="body2M14">
                {`등록된 키워드 (${isLoading || isError ? '-' : keywordCount}/${maxKeywordCount})`}
              </Typography>
              <Stack ref={keywordListRef} position="relative" aria-busy={isLoading}>
                {isLoading && (
                  <Stack
                    position="absolute"
                    top="0px"
                    left="0px"
                    width="100%"
                    height="96px"
                    alignItems="center"
                    justifyContent="center"
                    gap="8px"
                    role="status"
                  >
                    <LoadingSpinner size={24} stop={reduceMotion} />
                    <Typography color="contentText.Subtext" fontSize="12px" lineHeight={1.4}>
                      키워드를 불러오는 중입니다.
                    </Typography>
                  </Stack>
                )}
                <Collapse in={!isLoading} collapsedSize="96px" timeout={reduceMotion ? 0 : 220}>
                  <Fade in={!isLoading} timeout={reduceMotion ? 80 : 220}>
                    <Stack minHeight="96px" justifyContent={keywords.length === 0 ? 'center' : 'flex-start'}>
                      {isLoading ? null : isError ? (
                        <Typography color="contentText.Subtext" fontSize="12px" lineHeight={1.4} textAlign="center">
                          키워드를 불러오지 못했습니다.
                        </Typography>
                      ) : keywords.length === 0 ? (
                        <Typography color="contentText.Subtext" fontSize="12px" lineHeight={1.4} textAlign="center">
                          등록된 키워드가 없습니다.
                        </Typography>
                      ) : (
                        <ScrollWrapper
                          height="var(--keyword-alert-list-height, 96px)"
                          scrollbarGap={12}
                          thumbInsetTop={6}
                          thumbInsetBottom={6}
                          reserveScrollbarGap
                          showScrollbarOnHover
                          showScrollEdgeShadow
                          sx={{
                            maxHeight: 'none',
                            transition: reduceMotion ? 'none' : 'height 220ms cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          <Stack ref={keywordRowsRef}>
                            {keywords.map((item) => (
                              <Stack
                                key={item.keywordSettingId}
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                padding="12px 10px"
                                borderBottom="1px solid"
                                borderColor="gray.20"
                              >
                                <Typography color="contentText.Normal" variant="body2M14" minWidth={0} sx={{ overflowWrap: 'anywhere' }}>
                                  {item.keywordName}
                                </Typography>
                                <Stack direction="row" alignItems="center" gap="6px" flexShrink={0}>
                                  <Switch
                                    size="small"
                                    checked={item.isNotificationUse}
                                    disabled={isUpdating && updatingKeyword?.keywordSettingId === item.keywordSettingId}
                                    onChange={() => updateNotificationUse(item)}
                                    slotProps={{ input: { 'aria-label': `${item.keywordName} 알림` } }}
                                    sx={{ marginRight: 0 }}
                                  />
                                  <Box
                                    component="button"
                                    type="button"
                                    aria-label={`${item.keywordName} 삭제`}
                                    disabled={isDeleting}
                                    onClick={() => setPendingDelete(item)}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '28px',
                                      height: '28px',
                                      padding: '4px',
                                      border: 0,
                                      borderRadius: '4px',
                                      backgroundColor: 'transparent',
                                      color: 'contentIcon.Enabled',
                                      cursor: 'pointer',
                                      '&:disabled': { cursor: 'default', opacity: 0.4 },
                                    }}
                                  >
                                    <DeleteOutline sx={{ fontSize: '20px' }} />
                                  </Box>
                                </Stack>
                              </Stack>
                            ))}
                          </Stack>
                        </ScrollWrapper>
                      )}
                    </Stack>
                  </Fade>
                </Collapse>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Popper>

      <MIConfirm
        open={pendingDelete !== null}
        title="키워드 삭제"
        width={400}
        zIndex={1400}
        handleClose={() => {
          if (isDeleting) return
          setPendingDelete(null)
        }}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              if (isDeleting) return
              setPendingDelete(null)
            },
          },
          {
            label: '삭제',
            variant: 'filled',
            color: 'red',
            onClick: () => {
              if (!pendingDelete || isDeleting) return
              deleteKeyword(pendingDelete.keywordSettingId)
            },
          },
        ]}
      >
        {`'${pendingDelete?.keywordName ?? ''}' 키워드를 삭제하시겠습니까? 삭제하면 이 키워드에 대한 알림 메일이 더 이상 발송되지 않습니다.`}
      </MIConfirm>
    </>
  )
}

export default KeywordAlertSettingDialog
