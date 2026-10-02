import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Dialog, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import KeywordAlertEmailTemplate from '@/pages/mi/nextGenMI/components/event/KeywordAlertEmailTemplate'
import {
  buildKeywordAlertEmailSubject,
  getKeywordAlertDetailPath,
  type KeywordAlertHistoryItem,
} from '@/pages/mi/nextGenMI/utils/keywordAlertStore'

interface KeywordAlertEmailPreviewDialogProps {
  item: KeywordAlertHistoryItem | null
  onClose: () => void
}

const KeywordAlertEmailPreviewDialog = ({ item, onClose }: KeywordAlertEmailPreviewDialogProps) => {
  const navigate = useNavigate()
  const detailPath = item ? getKeywordAlertDetailPath(item.eventId) : ''

  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: '648px',
            maxWidth: 'calc(100vw - 48px)',
            borderRadius: '12px',
            margin: 0,
          },
        },
      }}
    >
      {item ? (
        <Stack padding="20px" gap="16px" alignItems="center">
          <Stack direction="row" alignItems="flex-start" gap="12px" width="100%">
            <Typography flex={1} color="contentText.Normal" variant="body2SB14" sx={{ wordBreak: 'break-all' }}>
              {buildKeywordAlertEmailSubject(item.keyword)}
            </Typography>
            <MIBaseButton
              aria-label="닫기"
              variant="text"
              onClick={onClose}
              sx={{ height: '32px', width: '32px', minWidth: '32px', padding: '6px' }}
            >
              <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
            </MIBaseButton>
          </Stack>
          <KeywordAlertEmailTemplate
            item={item}
            detailHref={detailPath}
            onDetailClick={() => {
              onClose()
              navigate(detailPath)
            }}
          />
        </Stack>
      ) : null}
    </Dialog>
  )
}

export default KeywordAlertEmailPreviewDialog
