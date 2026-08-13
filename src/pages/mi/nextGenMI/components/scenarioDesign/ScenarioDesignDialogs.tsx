import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Dialog, DialogActions, DialogContent, Stack, Typography } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'

export type ScenarioDesignConfirmDialogContent = {
  title: string
  description?: string
  confirmLabel: string
  confirmBgColor: string
}

/** 도출 근거 팝업 섹션 (노출 형식 미정 - UI 틀용) */
export type ScenarioDesignRationaleBlock = {
  heading?: string
  paragraphs?: string[]
  bullets?: string[]
}

export type ScenarioDesignRationaleSection = {
  title: string
  blocks: ScenarioDesignRationaleBlock[]
}

const ScenarioDesignRationaleCard = ({ section }: { section: ScenarioDesignRationaleSection }) => (
  <Stack width="100%" padding="8px" borderRadius="10px" bgcolor="gray.5" boxSizing="border-box">
    <Stack width="100%" padding="8px" gap="0px" boxSizing="border-box">
      <Typography fontSize="13px" fontWeight={600} color="contentText.Normal" lineHeight={1.6}>
        {section.title}
      </Typography>
      <Stack gap="0px" width="100%">
        {section.blocks.map((block, blockIndex) => (
          <Stack key={`${section.title}-${blockIndex}`} width="100%">
            {block.heading ? (
              <Typography fontSize="15px" fontWeight={500} color="contentText.Black" lineHeight={1.6} whiteSpace="pre-wrap">
                {block.heading}
              </Typography>
            ) : null}
            {block.paragraphs?.map((paragraph, paragraphIndex) => (
              <Typography
                key={`${section.title}-${blockIndex}-p-${paragraphIndex}`}
                fontSize="15px"
                fontWeight={500}
                color="contentText.Black"
                lineHeight={1.6}
                whiteSpace="pre-wrap"
              >
                {paragraph}
              </Typography>
            ))}
            {block.bullets && block.bullets.length > 0 ? (
              <Stack
                component="ul"
                margin={0}
                padding="0 0 0 22px"
                sx={{
                  listStyleType: 'disc',
                  listStylePosition: 'outside',
                }}
              >
                {block.bullets.map((bullet, bulletIndex) => (
                  <Typography
                    key={`${section.title}-${blockIndex}-b-${bulletIndex}`}
                    component="li"
                    fontSize="15px"
                    fontWeight={500}
                    color="contentText.Black"
                    lineHeight={1.6}
                    sx={{ display: 'list-item' }}
                  >
                    {bullet}
                  </Typography>
                ))}
              </Stack>
            ) : null}
          </Stack>
        ))}
      </Stack>
    </Stack>
  </Stack>
)

