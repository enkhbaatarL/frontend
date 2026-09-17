import { Stack, Typography } from '@mui/material'
import { type Theme } from '@mui/material/styles'
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'

import type { ScenarioModelExecutionOption } from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionPopupContent'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import CollapseIcon from '@/components/common/icons/agent/CollapseIcon'
import ExpandIcon from '@/components/common/icons/agent/ExpandIcon'
import ScenarioModelExecutionProposalList from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionProposalList'

export interface ScenarioModelExecutionPopupRef {
  open: () => void
  openFor: (scenarioId: number) => void
}

interface ScenarioModelExecutionPopupProps {
  scenarioGroupId: number
  scenarioOptions: ScenarioModelExecutionOption[]
  executingScenarioIds: Set<number>
  onAccepted: (scenarioId: number) => void
  onCompleted: (scenarioId: number) => void
}

const ScenarioModelExecutionPopup = forwardRef<ScenarioModelExecutionPopupRef, ScenarioModelExecutionPopupProps>(
  ({ scenarioGroupId, scenarioOptions, executingScenarioIds, onAccepted, onCompleted }, ref) => {
    const [open, setOpen] = useState(false)
    const [isMaximized, setIsMaximized] = useState(false)
    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
    // 파라미터 패널(03+)일 때만 팝업을 뷰포트 높이로 채움. 생성 중(02)은 피그마처럼 콘텐츠 높이(400px 로딩 포함)에 맞춤
    const [fillsViewportHeight, setFillsViewportHeight] = useState(false)

    const closePopup = useCallback(() => {
      setOpen(false)
      setIsMaximized(false)
      setCloseConfirmOpen(false)
      setFillsViewportHeight(false)
    }, [])

    const handleCloseRequest = useCallback(() => {
      setCloseConfirmOpen(true)
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          setIsMaximized(false)
          setCloseConfirmOpen(false)
          setFillsViewportHeight(false)
          setOpen(true)
        },
        openFor: () => {
          setIsMaximized(false)
          setCloseConfirmOpen(false)
          setFillsViewportHeight(false)
          setOpen(true)
        },
      }),
      [],
    )

    const paperHeight = isMaximized || fillsViewportHeight ? (isMaximized ? 'calc(100dvh - 32px)' : 'calc(100dvh - 96px)') : 'auto'
    const paperMaxHeight = isMaximized ? 'calc(100dvh - 32px)' : 'calc(100dvh - 96px)'

    return (
      <>
        <MIConfirm
          open={open}
          title={
            <Stack component="span" direction="row" alignItems="center" justifyContent="space-between" width="100%" minWidth={0}>
              <Typography component="span" fontSize="18px" fontWeight={600} lineHeight={1.4} color="contentText.Black">
                MI 수급모델 실행
              </Typography>
              <MIBaseButton
                variant="text"
                title={isMaximized ? '기본 크기로 보기' : '최대화'}
                aria-label={isMaximized ? '기본 크기로 보기' : '최대화'}
                aria-pressed={isMaximized}
                aria-haspopup={false}
                onClick={() => setIsMaximized((maximized) => !maximized)}
                disableRipple
                buttonHoverBgColor="contentBG.Hover"
                sx={{
                  flexShrink: 0,
                  width: '36px',
                  minWidth: '36px',
                  height: '36px',
                  padding: '8px',
                  borderRadius: '8px',
                  color: 'contentIcon.Enabled',
                }}
              >
                {isMaximized ? <CollapseIcon width={16} height={16} /> : <ExpandIcon width={24} height={24} />}
              </MIBaseButton>
            </Stack>
          }
          handleClose={handleCloseRequest}
          width={1200}
          hideFooter
          paperSx={{
            border: '1px solid',
            borderColor: 'contentBorder.Normal',
            borderRadius: '10px',
            boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
            width: isMaximized ? 'calc(100dvw - 32px)' : '1200px',
            maxWidth: 'calc(100dvw - 32px)',
            height: paperHeight,
            maxHeight: paperMaxHeight,
            margin: isMaximized ? '16px' : '48px 16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            interpolateSize: 'allow-keywords',
            transition: (theme: Theme) =>
              theme.transitions.create(['width', 'height', 'max-width', 'max-height', 'margin'], {
                duration: 400,
                easing: theme.transitions.easing.easeInOut,
              }),
          }}
          titleSx={{
            height: '60px',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            fontSize: '18px',
            color: 'contentText.Black',
            '& > span:first-of-type': {
              display: 'flex',
              flex: '1 1 auto',
              minWidth: 0,
              fontWeight: '600 !important',
            },
            '& > span:last-of-type button': {
              width: '36px',
              height: '36px',
              padding: '8px',
            },
          }}
          contentSx={{
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: fillsViewportHeight || isMaximized ? '1 1 auto' : '0 0 auto',
            minHeight: fillsViewportHeight || isMaximized ? 0 : undefined,
            '& .MuiDialogContentText-root': {
              display: 'flex',
              flexDirection: 'column',
              flex: fillsViewportHeight || isMaximized ? '1 1 auto' : '0 0 auto',
              minHeight: fillsViewportHeight || isMaximized ? 0 : undefined,
            },
          }}
        >
          {open && (
            <ScenarioModelExecutionProposalList
              scenarioGroupId={scenarioGroupId}
              scenarioOptions={scenarioOptions}
              executingScenarioIds={executingScenarioIds}
              fillsViewportHeight={fillsViewportHeight || isMaximized}
              onFillsViewportHeightChange={setFillsViewportHeight}
              onCancel={closePopup}
              onAccepted={onAccepted}
              onCompleted={onCompleted}
            />
          )}
        </MIConfirm>

        <MIConfirm
          open={closeConfirmOpen}
          title="MI 수급모델 진행을 종료하시겠습니까?"
          width={450}
          handleClose={() => setCloseConfirmOpen(false)}
          zIndex={1400}
          actions={[
            { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setCloseConfirmOpen(false) },
            { label: '종료', color: 'red', onClick: closePopup },
          ]}
        >
          현재 생성된 파라미터 제안을 닫습니다.
        </MIConfirm>
      </>
    )
  },
)

ScenarioModelExecutionPopup.displayName = 'ScenarioModelExecutionPopup'

export default ScenarioModelExecutionPopup
