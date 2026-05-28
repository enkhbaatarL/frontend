import LogoutIcon from '@mui/icons-material/Logout'
import PreviewRoundedIcon from '@mui/icons-material/PreviewRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import { Box, Divider, Stack, Typography } from '@mui/material'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import RefreshIcon from '@/components/common/icons/RefreshIcon'

export type EditToolbarProps = {
  onReset?: () => void
  onPreview?: () => void
  isPreviewDisabled?: boolean
  isPreviewLoading?: boolean
  /** false면 차트(변곡점 편집 모달 진입) 버튼 미표시 */
  showChartButton?: boolean
  onChart?: (anchorEl: HTMLElement) => void
  onEndEdit?: () => void
  onSaveDraft?: () => void
  onSave?: () => void
  isSaving?: boolean
  isSavingDraft?: boolean
  /** true면 최종 저장 버튼 비활성(변경 없음 등) */
  isSaveDisabled?: boolean
  /** 저장 비활성화 원인 디버깅 정보 */
  saveDisabledDebugInfo?: {
    hasUnsavedChanges: boolean
    isEditSnapshotValid: boolean
    validationIssues?: Array<{
      kind: 'MISSING_REQUIRED' | 'INVALID_FORMAT'
      path: string
      message: string
    }>
  }
  isChartActive?: boolean
}

const EditToolbar = ({
  onReset,
  onPreview,
  isPreviewDisabled = false,
  isPreviewLoading = false,
  showChartButton = true,
  onChart,
  onEndEdit,
  onSaveDraft,
  onSave,
  isSaving = false,
  isSavingDraft = false,
  isSaveDisabled = false,
  saveDisabledDebugInfo,
  isChartActive = false,
}: EditToolbarProps) => (
  <>
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
      py="4px"
      bgcolor="commonColor.Black"
      sx={{ transition: 'background-color 0.25s ease' }}
    >
      <Stack direction="row" justifyContent="center" alignItems="center" gap="8px" width="800px" style={{ userSelect: 'none' }}>
        <Typography variant="body1" color="contentText.White">
          Edit Mode
        </Typography>
      </Stack>
    </Box>

    <Stack paddingTop="8px" paddingBottom="8px" bgcolor="gray.40" sx={{ transition: 'background-color 0.25s ease' }}>
      <Stack width="800px" margin="0 auto" direction="row" justifyContent="space-between" alignItems="center" boxSizing="border-box">
        <Stack direction="row" alignItems="center" gap="10px">
          <MIBaseButton
            variant="outlined"
            onClick={onReset}
            sx={{
              height: '36px',
              backgroundColor: 'commonColor.White',
            }}
            buttonHoverBgColor="commonColor.White"
          >
            <Stack direction="row" alignItems="center" gap="6px" color="contentText.Normal">
              <RefreshIcon style={{ width: 20, height: 20 }} />
              <Typography variant="body2SB14" color="contentText.Normal" noWrap>
                초기화
              </Typography>
            </Stack>
          </MIBaseButton>
          <Divider orientation="vertical" flexItem sx={{ height: '20px', alignSelf: 'center', borderColor: 'contentBorder.Active' }} />
          <Stack direction="row" alignItems="center" gap="10px">
            <MIBaseButton
              variant="outlined"
              onClick={onPreview}
              disabled={isPreviewDisabled}
              isLoading={isPreviewLoading}
              sx={{
                height: '36px',
                backgroundColor: 'commonColor.White',
              }}
              buttonHoverBgColor="commonColor.White"
            >
              <Stack direction="row" alignItems="center" gap="6px" color="contentText.Normal">
                <PreviewRoundedIcon width={20} height={20} />
                <Typography variant="body2SB14" color="contentText.Normal" noWrap>
                  미리보기
                </Typography>
              </Stack>
            </MIBaseButton>
            {showChartButton ? (
              <MIBaseButton
                variant="outlined"
                onClick={(e) => onChart?.(e.currentTarget as HTMLElement)}
                sx={{
                  height: '36px',
                  backgroundColor: isChartActive ? 'contentBG.Active' : 'commonColor.White',
                  borderColor: isChartActive ? 'contentBorder.Active' : 'contentBorder.Normal',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease',
                }}
                buttonHoverBgColor={isChartActive ? 'contentBG.Active' : 'commonColor.White'}
              >
                <Stack direction="row" alignItems="center" gap="6px" color="contentText.Normal">
                  <TimelineRoundedIcon sx={{ fontSize: '20px' }} />
                  <Typography variant="body2SB14" color="contentText.Normal" noWrap>
                    차트
                  </Typography>
                </Stack>
              </MIBaseButton>
            ) : null}
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" gap="10px">
          <MIBaseButton
            variant="outlined"
            onClick={onEndEdit}
            sx={{
              height: '36px',
              backgroundColor: 'commonColor.White',
            }}
            buttonHoverBgColor="commonColor.White"
          >
            <Stack direction="row" alignItems="center" gap="6px" color="contentText.Normal">
              <LogoutIcon sx={{ fontSize: '20px' }} />
              <Typography variant="body2SB14" color="contentText.Normal" noWrap>
                편집종료
              </Typography>
            </Stack>
          </MIBaseButton>
          <Divider orientation="vertical" flexItem sx={{ height: '20px', alignSelf: 'center', borderColor: 'contentBorder.Active' }} />
          <Stack direction="row" alignItems="center" gap="10px">
            <MIBaseButton
              variant="outlined"
              onClick={onSaveDraft}
              disabled={isSavingDraft || isSaving}
              isLoading={isSavingDraft}
              sx={{
                height: '36px',
                backgroundColor: 'commonColor.White',
              }}
              buttonHoverBgColor="commonColor.White"
            >
              <Typography variant="body2SB14" color="contentText.Normal" noWrap>
                임시저장
              </Typography>
            </MIBaseButton>
            <Box
              display="inline-flex"
              onContextMenu={() => {
                const disabled = isSaving || isSaveDisabled
                if (!disabled) return
                const hasUnsavedChanges = saveDisabledDebugInfo?.hasUnsavedChanges
                const isEditSnapshotValid = saveDisabledDebugInfo?.isEditSnapshotValid
                const validationIssues = saveDisabledDebugInfo?.validationIssues
                console.info('[Newsletter] 저장 버튼 비활성화 상태 우클릭', {
                  isSaving,
                  isSaveDisabled,
                  reasons: {
                    isSaving,
                    hasNoUnsavedChanges: hasUnsavedChanges === undefined ? undefined : !hasUnsavedChanges,
                    invalidEditSnapshot: isEditSnapshotValid === undefined ? undefined : !isEditSnapshotValid,
                  },
                  validationIssues,
                  debug: saveDisabledDebugInfo,
                })
              }}
            >
              <MIBaseButton
                variant="contained"
                onClick={onSave}
                disabled={isSaving || isSaveDisabled}
                sx={{
                  height: '36px',
                  backgroundColor: 'contentIcon.ActivePrimary',
                }}
                buttonHoverBgColor="contentIcon.ActivePrimary"
              >
                <Typography variant="body2SB14" color={isSaving || isSaveDisabled ? 'contentText.Disabled' : 'contentIcon.Activew'} noWrap>
                  {isSaving ? '저장 중...' : '저장'}
                </Typography>
              </MIBaseButton>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  </>
)

export default EditToolbar