export const ScenarioDesignRationaleDialog = ({
  open,
  sections,
  fallbackText,
  onClose,
}: {
  open: boolean
  sections?: ScenarioDesignRationaleSection[]
  fallbackText?: string
  onClose: () => void
}) => {
  const resolvedSections =
    sections && sections.length > 0
      ? sections
      : fallbackText?.trim()
        ? [
          {
            title: '설계 근거',
            blocks: [{ paragraphs: [fallbackText.trim()] }],
          },
        ]
        : []

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        paper: {
          sx: {
            width: '800px',
            maxWidth: 'calc(100vw - 88px)',
            border: '1px solid',
            borderColor: 'contentBorder.Normal',
            borderRadius: '10px',
            boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
            margin: 0,
            overflow: 'hidden',
          },
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" padding="12px 20px" width="100%" minWidth={0}>
        <Stack direction="row" alignItems="center" gap="6px" minWidth={0} flex={1}>
          <Typography component="span" fontSize="18px" fontWeight={600} color="contentText.Black" lineHeight={1.4} noWrap>
            도출 근거
          </Typography>
          <Typography component="span" fontSize="14px" fontWeight={400} color="contentText.Error" lineHeight={1.4} noWrap>
            *노출 형식은 미정입니다.
          </Typography>
        </Stack>
        <MIBaseButton
          aria-label="닫기"
          variant="text"
          onClick={onClose}
          sx={{
            width: '36px',
            minWidth: '36px',
            height: '36px',
            padding: '8px',
            borderRadius: '8px',
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
        </MIBaseButton>
      </Stack>

      <Stack width="100%" gap="20px">
        <Stack width="100%" gap="12px" padding="0 24px" boxSizing="border-box">
          {resolvedSections.length > 0 ? (
            resolvedSections.map((section) => <ScenarioDesignRationaleCard key={section.title} section={section} />)
          ) : (
            <ScenarioDesignRationaleCard
              section={{
                title: '설계 근거',
                blocks: [{ paragraphs: ['설계 근거가 없습니다.'] }],
              }}
            />
          )}
        </Stack>
      </Stack>

      <DialogActions
        disableSpacing
        sx={{
          padding: '20px',
          justifyContent: 'flex-end',
        }}
      >
        <MIBaseButton
          variant="contained"
          onClick={onClose}
          labelColor="contentText.White"
          sx={{
            height: '36px',
            padding: '8px 10px',
            borderRadius: '8px',
            backgroundColor: 'contentIcon.ActivePrimary',
            '&:hover:not(:disabled)': {
              backgroundColor: 'contentIcon.ActivePrimary',
            },
            '& .MuiTypography-root': {
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: 1.4,
            },
          }}
        >
          확인
        </MIBaseButton>
      </DialogActions>
    </Dialog>
  )
}

export const ScenarioDesignConfirmDialog = ({
  open,
  content,
  onClose,
  onConfirm,
}: {
  open: boolean
  content: ScenarioDesignConfirmDialogContent | null
  onClose: () => void
  onConfirm: () => void
}) => {
  if (!content) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: '450px',
            maxWidth: 'calc(100vw - 48px)',
            border: '1px solid',
            borderColor: 'contentBorder.Normal',
            borderRadius: '12px',
            boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
            margin: 0,
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: content.description ? '20px' : 0,
          padding: '20px 20px 30px',
          '&:last-of-type': {
            paddingBottom: '30px',
          },
        }}
      >
        <Stack direction="row" alignItems="center" width="100%" minWidth={0}>
          <Typography variant="body1" fontSize="16px" fontWeight={700} color="contentText.Normal" lineHeight={1.4} flex={1} noWrap>
            {content.title}
          </Typography>
          <MIBaseButton
            aria-label="닫기"
            variant="text"
            onClick={onClose}
            sx={{
              height: '32px',
              padding: '6px',
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
          </MIBaseButton>
        </Stack>
        {content.description && (
          <Typography variant="body2R14" color="contentText.Normal" lineHeight={1.4}>
            {content.description}
          </Typography>
        )}
      </DialogContent>
      <DialogActions
        disableSpacing
        sx={{
          padding: '30px 20px 20px',
          gap: '10px',
        }}
      >
        <MIBaseButton
          variant="outlined"
          onClick={onClose}
          sx={{
            height: '34px',
            borderRadius: '4px',
          }}
        >
          취소
        </MIBaseButton>
        <MIBaseButton
          variant="contained"
          onClick={onConfirm}
          labelColor="contentText.White"
          sx={{
            height: '34px',
            borderRadius: '4px',
            backgroundColor: content.confirmBgColor,
            '&:hover:not(:disabled)': {
              backgroundColor: content.confirmBgColor,
            },
          }}
        >
          {content.confirmLabel}
        </MIBaseButton>
      </DialogActions>
    </Dialog>
  )
}

export const ScenarioDesignReviewFailedDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog
    open={open}
    onClose={onClose}
    slotProps={{
      paper: {
        sx: {
          width: '450px',
          maxWidth: 'calc(100vw - 48px)',
          border: '1px solid',
          borderColor: 'contentBorder.Normal',
          borderRadius: '12px',
          boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
          margin: 0,
          overflow: 'hidden',
        },
      },
    }}
  >
    <DialogContent
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '20px',
        padding: '20px 20px 0px',
      }}
    >
      <Stack direction="row" alignItems="center" width="100%" minWidth={0}>
        <Typography variant="body1" fontSize="16px" fontWeight={700} color="contentText.Normal" lineHeight={1.4} flex={1} noWrap>
          수정이 필요한 항목이 있습니다
        </Typography>
        <MIBaseButton
          aria-label="닫기"
          variant="text"
          onClick={onClose}
          sx={{
            height: '32px',
            padding: '6px',
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: '20px', color: 'contentIcon.Enabled' }} />
        </MIBaseButton>
      </Stack>
      <Typography variant="body2R14" color="contentText.Normal" lineHeight={1.4}>
        검토 기준을 충족하지 않는 항목이 발견되었습니다. 테이블 하단의 안내를 확인한 후 값을 수정해 주세요.
      </Typography>
    </DialogContent>
    <DialogActions
      disableSpacing
      sx={{
        padding: '30px 20px 20px',
        gap: '10px',
        justifyContent: 'flex-end',
      }}
    >
      <MIBaseButton
        variant="contained"
        onClick={onClose}
        labelColor="contentText.White"
        sx={{
          height: '34px',
          padding: '7px 16px',
          borderRadius: '4px',
          backgroundColor: 'contentIcon.ActivePrimary',
          '&:hover:not(:disabled)': {
            backgroundColor: 'contentIcon.ActivePrimary',
          },
        }}
      >
        확인
      </MIBaseButton>
    </DialogActions>
  </Dialog>
)
