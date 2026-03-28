import AddIcon from '@mui/icons-material/Add'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EditIcon from '@mui/icons-material/Edit'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import { Box, Collapse, Stack, Typography } from '@mui/material'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { INewsletterIssueResponse, INewsletterIssueSnapshotData } from '@/service/mi/newsletter'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import MIDropdownMenu from '@/components/common/menu/MIDropdownMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import ShareModal, { type ShareModalEditionMail } from '@/pages/mi/newsletter/components/view/ShareModal'
import { getCoverProps, getDateIssueProps, getTitleProps } from '@/pages/mi/newsletter/utils/snapshotUtils'
import theme from '@/theming'

export type ViewToolbarProps = {
  snapshot: INewsletterIssueSnapshotData | null
  isScrolled: boolean
  newsletterIssues?: INewsletterIssueResponse | null
  onEditMode: () => void
  onRevisionMode: () => void
  onDownloadImage?: () => void
  /** Outlook 확인용: .eml을 zip에 담아 다운로드 (우클릭 메뉴) */
  onDownloadEml?: () => void
  isDownloadingImage?: boolean
  /** 다운로드 불가 시 true (예: 데이터 없음) */
  isDownloadDisabled?: boolean
  /** 차트 이미지 준비 중일 때 true → 공유/다운로드 버튼에 isLoading 적용 */
  isChartImagePreparing?: boolean
  /** GET subscription — 구독 여부 (로딩 전·실패 시 false로 두고 로딩만 표시) */
  isNewsletterSubscribed?: boolean
  isSubscriptionStatusLoading?: boolean
  /** 구독/해제 토글 (PUT/DELETE) — 미전달 시 구독 버튼 비활성 */
  onSubscribeToggle?: () => void
  isSubscriptionMutating?: boolean
  /** 공유 모달에서 편집본 메일 발송 시 사용 */
  editionMail?: ShareModalEditionMail | null
}

