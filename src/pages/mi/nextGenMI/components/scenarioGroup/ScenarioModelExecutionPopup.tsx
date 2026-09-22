import { Stack, Typography } from '@mui/material'
import { type Theme } from '@mui/material/styles'
import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import CollapseIcon from '@/components/common/icons/agent/CollapseIcon'
import ExpandIcon from '@/components/common/icons/agent/ExpandIcon'
import ScenarioModelExecutionProposalList from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionProposalList'

export interface ScenarioModelExecutionPopupRef {
  open: () => void
  openFor: (scenarioId: number) => void
}

export interface ScenarioModelExecutionPopupProps {
  scenarioGroupId: number
  executingScenarioIds: Set<number>
  executedScenarioIds: Set<number>
  onAccepted: (scenarioId: number) => void
  onCompleted: (scenarioId: number) => void
  onFailed: (scenarioId: number) => void
  /** 팝업 오픈 시 run-status 동기화 */
  onOpen?: () => void | Promise<void>
  /** 팝업 종료 시 graph/run-status 동기화 */
  onClose?: () => void
}

const ScenarioModelExecutionPopup = forwardRef<ScenarioModelExecutionPopupRef, ScenarioModelExecutionPopupProps>(
  ({ scenarioGroupId, executingScenarioIds, executedScenarioIds, onAccepted, onCompleted, onFailed, onOpen, onClose }, ref) => {
    const [open, setOpen] = useState(false)
    const [isMaximized, setIsMaximized] = useState(false)
    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
    // 파라미터 패널(03+)일 때만 팝업을 뷰포트 높이로 채움. 생성 중(02)은 피그마처럼 콘텐츠 높이(400px 로딩 포함)에 맞춤
    const [fillsViewportHeight, setFillsViewportHeight] = useState(false)
    const [contentHeight, setContentHeight] = useState<number | null>(null)
    const [isResizing, setIsResizing] = useState(false)
    const titleRef = useRef<HTMLSpanElement>(null)

    const openPopup = useCallback(() => {
      setIsMaximized(false)
      setCloseConfirmOpen(false)
      setFillsViewportHeight(false)
      setContentHeight(null)
      setOpen(true)
      void onOpen?.()
    }, [onOpen])

    const closePopup = useCallback(() => {
      setOpen(false)
      setCloseConfirmOpen(false)
      onClose?.()
    }, [onClose])

    const handleCloseRequest = useCallback(() => {
      setCloseConfirmOpen(true)
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        open: openPopup,
        openFor: openPopup,
      }),
      [openPopup],
    )

    // auto 높이의 내용 교체는 CSS transition으로 보간되지 않으므로 실측 높이를 사용한다.
    const paperHeight = isMaximized
      ? 'calc(100dvh - 32px)'
      : fillsViewportHeight
        ? 'calc(100dvh - 96px)'
        : contentHeight === null
          ? 'auto'
          : `min(${contentHeight + 62}px, calc(100dvh - 96px))` // 제목 60px + 상하 테두리 2px
    const paperMaxHeight = isMaximized ? 'calc(100dvh - 32px)' : 'calc(100dvh - 96px)'

    useLayoutEffect(() => {
      const paper = titleRef.current?.closest('.MuiDialog-paper')
      if (!open || !paper) return undefined

      // 전환 시작 전에 스크롤바를 숨기고 실제 크기 전환이 모두 끝난 뒤 복원한다.
      // 높이가 뷰포트에 제한되거나 모션 감소 설정으로 전환이 없으면 다음 프레임에 복원한다.
      let active = true
      setIsResizing(true)
      const frameId = globalThis.requestAnimationFrame(() => {
        const transitions = paper
          .getAnimations()
          .filter(
            (animation) =>
              animation instanceof CSSTransition &&
              ['width', 'height', 'max-width', 'max-height', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left'].includes(
                animation.transitionProperty,
              ),
          )
        void Promise.allSettled(transitions.map((transition) => transition.finished)).then(() => {
          if (active) setIsResizing(false)
        })
      })

      return () => {
        active = false
        globalThis.cancelAnimationFrame(frameId)
      }
    }, [isMaximized, open, paperHeight])

    return (
      <>
        <MIConfirm
          open={open}
          title={
            <Stack
              ref={titleRef}
              component="span"
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              width="100%"
              minWidth={0}
            >
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
            transition: (theme: Theme) =>
              theme.transitions.create(['width', 'height', 'max-width', 'max-height', 'margin'], {
                duration: 320,
                easing: theme.transitions.easing.easeInOut,
              }),
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
          titleSx={{
            height: '60px',
            flexShrink: 0,
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
            flex: '1 1 auto',
            minHeight: 0,
            '& .MuiDialogContentText-root': {
              display: 'flex',
              flexDirection: 'column',
              flex: '1 1 auto',
              minHeight: 0,
            },
          }}
        >
          <ScenarioModelExecutionProposalList
            scenarioGroupId={scenarioGroupId}
            executingScenarioIds={executingScenarioIds}
            executedScenarioIds={executedScenarioIds}
            isResizing={isResizing}
            onContentHeightChange={setContentHeight}
            onFillsViewportHeightChange={setFillsViewportHeight}
            onCancel={closePopup}
            onAccepted={onAccepted}
            onCompleted={onCompleted}
            onFailed={onFailed}
          />
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
