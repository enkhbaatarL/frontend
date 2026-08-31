import AddIcon from '@mui/icons-material/Add'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import { Box, Divider, IconButton, List, ListItem, Stack, Switch, Typography } from '@mui/material'
import axios from 'axios'
import { useCallback, useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIMaskInput from '@/components/common/input/MIMaskInput'
import MISelectMenu, { SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import useSnackbar from '@/hooks/useSnackbar'
import newsletterService from '@/service/mi/newsletter'

const MAX_RECIPIENTS = 100
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RECIPIENT_LIST_STORAGE_KEY = 'newsletter-share-recipients'

export type RecipientType = 'To' | 'Cc' | 'Bcc'
export interface RecipientItem {
  email: string
  type: RecipientType
}

/** onSend 등 평면 목록이 필요할 때 */
const flattenRecipientBuckets = (toEmails: string[], ccEmails: string[], bccEmails: string[]): RecipientItem[] => [
  ...toEmails.map((email) => ({ email, type: 'To' as const })),
  ...ccEmails.map((email) => ({ email, type: 'Cc' as const })),
  ...bccEmails.map((email) => ({ email, type: 'Bcc' as const })),
]

interface StoredBuckets {
  to: string[]
  cc: string[]
  bcc: string[]
}

const emptyBuckets = (): StoredBuckets => ({ to: [], cc: [], bcc: [] })

const loadStoredBuckets = (): StoredBuckets | null => {
  try {
    const stored = localStorage.getItem(RECIPIENT_LIST_STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as unknown

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const o = parsed as Record<string, unknown>
      const to = Array.isArray(o.to) ? o.to.map((e) => String(e)) : []
      const cc = Array.isArray(o.cc) ? o.cc.map((e) => String(e)) : []
      const bcc = Array.isArray(o.bcc) ? o.bcc.map((e) => String(e)) : []
      return { to, cc, bcc }
    }

    if (Array.isArray(parsed)) {
      const typeMap: Record<string, keyof StoredBuckets> = { to: 'to', cc: 'cc', bcc: 'bcc' }
      const legacyItems: { email: string; key: keyof StoredBuckets }[] = []
      for (const item of parsed) {
        if (item === null || typeof item !== 'object') continue
        const email = (item as { email?: unknown }).email
        const rawType = (item as { type?: unknown }).type
        if (typeof email !== 'string') continue
        const key = typeof rawType === 'string' ? (typeMap[rawType.toLowerCase()] ?? 'to') : 'to'
        legacyItems.push({ email: String(email), key })
      }
      const buckets = emptyBuckets()
      for (const { email, key } of legacyItems.slice(0, MAX_RECIPIENTS)) {
        buckets[key].push(email)
      }
      return buckets
    }
    return null
  } catch {
    return null
  }
}

const RECIPIENT_TYPE_CONFIG: Record<RecipientType, { label: string; bgcolor: string; color: string }> = {
  To: { label: '수신', bgcolor: 'gray.20', color: 'contentText.Normal' },
  Cc: { label: '참조', bgcolor: 'gray.60', color: 'commonColor.White' },
  Bcc: { label: '숨은 참조', bgcolor: 'gray.80', color: 'commonColor.White' },
}

const RECIPIENT_TYPE_ITEMS: SelectMenuItem<RecipientType>[] = (
  Object.entries(RECIPIENT_TYPE_CONFIG) as [RecipientType, (typeof RECIPIENT_TYPE_CONFIG)[RecipientType]][]
).map(([value, { label }]) => ({ value, label }))

/** 편집본 메일 발송 — 본문·첨부는 부모에서 생성 (`preparePayload`) */
export interface ShareModalEditionMail {
  newsletterId: number
  issueNo: string
  defaultSubject: string
  preparePayload: () => Promise<{ subject: string; htmlBody: string; images: File[] }>
  /** false면 차트 캡처 등 미준비 — 보내기 비활성 */
  canSend: boolean
}

interface ShareModalProps {
  open: boolean
  onClose: () => void
  shareUrl: string
  onSend?: (recipients: RecipientItem[], saveRecipientList: boolean) => void | Promise<void>
  editionMail?: ShareModalEditionMail | null
}

const ShareModal = ({ open, onClose, shareUrl, onSend, editionMail }: ShareModalProps) => {
  const { showSnackbar } = useSnackbar()
  const [toEmails, setToEmails] = useState<string[]>([])
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const [bccEmails, setBccEmails] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [recipientType, setRecipientType] = useState<RecipientType>('To')
  const [saveRecipientList, setSaveRecipientList] = useState(false)
  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null)
  const [isSendingEditionMail, setIsSendingEditionMail] = useState(false)
  const [mailSubject, setMailSubject] = useState('')
  const mailSubjectInitRef = useRef(false)

  const totalCount = toEmails.length + ccEmails.length + bccEmails.length

  const resetForm = useCallback(() => {
    setToEmails([])
    setCcEmails([])
    setBccEmails([])
    setEmailInput('')
    setRecipientType('To')
    setSaveRecipientList(false)
    setHoveredRowKey(null)
  }, [])

  useEffect(() => {
    if (open) {
      const loaded = loadStoredBuckets()
      if (loaded === null) {
        resetForm()
      } else {
        setToEmails(loaded.to)
        setCcEmails(loaded.cc)
        setBccEmails(loaded.bcc)
        setSaveRecipientList(true)
        setEmailInput('')
        setRecipientType('To')
        setHoveredRowKey(null)
      }
      setIsSendingEditionMail(false)
    }
  }, [open, resetForm])

  useEffect(() => {
    if (!open) {
      mailSubjectInitRef.current = false
      return
    }
    if (!mailSubjectInitRef.current) {
      mailSubjectInitRef.current = true
      setMailSubject(editionMail?.defaultSubject ?? '')
    }
  }, [open, editionMail])

  const isValidEmail = useCallback((value: string) => EMAIL_REGEX.test(value.trim()), [])
  const isDuplicate = useCallback(
    (value: string) => {
      const t = value.trim().toLowerCase()
      return (
        toEmails.some((e) => e.toLowerCase() === t) ||
        ccEmails.some((e) => e.toLowerCase() === t) ||
        bccEmails.some((e) => e.toLowerCase() === t)
      )
    },
    [toEmails, ccEmails, bccEmails],
  )

  const addRecipientEmails = useCallback(
    (values: string[]): string[] => {
      const existingEmails = new Set([...toEmails, ...ccEmails, ...bccEmails].map((email) => email.trim().toLowerCase()))
      const emailsToAdd: string[] = []

      for (const value of values) {
        const email = value.trim()
        const normalizedEmail = email.toLowerCase()
        if (!email || !isValidEmail(email) || existingEmails.has(normalizedEmail) || totalCount + emailsToAdd.length >= MAX_RECIPIENTS) {
          continue
        }
        existingEmails.add(normalizedEmail)
        emailsToAdd.push(email)
      }

      if (emailsToAdd.length === 0) return emailsToAdd

      if (recipientType === 'To') {
        setToEmails((prev) => [...prev, ...emailsToAdd])
      } else if (recipientType === 'Cc') {
        setCcEmails((prev) => [...prev, ...emailsToAdd])
      } else {
        setBccEmails((prev) => [...prev, ...emailsToAdd])
      }

      return emailsToAdd
    },
    [toEmails, ccEmails, bccEmails, totalCount, recipientType, isValidEmail],
  )

  const handleCopyLink = useCallback(async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        showSnackbar('링크가 복사되었습니다.', { variant: 'success' })
      } catch {
        showSnackbar('링크 복사에 실패했습니다.', { variant: 'error' })
      }
    }
  }, [shareUrl, showSnackbar])

  const handleAddEmail = useCallback(() => {
    const enteredEmails = emailInput
      .split(/[;,]/)
      .map((email) => email.trim())
      .filter(Boolean)
    const addedRecipientEmails = addRecipientEmails(enteredEmails)
    if (addedRecipientEmails.length === 0) return

    const addedEmails = new Set(addedRecipientEmails.map((email) => email.toLowerCase()))
    const unprocessedEmails = enteredEmails.filter((email) => !addedEmails.has(email.toLowerCase()))
    setEmailInput(unprocessedEmails.join('; '))

    if (addedRecipientEmails.length === 1) {
      showSnackbar(`${addedRecipientEmails[0]}을 추가하였습니다.`, { variant: 'success' })
    } else {
      showSnackbar(`${addedRecipientEmails[0]} 외 ${addedRecipientEmails.length - 1}건을 추가하였습니다.`, { variant: 'success' })
    }
  }, [emailInput, addRecipientEmails, showSnackbar])

  const handleKeyDownEmail = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddEmail()
      }
    },
    [handleAddEmail],
  )

  const handleDeleteEmail = useCallback((type: RecipientType, index: number) => {
    if (type === 'To') {
      setToEmails((prev) => prev.filter((_, i) => i !== index))
    } else if (type === 'Cc') {
      setCcEmails((prev) => prev.filter((_, i) => i !== index))
    } else {
      setBccEmails((prev) => prev.filter((_, i) => i !== index))
    }
  }, [])

  const handleDeleteAll = useCallback(() => {
    setToEmails([])
    setCcEmails([])
    setBccEmails([])
  }, [])

  const persistRecipientListPreference = useCallback(() => {
    if (saveRecipientList) {
      try {
        const payload: StoredBuckets = { to: toEmails, cc: ccEmails, bcc: bccEmails }
        localStorage.setItem(RECIPIENT_LIST_STORAGE_KEY, JSON.stringify(payload))
      } catch {
        showSnackbar('수신자 목록을 저장하지 못했습니다.', { variant: 'warning' })
      }
    } else {
      localStorage.removeItem(RECIPIENT_LIST_STORAGE_KEY)
    }
  }, [toEmails, ccEmails, bccEmails, saveRecipientList, showSnackbar])

  const handleSend = useCallback(async () => {
    const toTrimmed = toEmails.map((e) => e.trim()).filter(Boolean)
    if (toTrimmed.length === 0) {
      showSnackbar('수신자를 한 명 이상 추가해 주세요.', { variant: 'warning' })
      return
    }

    const ccTrimmed = ccEmails.map((e) => e.trim()).filter(Boolean)
    const bccTrimmed = bccEmails.map((e) => e.trim()).filter(Boolean)

    if (editionMail) {
      if (!editionMail.canSend) {
        showSnackbar('메일 본문을 준비하는 중입니다. 잠시 후 다시 시도해 주세요.', { variant: 'warning' })
        return
      }
      setIsSendingEditionMail(true)
      try {
        const { subject: preparedSubject, htmlBody, images } = await editionMail.preparePayload()
        const subject = mailSubject.trim() || preparedSubject

        await newsletterService.sendEditionMail(editionMail.newsletterId, editionMail.issueNo, {
          subject,
          htmlBody,
          recipientEmails: toTrimmed,
          ...(ccTrimmed.length > 0 ? { ccEmails: ccTrimmed } : {}),
          ...(bccTrimmed.length > 0 ? { bccEmails: bccTrimmed } : {}),
          images,
        })
        persistRecipientListPreference()
        showSnackbar('메일이 발송되었습니다.', { variant: 'success' })
        onClose()
      } catch (e) {
        let msg = '메일 발송에 실패했습니다.'
        if (axios.isAxiosError(e)) {
          const data = e.response?.data as { message?: string } | undefined
          msg = data?.message ?? e.message ?? msg
        } else if (e instanceof Error && e.message) {
          msg = e.message
        }
        showSnackbar(msg, { variant: 'error' })
      } finally {
        setIsSendingEditionMail(false)
      }
      return
    }

    persistRecipientListPreference()
    const flat = flattenRecipientBuckets(toEmails, ccEmails, bccEmails)
    await onSend?.(flat, saveRecipientList)
    onClose()
  }, [
    editionMail,
    mailSubject,
    toEmails,
    ccEmails,
    bccEmails,
    persistRecipientListPreference,
    onSend,
    saveRecipientList,
    onClose,
    showSnackbar,
  ])

  const canAdd =
    emailInput
      .split(/[;,]/)
      .map((email) => email.trim())
      .some((email) => isValidEmail(email) && !isDuplicate(email)) && totalCount < MAX_RECIPIENTS

  const isDuplicateError = emailInput.trim() !== '' && isValidEmail(emailInput.trim()) && isDuplicate(emailInput.trim())

  const hasToRecipient = useMemo(() => toEmails.some((e) => e.trim().length > 0), [toEmails])

  const canSubmitSend = hasToRecipient

  const displayRows = useMemo(() => {
    const rows: { type: RecipientType; index: number; email: string }[] = []
    toEmails.forEach((email, index) => rows.push({ type: 'To', index, email }))
    ccEmails.forEach((email, index) => rows.push({ type: 'Cc', index, email }))
    bccEmails.forEach((email, index) => rows.push({ type: 'Bcc', index, email }))
    return rows
  }, [toEmails, ccEmails, bccEmails])

  return (
    <MIConfirm
      open={open}
      title="공유하기"
      width={620}
      handleClose={onClose}
      disableBackdropClick
      hideFooter
      titleSx={{
        padding: '12px 24px',
        borderBottom: '1px solid',
        borderColor: 'contentBorder.Normal',
      }}
      contentSx={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack flex={1} overflow="hidden">
        <Stack gap="12px" padding="24px" borderBottom="1px solid" borderColor="contentBorder.Normal" flexShrink={0}>
          <Stack direction="row" gap="8px">
            <Box flex={1} minWidth={0}>
              <MIMaskInput value={shareUrl} readOnly disabled />
            </Box>
            <MIBaseButton
              variant="outlined"
              onClick={handleCopyLink}
              prefix={<LinkRoundedIcon sx={{ fontSize: 20, color: 'gray.70' }} />}
              style={{ height: 36, flexShrink: 0 }}
            >
              <Typography variant="body2SB14" color="contentText.Normal">
                링크복사
              </Typography>
            </MIBaseButton>
          </Stack>
        </Stack>

        <Stack gap="12px" padding="24px" flex={1} minHeight={0} overflow="hidden">
          {editionMail && (
            <Stack gap="4px" flexShrink={0}>
              <Typography variant="subtext2" color="contentText.Normal">
                메일 제목
              </Typography>
              <MIMaskInput
                multiline
                minRows={1}
                maxRows={2}
                value={mailSubject}
                onUpdateValue={(v) => setMailSubject(v ?? '')}
                placeholder="메일 제목을 입력하세요"
                sx={{
                  '& .MuiInputBase-root': {
                    alignItems: 'flex-start',
                    py: '8px',
                  },
                }}
              />
            </Stack>
          )}

          <Stack>
            <Typography variant="subtext2" color="contentText.Normal">
              수신자 입력
            </Typography>
            <Stack direction="row" gap="4px" alignItems="stretch" py="8px">
              <Stack
                direction="row"
                border="1px solid"
                borderColor={isDuplicateError ? 'error.main' : 'contentBorder.Normal'}
                borderRadius="8px"
                overflow="hidden"
                flex={1}
              >
                <MISelectMenu<RecipientType>
                  variant="text"
                  selected={recipientType}
                  onSelected={setRecipientType}
                  items={RECIPIENT_TYPE_ITEMS}
                  buttonHoverBgColor="transparent"
                  disableRipple
                  zIndex={1400}
                  sx={{ minHeight: 40, alignSelf: 'stretch', flexShrink: 0 }}
                />
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    borderColor: isDuplicateError ? 'error.main' : 'contentBorder.Normal',
                  }}
                />
                <MIMaskInput
                  embedded
                  value={emailInput}
                  onUpdateValue={(value) => setEmailInput(value ?? '')}
                  slotProps={{ input: { onKeyDown: handleKeyDownEmail } }}
                  placeholder="이메일 입력 (; 또는 ,로 구분)"
                  error={isDuplicateError}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    alignSelf: 'stretch',
                    '& .MuiInputBase-root': {
                      border: 'none',
                      height: '100%',
                      '& fieldset': { border: 'none' },
                    },
                  }}
                />
              </Stack>
              <MIBaseButton
                variant="outlined"
                onClick={handleAddEmail}
                disabled={!canAdd}
                sx={{
                  height: 40,
                  width: 40,
                  minWidth: 40,
                  px: '8px',
                  borderRadius: '10px',
                  flexShrink: 0,
                  bgcolor: canAdd ? 'commonColor.White' : 'contentBG.Disabled',
                  borderColor: canAdd ? 'contentBorder.Normal' : 'contentBorder.Disabled',
                }}
                buttonHoverBgColor={canAdd ? 'commonColor.White' : undefined}
              >
                <AddIcon sx={{ fontSize: 20, color: canAdd ? 'gray.70' : 'contentText.Disabled' }} />
              </MIBaseButton>
            </Stack>
            {isDuplicateError && (
              <Typography variant="subtext2" color="error.main">
                이미 추가된 이메일입니다.
              </Typography>
            )}
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" py="4px">
            <Stack direction="row" alignItems="center" gap="4px" flexWrap="wrap">
              <Typography variant="subtext3" color="contentText.Normal" component="span">
                {totalCount}명
              </Typography>
              <Typography variant="subtext2" color="contentText.Normal" component="span">
                (최대 {MAX_RECIPIENTS}명)
              </Typography>
              {!hasToRecipient && (
                <Typography variant="subtext3" color="error.main" component="span">
                  · 1명 이상의 수신자가 필요합니다
                </Typography>
              )}
            </Stack>
            <MIBaseButton
              variant="outlined"
              onClick={handleDeleteAll}
              disabled={totalCount === 0}
              sx={{
                height: '25px',
                padding: '4px 6px',
                borderRadius: '4px',
              }}
            >
              <Typography variant="subtext3">전체 삭제</Typography>
            </MIBaseButton>
          </Stack>

          <Box
            flex={1}
            minHeight="180px"
            maxHeight="180px"
            pr="12px"
            sx={{
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'gray.40',
                borderRadius: '1000px',
              },
            }}
          >
            <List disablePadding style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {displayRows.map(({ type, index, email }) => {
                const rowKey = `${type}-${index}`
                return (
                  <ListItem
                    key={rowKey}
                    disablePadding
                    sx={{
                      height: 36,
                      borderRadius: '4px',
                      bgcolor: hoveredRowKey === rowKey ? 'contentBG.Hover' : 'transparent',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                    onMouseEnter={() => setHoveredRowKey(rowKey)}
                    onMouseLeave={() => setHoveredRowKey(null)}
                  >
                    <Stack direction="row" alignItems="center" gap="8px" flex={1} minWidth={0}>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bgcolor={RECIPIENT_TYPE_CONFIG[type].bgcolor}
                        borderRadius="12px"
                        padding="2px 6px"
                        style={{ userSelect: 'none' }}
                      >
                        <Typography fontSize={11} fontWeight={500} color={RECIPIENT_TYPE_CONFIG[type].color}>
                          {RECIPIENT_TYPE_CONFIG[type].label}
                        </Typography>
                      </Box>
                      <Typography variant="body2R14" color="contentText.Normal" noWrap flex={1} overflow="hidden">
                        {email}
                      </Typography>
                    </Stack>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteEmail(type, index)}
                      sx={{
                        padding: '4px',
                        opacity: hoveredRowKey === rowKey ? 1 : 0,
                        '&:hover': { bgcolor: 'contentBG.Active' },
                      }}
                    >
                      <DeleteRoundedIcon sx={{ fontSize: 16, color: 'contentText.Normal' }} />
                    </IconButton>
                  </ListItem>
                )
              })}
            </List>
          </Box>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          padding="20px 24px"
          borderTop="1px solid"
          borderColor="contentBorder.Normal"
          flexShrink={0}
        >
          <Stack direction="row" alignItems="center" gap="8px">
            <Switch checked={saveRecipientList} onChange={(_, v) => setSaveRecipientList(v)} size="small" />
            <Typography variant="body2M14" color="contentText.Normal">
              수신자 목록 저장
            </Typography>
          </Stack>
          <Stack direction="row" gap="10px" alignItems="center">
            <MIBaseButton variant="outlined" onClick={onClose} sx={{ height: 34, borderRadius: '4px' }}>
              취소
            </MIBaseButton>
            <Stack direction="row" bgcolor="primary.main" borderRadius="4px" overflow="hidden" height={34}>
              <MIBaseButton
                variant="contained"
                color="primary"
                onClick={() => void handleSend()}
                disabled={!canSubmitSend}
                isLoading={isSendingEditionMail}
                sx={{ height: 34, borderRadius: 0, px: '16px', py: '7px', minWidth: 0 }}
                buttonHoverBgColor="primary.main"
              >
                보내기
              </MIBaseButton>
              {/* <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.3)' }} />
              <MIDropdownMenu
                variant="text"
                label={<KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />}
                items={sendOptionItems}
                placement="bottom-end"
                buttonHoverBgColor="rgba(255,255,255,0.1)"
                disableRipple
                zIndex={1400}
                sx={{
                  height: 34,
                  minWidth: 34,
                  borderRadius: 0,
                  px: '8px',
                  color: 'commonColor.White',
                  '& .MuiSvgIcon-root': { color: 'commonColor.White' },
                }}
                aria-label="보내기 옵션"
              /> */}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </MIConfirm>
  )
}

export default ShareModal