const ViewToolbar = ({
  snapshot,
  isScrolled,
  newsletterIssues,
  onEditMode,
  onRevisionMode,
  onDownloadImage,
  onDownloadEml,
  isDownloadingImage: _isDownloadingImage = false,
  isDownloadDisabled = false,
  isChartImagePreparing: _isChartImagePreparing = false,
  isNewsletterSubscribed = false,
  isSubscriptionStatusLoading = false,
  onSubscribeToggle,
  isSubscriptionMutating = false,
  editionMail,
}: ViewToolbarProps) => {
  const navigate = useNavigate()
  const { newsletterId, issueNo } = useParams()
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const downloadHoldTimerRef = useRef<number | null>(null)
  /** 구독 중일 때 호버 → X 아이콘·「구독해제」 (헤더 확장 시에만 라벨 표시) */
  const [subscribeHovered, setSubscribeHovered] = useState(false)
  /** 구독 해제 요청 직후~뮤테이션 종료까지 실제 구독 여부와 무관하게 미구독 UI(라벨「구독」)로 고정 */
  const [pendingUnsubscribe, setPendingUnsubscribe] = useState(false)
  const subscribeLabelMeasureRef = useRef<HTMLSpanElement>(null)
  const [subscribeLabelWidthPx, setSubscribeLabelWidthPx] = useState<number | undefined>(undefined)

  const subscribeUiAsSubscribed = isNewsletterSubscribed && !pendingUnsubscribe

  const subscribeLabelText = useMemo(() => {
    if (pendingUnsubscribe) return '구독'
    return isNewsletterSubscribed ? (subscribeHovered ? '구독해제' : '구독중') : '구독'
  }, [pendingUnsubscribe, isNewsletterSubscribed, subscribeHovered])

  useLayoutEffect(() => {
    const el = subscribeLabelMeasureRef.current
    if (!el) return
    setSubscribeLabelWidthPx(el.offsetWidth)
  }, [subscribeLabelText])

  useEffect(() => {
    if (!isNewsletterSubscribed) setSubscribeHovered(false)
  }, [isNewsletterSubscribed])

  /** 서버/캐시에 미구독 반영 시 pending 해제 (로딩 종료만으로 해제하면 refetch 전 옛값으로 한 프레임 되돌아감) */
  useEffect(() => {
    if (!isNewsletterSubscribed) setPendingUnsubscribe(false)
  }, [isNewsletterSubscribed])

  /** 구독 해제 실패 등으로 여전히 구독 중이면 pending 정리 */
  useEffect(() => {
    if (!isSubscriptionMutating && isNewsletterSubscribed && pendingUnsubscribe) {
      setPendingUnsubscribe(false)
    }
  }, [isSubscriptionMutating, isNewsletterSubscribed, pendingUnsubscribe])

  const subscribeButtonBusy = isSubscriptionStatusLoading || isSubscriptionMutating
  /** 스피너 표시 중에는 아이콘 전환·호버 애니메이션을 끄고(잔상 방지), 체크/X는 비호버 상태로 고정 */
  const subscribeIconHoverForDisplay = subscribeButtonBusy ? false : subscribeHovered
  /** 구독 버튼: 짧고 단순한 전환 (회전 없이 opacity 위주) */
  const subscribeMotionMs = 120
  const subscribeMotionEasing = 'ease-out'
  const subscribeOpacityTransition = subscribeButtonBusy ? 'none' : `opacity ${subscribeMotionMs}ms ${subscribeMotionEasing}`
  const subscribeWidthTransition =
    subscribeLabelWidthPx === undefined || subscribeButtonBusy ? 'none' : `width ${subscribeMotionMs}ms ${subscribeMotionEasing}`

  const shareUrl = useMemo(
    () => (newsletterId && issueNo ? `${globalThis.location.origin}/mi/newsletters/${newsletterId}/${issueNo}` : globalThis.location.href),
    [newsletterId, issueNo],
  )
  const coverProps = getCoverProps(snapshot)
  const dateIssueProps = getDateIssueProps(snapshot)
  const titleProps = getTitleProps(snapshot)

  const hasDownloadOptions = !!onDownloadImage || !!onDownloadEml
  const downloadBusy = !!onDownloadImage && !isDownloadDisabled && (_isChartImagePreparing || _isDownloadingImage)

  const clearDownloadHoldTimer = () => {
    if (downloadHoldTimerRef.current !== null) {
      window.clearTimeout(downloadHoldTimerRef.current)
      downloadHoldTimerRef.current = null
    }
  }

  useEffect(() => clearDownloadHoldTimer, [])

  return (
    <Stack
      paddingTop={isScrolled ? '8px' : '46px'}
      paddingBottom="8px"
      bgcolor={isScrolled ? 'gray.70' : 'commonColor.White'}
      sx={{
        transition: `padding-top 0.3s ease-in-out 0s, background-color 0.3s ease-in-out ${isScrolled ? '0.2s' : '0s'}`,
      }}
    >
      <Stack
        width="800px"
        margin="0 auto"
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        boxSizing="border-box"
        height={isScrolled ? '66px' : '52px'}
      >
        <Box position="relative">
          <Stack
            direction="row"
            alignItems="center"
            gap="10px"
            position="absolute"
            top={0}
            left={0}
            style={{
              transform: isScrolled ? 'translateY(-50%)' : 'translateY(calc(-50% + 30px))',
              opacity: isScrolled ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            }}
          >
            {coverProps.imageBase64 && (
              <Box
                component="img"
                src={coverProps.imageBase64}
                alt="cover"
                width={80}
                height={54}
                borderRadius="6px"
                border="0.5px solid #868E96"
                draggable={false}
              />
            )}
            <Stack gap="4px">
              <Typography variant="body1" color="contentText.White" noWrap width="496px" overflow="hidden" textOverflow="ellipsis">
                {titleProps.title}
              </Typography>
              <Typography variant="body2" color="contentText.White" width="496px" noWrap>
                Issue {(dateIssueProps.issueNo ?? '').padStart(3, '0')} · {dateIssueProps.date} · {coverProps.frequency}
              </Typography>
            </Stack>
          </Stack>
          <MISelectMenu<string>
            variant="outlined"
            items={
              newsletterIssues?.issuedList?.map((issue) => ({
                label: `Issue ${issue.no.padStart(3, '0')} (${issue.date})`,
                value: issue.no,
              })) ?? []
            }
            selected={issueNo ?? ''}
            onSelected={(value: string) => navigate(`/mi/newsletters/${newsletterId}/${value}`)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: 36,
              opacity: isScrolled ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out',
              transform: 'translateY(-50%)',
            }}
            disabled={isScrolled}
            closeOnScroll
          />
        </Box>
        <Stack direction="row" gap="10px">
          <MIBaseButton
            variant="outlined"
            onClick={() => {
              if (!onSubscribeToggle || isSubscriptionStatusLoading || isSubscriptionMutating) return
              if (isNewsletterSubscribed) {
                setPendingUnsubscribe(true)
                setSubscribeHovered(false)
              }
              onSubscribeToggle()
            }}
            onMouseEnter={() => subscribeUiAsSubscribed && setSubscribeHovered(true)}
            onMouseLeave={() => setSubscribeHovered(false)}
            disabled={!onSubscribeToggle || isSubscriptionStatusLoading}
            isLoading={isSubscriptionStatusLoading || isSubscriptionMutating}
            sx={{
              height: '36px',
              backgroundColor: 'commonColor.White',
              padding: `8px ${isScrolled ? '8px' : '12px'} 8px 8px`,
              transition: 'padding 0.3s ease-in-out',
            }}
            buttonHoverBgColor="commonColor.White"
          >
            <Stack direction="row" alignItems="center" gap={isScrolled ? '0px' : '8px'}>
              <Box position="relative" width={20} height={20} flexShrink={0}>
                <AddIcon
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    color: 'gray.70',
                    fontSize: '20px',
                    opacity: subscribeUiAsSubscribed ? 0 : 1,
                    transition: subscribeOpacityTransition,
                    zIndex: subscribeUiAsSubscribed ? 0 : 1,
                    pointerEvents: subscribeUiAsSubscribed ? 'none' : 'auto',
                  }}
                />
                <Box
                  position="absolute"
                  top={0}
                  right={0}
                  bottom={0}
                  left={0}
                  style={{
                    opacity: subscribeUiAsSubscribed ? 1 : 0,
                    transition: subscribeOpacityTransition,
                    pointerEvents: subscribeUiAsSubscribed ? 'auto' : 'none',
                    zIndex: subscribeUiAsSubscribed ? 1 : 0,
                  }}
                >
                  <CheckRoundedIcon
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      color: 'gray.70',
                      fontSize: '20px',
                      opacity: subscribeIconHoverForDisplay ? 0 : 1,
                      transition: subscribeOpacityTransition,
                      zIndex: subscribeIconHoverForDisplay ? 0 : 1,
                      pointerEvents: subscribeIconHoverForDisplay ? 'none' : 'auto',
                    }}
                  />
                  <CloseRoundedIcon
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      color: 'gray.70',
                      fontSize: '20px',
                      opacity: subscribeIconHoverForDisplay ? 1 : 0,
                      transition: subscribeOpacityTransition,
                      zIndex: subscribeIconHoverForDisplay ? 1 : 0,
                      pointerEvents: subscribeIconHoverForDisplay ? 'auto' : 'none',
                    }}
                  />
                </Box>
              </Box>
              <Collapse in={!isScrolled} orientation="horizontal" timeout={220}>
                <Box display="inline-flex">
                  <Box position="relative" display="inline-block" sx={{ verticalAlign: 'middle' }}>
                    <Box
                      component="span"
                      ref={subscribeLabelMeasureRef}
                      aria-hidden
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        whiteSpace: 'nowrap',
                        visibility: 'hidden',
                        pointerEvents: 'none',
                        font: 'inherit',
                      }}
                    >
                      {subscribeLabelText}
                    </Box>
                    <Box
                      sx={{
                        display: 'inline-block',
                        overflow: 'hidden',
                        verticalAlign: 'middle',
                        width: subscribeLabelWidthPx ?? 'auto',
                        transition: subscribeWidthTransition,
                      }}
                    >
                      <Box sx={{ position: 'relative', display: 'inline-block', font: 'inherit' }}>
                        <Box
                          component="span"
                          aria-hidden
                          sx={{
                            visibility: 'hidden',
                            whiteSpace: 'nowrap',
                            display: 'inline-block',
                            font: 'inherit',
                          }}
                        >
                          {subscribeLabelText}
                        </Box>
                        <Box sx={{ position: 'absolute', inset: 0 }}>
                          <Box
                            component="span"
                            aria-hidden={subscribeUiAsSubscribed}
                            sx={{
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              whiteSpace: 'nowrap',
                              font: 'inherit',
                              opacity: subscribeUiAsSubscribed ? 0 : 1,
                              transition: subscribeOpacityTransition,
                              pointerEvents: subscribeUiAsSubscribed ? 'none' : 'auto',
                            }}
                          >
                            구독
                          </Box>
                          <Box
                            aria-hidden={!subscribeUiAsSubscribed}
                            sx={{
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              opacity: subscribeUiAsSubscribed ? 1 : 0,
                              transition: subscribeOpacityTransition,
                              pointerEvents: subscribeUiAsSubscribed ? 'auto' : 'none',
                            }}
                          >
                            <Box sx={{ position: 'relative', display: 'inline-block', font: 'inherit' }}>
                              <Box
                                component="span"
                                aria-hidden
                                sx={{
                                  visibility: 'hidden',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block',
                                  font: 'inherit',
                                }}
                              >
                                {subscribeLabelText}
                              </Box>
                              <Box
                                component="span"
                                aria-hidden={subscribeHovered}
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  whiteSpace: 'nowrap',
                                  font: 'inherit',
                                  opacity: subscribeHovered ? 0 : 1,
                                  transition: subscribeOpacityTransition,
                                  pointerEvents: subscribeHovered ? 'none' : 'auto',
                                }}
                              >
                                구독중
                              </Box>
                              <Box
                                component="span"
                                aria-hidden={!subscribeHovered}
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  whiteSpace: 'nowrap',
                                  font: 'inherit',
                                  opacity: subscribeHovered ? 1 : 0,
                                  transition: subscribeOpacityTransition,
                                  pointerEvents: subscribeHovered ? 'auto' : 'none',
                                }}
                              >
                                구독해제
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </Stack>
          </MIBaseButton>
          <MIBaseButton
            variant="outlined"
            onClick={() => setShareModalOpen(true)}
            sx={{
              height: '36px',
              backgroundColor: 'commonColor.White',
              padding: `8px ${isScrolled ? '6px' : '12px'} 8px 8px`,
              transition: 'padding 0.3s ease-in-out',
            }}
            buttonHoverBgColor="commonColor.White"
          >
            <Stack direction="row" alignItems="center" gap={isScrolled ? '0px' : '8px'}>
              <SendRoundedIcon sx={{ color: 'gray.70', fontSize: '20px' }} />
              <Collapse in={!isScrolled} orientation="horizontal" timeout={300}>
                <Box component="span" style={{ whiteSpace: 'nowrap' }}>
                  공유
                </Box>
              </Collapse>
            </Stack>
          </MIBaseButton>
          <MIDropdownMenu
            label={<ChartDownloadIcon fill={theme.palette.gray[70]} />}
            variant="outlined"
            placement="bottom-end"
            open={downloadMenuOpen}
            onOpenChange={setDownloadMenuOpen}
            disabled={!hasDownloadOptions || isDownloadDisabled}
            isLoading={downloadBusy}
            onClick={() => {
              // 좌클릭: 기존 동작 그대로(즉시 PNG 다운로드)
              if (!onDownloadImage || isDownloadDisabled) return
              onDownloadImage()
            }}
            onPointerDown={(e) => {
              if (!hasDownloadOptions || isDownloadDisabled || downloadBusy) return
              if (e.button !== 2) return
              clearDownloadHoldTimer()
              downloadHoldTimerRef.current = window.setTimeout(() => {
                setDownloadMenuOpen(true)
                downloadHoldTimerRef.current = null
              }, 800)
            }}
            onPointerUp={(e) => {
              if (e.button === 2) clearDownloadHoldTimer()
            }}
            onPointerLeave={() => clearDownloadHoldTimer()}
            onPointerCancel={() => clearDownloadHoldTimer()}
            onContextMenu={(e) => {
              // 기본 컨텍스트 메뉴는 막고, 메뉴 오픈은 홀드 타이머로만 처리
              if (!hasDownloadOptions || isDownloadDisabled || downloadBusy) return
              e.preventDefault()
            }}
            items={[
              {
                label: (
                  <Stack direction="row" alignItems="center" gap="8px">
                    <ImageRoundedIcon sx={{ color: 'gray.70', fontSize: '20px' }} />
                    <Box>이미지(.png)</Box>
                  </Stack>
                ),
                disabled: !onDownloadImage || isDownloadDisabled,
                action: onDownloadImage,
              },
              {
                label: (
                  <Stack direction="row" alignItems="center" gap="8px">
                    <EmailRoundedIcon sx={{ color: 'gray.70', fontSize: '20px' }} />
                    <Box>Outlook(.eml)</Box>
                  </Stack>
                ),
                disabled: !onDownloadEml || isDownloadDisabled,
                action: onDownloadEml,
              },
            ]}
            sx={{
              height: '36px',
              padding: '8px',
              backgroundColor: 'commonColor.White',
            }}
            buttonHoverBgColor="commonColor.White"
          />
          <MIDropdownMenu
            label={<MoreVertIcon sx={{ color: 'gray.70', fontSize: '20px' }} />}
            variant="outlined"
            placement="bottom-end"
            open={moreMenuOpen}
            onOpenChange={setMoreMenuOpen}
            items={[
              {
                label: (
                  <Stack direction="row" alignItems="center" gap="8px">
                    <EditIcon sx={{ color: 'gray.70', fontSize: '20px' }} />
                    <Box>편집모드</Box>
                  </Stack>
                ),
                action: onEditMode,
              },
              {
                label: (
                  <Stack direction="row" alignItems="center" gap="8px">
                    <HistoryRoundedIcon sx={{ color: 'gray.70', fontSize: '20px' }} />
                    <Box>변경이력</Box>
                  </Stack>
                ),
                action: onRevisionMode,
              },
            ]}
            sx={{
              height: '36px',
              padding: '8px',
              backgroundColor: moreMenuOpen ? 'contentBG.Active' : 'commonColor.White',
            }}
            buttonHoverBgColor={moreMenuOpen ? 'contentBG.Active' : 'commonColor.White'}
          />
        </Stack>
      </Stack>

      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={shareUrl}
        editionMail={editionMail ?? undefined}
      />
    </Stack>
  )
}

export default ViewToolbar
