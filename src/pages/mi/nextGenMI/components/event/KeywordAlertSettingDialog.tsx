import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import { Box, Divider, IconButton, InputAdornment, Paper, Popper, Stack, Switch, TextField, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
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
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const { data, isLoading } = useQuery({
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
  const canAdd = !isFull && normalizeKeywordName(draft).length >= 2 && errorMessage === ''

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
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        sx={{ zIndex: 1300 }}
      >
        <Paper
          ref={paperRef}
          elevation={0}
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || pendingDelete) return
            event.stopPropagation()
            handleClose()
          }}
          sx={{
            width: '500px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 24px)',
            overflow: 'auto',
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

          <Typography padding="0 20px" color="contentText.Normal" variant="body2R14">
            등록된 키워드가 포함된 이벤트 발생 시 알림 메일이 발송됩니다.
          </Typography>

          <Stack gap="30px" padding="30px 20px">
            <Stack gap="4px">
              <Typography color="contentText.Normal" variant="body2M14">
                키워드 추가
              </Typography>
              <Stack direction="row" alignItems="center" gap="8px">
                <TextField
                  fullWidth
                  hiddenLabel
                  disabled={isFull || isCreating}
                  error={Boolean(errorMessage)}
                  placeholder="키워드를 입력하세요. (예: 호르무즈, JKM)"
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
                            <IconButton aria-label="입력 지우기" size="small" disabled={isFull || isCreating} onClick={() => setDraft('')}>
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
              {errorMessage && (
                <Typography color="contentText.Error" fontSize="12px" lineHeight={1.4}>
                  {errorMessage}
                </Typography>
              )}
            </Stack>

            <Divider sx={{ borderColor: 'contentBorder.Normal' }} />

            <Stack gap="20px">
              <Typography color="contentText.Normal" variant="body2M14">
                {`등록된 키워드 (${keywordCount}/${maxKeywordCount})`}
              </Typography>
              {isLoading ? null : keywords.length === 0 ? (
                <Typography color="contentText.Subtext" fontSize="12px" lineHeight={1.4} textAlign="center">
                  등록된 키워드가 없습니다.
                </Typography>
              ) : (
                <Stack>
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
                      <Typography color="contentText.Normal" variant="body2M14">
                        {item.keywordName}
                      </Typography>
                      <Stack direction="row" alignItems="center" gap="6px">
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
              )}
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
