import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, Dialog, Divider, IconButton, InputAdornment, Stack, Switch, TextField, Typography } from '@mui/material'
import { useState, useSyncExternalStore } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import TrashIcon from '@/components/common/icons/TrashIcon'
import MIInputClearIcon from '@/components/common/input/MIInputClearIcon'
import {
  addKeywordAlert,
  getKeywordAlerts,
  KEYWORD_ALERT_MAX_COUNT,
  KEYWORD_ALERT_MAX_LENGTH,
  KEYWORD_ALERT_MIN_LENGTH,
  removeKeywordAlert,
  subscribeKeywordAlerts,
  toggleKeywordAlert,
  type KeywordAlertItem,
} from '@/pages/mi/nextGenMI/utils/keywordAlertStore'

interface KeywordAlertSettingDialogProps {
  open: boolean
  onClose: () => void
}

const resolveKeywordError = (draft: string, keywords: KeywordAlertItem[]) => {
  const trimmed = draft.trim()
  if (trimmed.length === 0) return ''
  if (trimmed.length < KEYWORD_ALERT_MIN_LENGTH) return '2자 이상 입력하세요.'
  if (keywords.some((item) => item.keyword.toLowerCase() === trimmed.toLowerCase())) return '이미 등록된 키워드입니다.'
  return ''
}

const KeywordAlertSettingDialog = ({ open, onClose }: KeywordAlertSettingDialogProps) => {
  const keywords = useSyncExternalStore(subscribeKeywordAlerts, getKeywordAlerts, getKeywordAlerts)
  const [draft, setDraft] = useState('')
  const [pendingDelete, setPendingDelete] = useState<KeywordAlertItem | null>(null)
  const isFull = keywords.length >= KEYWORD_ALERT_MAX_COUNT
  const errorMessage = isFull ? '' : resolveKeywordError(draft, keywords)
  const canAdd = !isFull && draft.trim().length >= KEYWORD_ALERT_MIN_LENGTH && errorMessage === ''

  const handleAdd = () => {
    if (!canAdd) return
    addKeywordAlert(draft)
    setDraft('')
  }

  const handleClose = () => {
    setDraft('')
    setPendingDelete(null)
    onClose()
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              width: '500px',
              maxWidth: 'calc(100vw - 48px)',
              border: '1px solid',
              borderColor: 'contentBorder.Normal',
              borderRadius: '12px',
              boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
              margin: 0,
            },
          },
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
                disabled={isFull}
                error={Boolean(errorMessage)}
                placeholder="키워드를 입력하세요. (예: 호르무즈, JKM)"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, KEYWORD_ALERT_MAX_LENGTH))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleAdd()
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        {draft ? (
                          <IconButton aria-label="입력 지우기" size="small" disabled={isFull} onClick={() => setDraft('')}>
                            <MIInputClearIcon width={20} height={20} />
                          </IconButton>
                        ) : (
                          <Typography variant="body2R14" color="contentText.Placeholder">
                            {`${draft.length}/${KEYWORD_ALERT_MAX_LENGTH}`}
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
                    '& fieldset': { borderColor: 'contentBorder.Normal' },
                    '&:hover fieldset': { borderColor: 'contentBorder.Normal' },
                    '&.Mui-focused fieldset': { borderColor: 'contentBorder.Primaryactive', borderWidth: '1px' },
                    '&.Mui-error fieldset': { borderColor: 'contentBorder.Error' },
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
                disabled={!canAdd}
                onClick={handleAdd}
                labelColor={canAdd ? 'contentText.White' : 'contentText.Disabled'}
                sx={{
                  height: '36px',
                  minWidth: '61px',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  flexShrink: 0,
                  backgroundColor: canAdd ? 'contentIcon.ActivePrimary' : 'contentBG.Disabled',
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
              {`등록된 키워드 (${keywords.length}/${KEYWORD_ALERT_MAX_COUNT})`}
            </Typography>
            {keywords.length === 0 ? (
              <Typography color="contentText.Subtext" fontSize="12px" lineHeight={1.4} textAlign="center">
                등록된 키워드가 없습니다.
              </Typography>
            ) : (
              <Stack>
                {keywords.map((item) => (
                  <Stack
                    key={item.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    padding="12px 10px"
                    borderBottom="1px solid"
                    borderColor="gray.20"
                  >
                    <Typography color="contentText.Normal" variant="body2M14">
                      {item.keyword}
                    </Typography>
                    <Stack direction="row" alignItems="center" gap="6px">
                      <Switch
                        size="small"
                        checked={item.enabled}
                        onChange={() => toggleKeywordAlert(item.id)}
                        slotProps={{ input: { 'aria-label': `${item.keyword} 알림` } }}
                        sx={{ marginRight: 0 }}
                      />
                      <Box
                        component="button"
                        type="button"
                        aria-label={`${item.keyword} 삭제`}
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
                        }}
                      >
                        <TrashIcon width={20} height={20} />
                      </Box>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Dialog>

      <MIConfirm
        open={pendingDelete !== null}
        title="키워드 삭제"
        width={400}
        zIndex={1400}
        handleClose={() => setPendingDelete(null)}
        actions={[
          { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setPendingDelete(null) },
          {
            label: '삭제',
            variant: 'filled',
            color: 'red',
            onClick: () => {
              if (pendingDelete) removeKeywordAlert(pendingDelete.id)
              setPendingDelete(null)
            },
          },
        ]}
      >
        {`'${pendingDelete?.keyword ?? ''}' 키워드를 삭제하시겠습니까? 삭제하면 이 키워드에 대한 알림 메일이 더 이상 발송되지 않습니다.`}
      </MIConfirm>
    </>
  )
}

export default KeywordAlertSettingDialog
