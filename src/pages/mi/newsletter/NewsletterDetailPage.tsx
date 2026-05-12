import { Backdrop, Box, CircularProgress, Fade, Stack, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { cloneDeep } from 'lodash-es'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, useBlocker as useRouterBlocker, useParams } from 'react-router-dom'

import MISimpleConfirm from '@/components/common/confirm/MISimpleConfirm'
import useSnackbar from '@/hooks/useSnackbar'
import InflectionPointChart from '@/pages/mi/newsletter/components/chart/InflectionPointChart'
import ChartEditModal from '@/pages/mi/newsletter/components/edit/ChartEditModal'
import EditToolbar from '@/pages/mi/newsletter/components/edit/EditToolbar'
import NewsletterEdit from '@/pages/mi/newsletter/components/edit/NewsletterEdit'
import AnchorNavigation, { type AnchorItem } from '@/pages/mi/newsletter/components/view/AnchorNavigation'
import DiffViewer from '@/pages/mi/newsletter/components/view/DiffViewer'
import EmailContent from '@/pages/mi/newsletter/components/view/EmailContent'
import NewsletterView from '@/pages/mi/newsletter/components/view/NewsletterView'
import OilPriceRowEmailCapture from '@/pages/mi/newsletter/components/view/OilPriceRowEmailCapture'
import RevisionToolbar, { INITIAL_VERSION_ID } from '@/pages/mi/newsletter/components/view/RevisionToolbar'
import { useRenderEmailContent } from '@/pages/mi/newsletter/components/view/useRenderEmailContent'
import ViewToolbar from '@/pages/mi/newsletter/components/view/ViewToolbar'
import { useChartImageStore } from '@/pages/mi/newsletter/hooks/useChartImageStore'
import { useNewsletterLocalDraft } from '@/pages/mi/newsletter/hooks/useNewsletterLocalDraft'
import { useRevisionChanges } from '@/pages/mi/newsletter/hooks/useRevisionChanges'
import { useSaveNewsletterRevision } from '@/pages/mi/newsletter/hooks/useSaveNewsletterRevision'
import {
  enrichNewsFlowItemTimestamps,
  filterVisibleNewsFlowItems,
  findFirstSectionByCanonicalCode,
  findPrimaryRelatedNewsSection,
  getBlockFields,
  getChartBoxPositions,
  getCoverProps,
  getDateIssueProps,
  getEditorSectionOrderKeysFromSnapshot,
  getMarketTimes,
  getNewsFlowProps,
  getOrderedReferenceSections,
  getReferenceContentBlocks,
  getSectionsInOrder,
  getTitleProps,
  newsletterEditAnchorDomId,
  NEWSLETTER_SECTION_EDIT_LABEL,
  mergeReferenceSectionsIntoSnapshot,
  newsletterSectionToEmailTemplateKind,
  validateNewsletterEditSnapshotForSave,
  isReferenceBlockRemoved,
  isReferenceSectionRemoved,
  NEWSLETTER_SECTION_CODE,
  shouldSuppressNewsFlowChartUi,
  updateBlockFieldsByBlockIdPattern,
  updateChartBoxPositions,
  updateCoverShowImage,
  updateNewsFlowItems,
  updateNewsFlowPresentationFields,
  updateSectionFieldsByCode,
  updateSectionVisibilityById,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import newsletterService, {
  getIssueDetailEffectiveSnapshotData,
  getNewsletterIssueRevisionId,
  type INewsletterIssueDetail,
  type INewsletterIssueSnapshotData,
  type INewsletterSnapshotSection,
  type INewsletterSubscriptionStatus,
  type IRelatedNewsEventItem,
  NewsletterDetailPageMode,
} from '@/service/mi/newsletter'
import useAuthStore from '@/store/useAuthStore'
import useChartEditStore from '@/store/useChartEditStore'
import { convertBase64ImagesToCid, prepareNewsletterEmailHtml } from '@/utils/email'

type PendingLeaveAction = { type: 'route' } | { type: 'endEdit' }
type EditBaseline = {
  snapshot: INewsletterIssueSnapshotData
  revisionNo: number | null
  deltaCount: number | null
}

const NewsletterDetailPage = () => {
  const [mode, setMode] = useState<NewsletterDetailPageMode>(NewsletterDetailPageMode.VIEW)
  const [snapshot, setSnapshot] = useState<INewsletterIssueSnapshotData | null>(null)
  const [editBaseline, setEditBaseline] = useState<EditBaseline | null>(null)
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [forceScrolled, setForceScrolled] = useState<boolean | null>(null)
  const [isChartModalOpen, setIsChartModalOpen] = useState(false)
  const [isEnteringEditMode, setIsEnteringEditMode] = useState(false)
  const [isDraftLoadConfirmOpen, setIsDraftLoadConfirmOpen] = useState(false)
  const enteringEditRef = useRef(false)
  const draftLoadChoiceResolveRef = useRef<((useDraft: boolean) => void) | null>(null)

  const resolveDraftLoadChoice = useCallback((useDraft: boolean) => {
    setIsDraftLoadConfirmOpen(false)
    const resolve = draftLoadChoiceResolveRef.current
    draftLoadChoiceResolveRef.current = null
    resolve?.(useDraft)
  }, [])

  const [selectedVersionId, setSelectedVersionId] = useState<string>(INITIAL_VERSION_ID)
  /** 비교대상: 직전버전(n vs n-1) | 최초버전(n vs 0) */
  const [comparisonTarget, setComparisonTarget] = useState<'previous' | 'initial'>('previous')

  /** 앵커 클릭 시 툴바를 먼저 축소한 뒤 스크롤하기 위한 강제값 (null이면 scrollTop 기반) */
  const effectiveIsScrolled = forceScrolled ?? isScrolled
  const chartAnchorElRef = useRef<HTMLElement | null>(null)
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const { accessCompanyInfo } = useAuthStore()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0
  const { newsletterId, issueNo } = useParams()

  const { data: newsletterIssues } = useQuery({
    queryKey: ['newsletterIssues', newsletterId],
    queryFn: () => newsletterService.getNewsletterIssues(customerCompanyNo, newsletterId!),
    enabled: !!newsletterId && !!customerCompanyNo,
  })

  const issueDetailQuery = useQuery({
    queryKey: ['newsletterIssueDetail', newsletterId, issueNo],
    queryFn: () => newsletterService.getNewsletterIssueDetail(customerCompanyNo, newsletterId!, issueNo!),
    enabled: !!newsletterId && !!issueNo && !!customerCompanyNo,
  })

  const {
    data: issueDetailData,
    isLoading: isIssueDetailLoading,
    isError: isIssueDetailError,
    refetch: refetchIssueDetail,
  } = issueDetailQuery

  /** 쿼리 캐시가 이전 발행호·잘못된 키와 섞이지 않도록 스냅샷 동기화 전에 검증 */
  const detailMatchesRoute = useMemo(() => {
    if (!issueDetailData || !newsletterId || !issueNo) return false
    return String(issueDetailData.newsletterId) === String(newsletterId) && String(issueDetailData.issueNo) === String(issueNo)
  }, [issueDetailData, newsletterId, issueNo])

  const { data: subscriptionStatus, isLoading: isSubscriptionStatusLoading } = useQuery({
    queryKey: ['newsletterSubscription', newsletterId],
    queryFn: () => newsletterService.getNewsletterSubscription(newsletterId!),
    enabled: !!newsletterId,
  })

  useEffect(() => {
    setEditBaseline(null)
  }, [newsletterId, issueNo])

  const { mutate: mutateSubscribe, isPending: isSubscribeMutating } = useMutation({
    mutationFn: async (vars: { nextSubscribed: boolean; newsletterName: string }) => {
      if (!newsletterId) throw new Error('newsletterId missing')
      await newsletterService.updateNewsletterSubscribed(newsletterId, vars.nextSubscribed)
      return vars
    },
    onMutate: async (vars) => {
      if (!newsletterId) return undefined
      await queryClient.cancelQueries({ queryKey: ['newsletterSubscription', newsletterId] })
      const previous = queryClient.getQueryData<INewsletterSubscriptionStatus>(['newsletterSubscription', newsletterId])
      queryClient.setQueryData<INewsletterSubscriptionStatus>(['newsletterSubscription', newsletterId], (old) => ({
        newsletterId: String(newsletterId),
        subscribed: vars.nextSubscribed,
        subscribedAt: old?.subscribedAt ?? null,
        unsubscribedAt: old?.unsubscribedAt ?? null,
      }))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (newsletterId && context?.previous !== undefined) {
        queryClient.setQueryData(['newsletterSubscription', newsletterId], context.previous)
      }
      showSnackbar('구독 처리 중 오류가 발생했습니다', { variant: 'error' })
    },
    onSuccess: ({ nextSubscribed, newsletterName }) => {
      void queryClient.invalidateQueries({ queryKey: ['newsletterIssueDetail', newsletterId, issueNo] })
      showSnackbar(`${newsletterName} 이메일 구독이 ${nextSubscribed ? '완료' : '해제'}되었습니다`, {
        variant: 'success',
      })
    },
    onSettled: () => {
      if (newsletterId) {
        void queryClient.invalidateQueries({ queryKey: ['newsletterSubscription', newsletterId] })
      }
    },
  })

  const issueDetailSnapshot = useMemo(() => getIssueDetailEffectiveSnapshotData(issueDetailData), [issueDetailData])

  /** 서버 스냅샷 복사 — 최종저장 diff 기준(base) */
  const baseSnapshot = useMemo(() => (issueDetailSnapshot ? cloneDeep(issueDetailSnapshot) : null), [issueDetailSnapshot])
  const saveBaseSnapshot = mode === NewsletterDetailPageMode.EDIT && editBaseline ? editBaseline.snapshot : baseSnapshot
  const saveRevisionNo =
    mode === NewsletterDetailPageMode.EDIT && editBaseline ? editBaseline.revisionNo : (issueDetailData?.snapshot?.revisionNo ?? null)
  const saveDeltaCount = mode === NewsletterDetailPageMode.EDIT && editBaseline ? editBaseline.deltaCount : issueDetailData?.deltaCount

  /** 편집 중 로컬 초안(저장 전 포함). 저장 diff·미리보기·편집 UI는 항상 이 값 사용 */
  const effectiveSnapshot = snapshot ?? (mode === NewsletterDetailPageMode.EDIT && editBaseline ? editBaseline.snapshot : baseSnapshot)

  /**
   * 뷰 모드 표시 전용 — GET 상세(`baseSnapshot`)만 반영.
   * 예전에는 `effectiveSnapshot`을 뷰에도 써서, 저장 안 한 사용자 추가 섹션이 뷰에까지 보였음.
   */
  const viewSnapshot = baseSnapshot

  const handleSubscribeToggle = useCallback(() => {
    if (!newsletterId || isSubscriptionStatusLoading || isSubscribeMutating) return
    const nextSubscribed = !(subscriptionStatus?.subscribed ?? false)
    const newsletterName = getCoverProps(viewSnapshot).name || getTitleProps(viewSnapshot).title || '뉴스레터'
    mutateSubscribe({ nextSubscribed, newsletterName })
  }, [newsletterId, isSubscriptionStatusLoading, isSubscribeMutating, subscriptionStatus?.subscribed, viewSnapshot, mutateSubscribe])

  const countReferenceCharts = useCallback((snap: INewsletterIssueSnapshotData | null) => {
    if (!snap) return 0
    const refs = getOrderedReferenceSections(snap)
    return refs.reduce((sum, sec) => {
      if (isReferenceSectionRemoved(sec) || !sec.visibility) return sum
      return sum + getReferenceContentBlocks(sec).filter((b) => b.type === 'CHART' && b.visibility && !isReferenceBlockRemoved(b)).length
    }, 0)
  }, [])

  /**
   * 편집 초안에만 있는 참고 CHART 슬롯까지 포함 — 뷰↔편집 전환 시 이미지 배열 길이가 부족하지 않게 함
   */
  const referenceChartCount = useMemo(
    () => Math.max(countReferenceCharts(effectiveSnapshot), countReferenceCharts(baseSnapshot)),
    [countReferenceCharts, effectiveSnapshot, baseSnapshot],
  )

  const {
    mainChartImage,
    coverImage,
    oilPriceRowImage,
    referenceChartImages,
    onMainChartImageReady,
    onCoverImageReady,
    onOilPriceRowImageReady,
    onReferenceChartImageReady,
    resetImages,
  } = useChartImageStore(referenceChartCount)

  const resetChartSettings = useChartEditStore((s) => s.resetChartSettings)
  const setStoreBoxPositions = useChartEditStore((s) => s.setBoxPositions)

  /** `resetImages`는 referenceChartCount 변경 시마다 새 참조 → effect 의존성에 넣으면 스냅샷이 서버 값으로 덮어써짐(예: 섹션 추가 직후) */
  const resetImagesRef = useRef(resetImages)
  const resetChartSettingsRef = useRef(resetChartSettings)
  resetImagesRef.current = resetImages
  resetChartSettingsRef.current = resetChartSettings

  const newsFlowProps = getNewsFlowProps(effectiveSnapshot)
  const refs = getOrderedReferenceSections(effectiveSnapshot)
  /** 메인 차트에 그릴 데이터가 있는지 (섹션이 숨겨져 있으면 차트가 렌더되지 않아 이미지가 생성되지 않으므로 제외) */
  const newsFlowSection = findPrimaryRelatedNewsSection(effectiveSnapshot)
  const hasMainChartData =
    newsFlowSection?.visibility !== false &&
    ((newsFlowProps.chartData.timestamps?.length ?? 0) > 0 ||
      newsFlowProps.chartData.series?.some((s) => (s.values?.length ?? 0) > 0) ||
      false)
  /** 참고자료 차트에 그릴 데이터가 있는지 */
  const hasReferenceChartData = refs.some((sec) => {
    if (isReferenceSectionRemoved(sec) || !sec.visibility) return false
    return getReferenceContentBlocks(sec).some((b) => {
      if (b.type !== 'CHART' || !b.visibility || isReferenceBlockRemoved(b)) return false
      const c = getBlockFields<{
        timestamps?: number[]
        series?: { values?: number[] }[]
      }>(b)
      const hasTs = (c?.timestamps?.length ?? 0) > 0
      const hasSeries = c?.series?.some((s) => (s.values?.length ?? 0) > 0) ?? false
      return hasTs || hasSeries
    })
  })
  /** 차트 이미지가 필요한지 (실제 차트 데이터가 있어서 이미지 생성 대기 중) */
  const hasChartsToRender = hasReferenceChartData || hasMainChartData

  const suppressNewsFlowChartUi = useMemo(() => shouldSuppressNewsFlowChartUi(effectiveSnapshot), [effectiveSnapshot])
  const hasTitleOilPriceRow = useMemo(() => {
    const t = getTitleProps(effectiveSnapshot)
    return (
      t.priceChangeFrom !== undefined &&
      t.priceChangeTo !== undefined &&
      Number.isFinite(t.priceChangeFrom) &&
      Number.isFinite(t.priceChangeTo)
    )
  }, [effectiveSnapshot])

  const viewNewsFlowProps = useMemo(() => getNewsFlowProps(viewSnapshot), [viewSnapshot])
  const viewRefsOrdered = useMemo(() => getOrderedReferenceSections(viewSnapshot), [viewSnapshot])
  const viewNewsFlowSection = findPrimaryRelatedNewsSection(viewSnapshot)
  const viewHasMainChartData =
    viewNewsFlowSection?.visibility !== false &&
    ((viewNewsFlowProps.chartData.timestamps?.length ?? 0) > 0 ||
      viewNewsFlowProps.chartData.series?.some((s) => (s.values?.length ?? 0) > 0) ||
      false)
  const viewHasReferenceChartData = viewRefsOrdered.some((sec) => {
    if (isReferenceSectionRemoved(sec) || !sec.visibility) return false
    return getReferenceContentBlocks(sec).some((b) => {
      if (b.type !== 'CHART' || !b.visibility || isReferenceBlockRemoved(b)) return false
      const c = getBlockFields<{
        timestamps?: number[]
        series?: { values?: number[] }[]
      }>(b)
      const hasTs = (c?.timestamps?.length ?? 0) > 0
      const hasSeries = c?.series?.some((s) => (s.values?.length ?? 0) > 0) ?? false
      return hasTs || hasSeries
    })
  })
  const viewHasChartsToRender = viewHasReferenceChartData || viewHasMainChartData
  const viewSuppressNewsFlowChartUi = useMemo(() => shouldSuppressNewsFlowChartUi(viewSnapshot), [viewSnapshot])
  const viewHasTitleOilPriceRow = useMemo(() => {
    const t = getTitleProps(viewSnapshot)
    return (
      t.priceChangeFrom !== undefined &&
      t.priceChangeTo !== undefined &&
      Number.isFinite(t.priceChangeFrom) &&
      Number.isFinite(t.priceChangeTo)
    )
  }, [viewSnapshot])

  /** 미리보기/이메일 가능: 차트가 없으면 바로 가능, 메인 차트만 있으면 해당 이미지 준비 시 허용 (참고자료는 준비되는 대로 사용, 미준비 시 빈 이미지). Title 유가 행이 있으면 캡처 이미지 준비까지 대기 */
  const isReadyForEmail =
    (!hasChartsToRender || !hasMainChartData || mainChartImage.length > 0) && (!hasTitleOilPriceRow || oilPriceRowImage.length > 0)

  /** 뷰 툴바 다운로드 등 — 서버 스냅샷 기준(초안에만 있는 차트는 대기 대상에서 제외) */
  const isReadyForEmailView =
    (!viewHasChartsToRender || !viewHasMainChartData || mainChartImage.length > 0) &&
    (!viewHasTitleOilPriceRow || oilPriceRowImage.length > 0)

  const { render: renderEmailContent } = useRenderEmailContent()

  const { saveFinalRevision, saveDraftRevision, isSaving, isSavingDraft, hasUnsavedChanges } = useSaveNewsletterRevision({
    newsletterId,
    issueNo,
    baseSnapshot: saveBaseSnapshot,
    currentState: effectiveSnapshot,
    revisionNo: saveRevisionNo,
    deltaCount: saveDeltaCount,
  })

  const { getLocalDraft, clearLocalDraft } = useNewsletterLocalDraft({
    newsletterId,
    issueNo,
    isEditMode: mode === NewsletterDetailPageMode.EDIT,
    currentSnapshot: effectiveSnapshot,
    baseSnapshot: saveBaseSnapshot,
    baseRevisionNo: saveRevisionNo,
    hasUnsavedChanges,
    useLiveChartLayoutForPersist: mode === NewsletterDetailPageMode.EDIT,
  })

  const [pendingLeaveAction, setPendingLeaveAction] = useState<PendingLeaveAction | null>(null)
  const [isSavingOnLeave, setIsSavingOnLeave] = useState(false)

  /**
   * 임시저장 성공 후, 추가 수정이 없는 상태를 추적
   * `hasUnsavedChanges`는 baseSnapshot(서버 발행본) 기준이라 임시저장 후에도 true이므로,
   * 이 플래그로 "임시저장 이후 새 수정이 없는" 상태를 구분
   */
  const [isDraftSavedWithoutNewEdits, setIsDraftSavedWithoutNewEdits] = useState(false)

  useEffect(() => {
    if (mode === NewsletterDetailPageMode.EDIT) {
      setIsDraftSavedWithoutNewEdits(false)
    }
  }, [effectiveSnapshot, mode])

  const needsLeaveConfirm = hasUnsavedChanges && !isDraftSavedWithoutNewEdits

  const blocker = useRouterBlocker(
    ({ currentLocation, nextLocation }) =>
      mode === NewsletterDetailPageMode.EDIT && needsLeaveConfirm && currentLocation.pathname !== nextLocation.pathname,
  )

  const blockerRef = useRef(blocker)
  blockerRef.current = blocker

  useEffect(() => {
    if (blocker.state === 'blocked' && !pendingLeaveAction) {
      setPendingLeaveAction({ type: 'route' })
    }
  }, [blocker.state, pendingLeaveAction])

  const editSaveValidation = useMemo(() => validateNewsletterEditSnapshotForSave(effectiveSnapshot), [effectiveSnapshot])
  const isEditSnapshotValid = editSaveValidation.valid

  const issueRevisionId = issueDetailData ? getNewsletterIssueRevisionId(issueDetailData) : undefined

  const { versions: revisionVersions, isLoading: isRevisionLoading } = useRevisionChanges(
    newsletterId ?? undefined,
    issueNo ?? undefined,
    issueRevisionId,
  )

  /**
   * 편집용 로컬 `snapshot`을 서버 발행호 상세(`issueDetailData`)와 맞춥니다.
   * - 뷰/개정/캡처 등: 상세 쿼리가 바뀌면 서버 기준으로 로컬을 맞춤(저장 후 리패치 포함).
   * - 편집 모드: 초안과 진입 시점 baseline을 유지 — 백그라운드 리패치로 revisionNo만 최신화되는 상태를 막음.
   *   편집 진입 시 동기화는 `handleEnterEditMode`만 담당.
   */
  useLayoutEffect(() => {
    if (!newsletterId || !issueNo) {
      setSnapshot(null)
      return
    }
    if (!detailMatchesRoute || !issueDetailData) {
      setSnapshot(null)
      return
    }
    if (mode === NewsletterDetailPageMode.EDIT) {
      return
    }
    const snap = getIssueDetailEffectiveSnapshotData(issueDetailData)
    if (!snap) {
      setSnapshot(null)
      return
    }
    setSnapshot(cloneDeep(snap))
    resetImagesRef.current()
    resetChartSettingsRef.current()
  }, [mode, newsletterId, issueNo, detailMatchesRoute, issueDetailData])

  /**
   * 편집 진입: 최신 상세를 받은 뒤 로컬 초안으로 반영.
   * `revision.hasDraft`이면 확인창을 띄운 뒤, 사용자가 "임시저장 불러오기"를 선택했을 때만
   * GET .../revisions/draft를 호출합니다.
   */
  const handleEnterEditMode = useCallback(async () => {
    if (!newsletterId || !issueNo) return
    if (enteringEditRef.current) return
    enteringEditRef.current = true
    setIsEnteringEditMode(true)
    try {
      let detail: INewsletterIssueDetail | undefined
      try {
        const result = await refetchIssueDetail()
        detail = result.data ?? undefined
      } catch {
        // 네트워크 실패 시에도 캐시가 있으면 그걸 기준으로 편집 진입
      }
      detail ??= queryClient.getQueryData<INewsletterIssueDetail>(['newsletterIssueDetail', newsletterId, issueNo])

      if (detail && String(detail.newsletterId) === String(newsletterId) && String(detail.issueNo) === String(issueNo)) {
        const detailBaseSnapshot = getIssueDetailEffectiveSnapshotData(detail)
        const detailRevisionNo = detail.snapshot?.revisionNo ?? null
        if (detailBaseSnapshot) {
          setEditBaseline({
            snapshot: cloneDeep(detailBaseSnapshot),
            revisionNo: detailRevisionNo,
            deltaCount: detail.deltaCount ?? null,
          })
        } else {
          setEditBaseline(null)
        }

        let snap: INewsletterIssueSnapshotData | null = null
        let skipServerDraftLoad = false

        // 1. 로컬스토리지에 자동 저장된 내용 우선 확인
        const localDraftResult = getLocalDraft({ baseSnapshot: detailBaseSnapshot, baseRevisionNo: detailRevisionNo })
        if (localDraftResult.status === 'found') {
          setIsEnteringEditMode(false)
          const useLocal = await new Promise<boolean>((resolve) => {
            draftLoadChoiceResolveRef.current = resolve
            setIsDraftLoadConfirmOpen(true)
          })
          setIsDraftLoadConfirmOpen(false)
          draftLoadChoiceResolveRef.current = null

          if (useLocal) {
            snap = cloneDeep(localDraftResult.draft.snapshot)
            clearLocalDraft()
            showSnackbar('자동 저장된 편집 내용을 불러왔습니다.', { variant: 'success' })
          } else {
            clearLocalDraft()
            skipServerDraftLoad = true
          }
        } else if (localDraftResult.status === 'stale' || localDraftResult.status === 'expired' || localDraftResult.status === 'invalid') {
          clearLocalDraft()
          showSnackbar('최신 저장 상태와 맞지 않는 자동 저장본은 불러오지 않았습니다.', {
            variant: 'warning',
            body: '서버의 최신 내용으로 편집을 시작합니다.',
          })
        }

        // 2. 로컬 드래프트를 불러오지 않았으면 서버 임시저장본 확인
        if (!snap && !skipServerDraftLoad && detail.revision?.hasDraft) {
          setIsEnteringEditMode(false)
          const useDraft = await new Promise<boolean>((resolve) => {
            draftLoadChoiceResolveRef.current = resolve
            setIsDraftLoadConfirmOpen(true)
          })
          setIsDraftLoadConfirmOpen(false)
          draftLoadChoiceResolveRef.current = null

          if (useDraft) {
            setIsEnteringEditMode(true)
            try {
              const draft = await newsletterService.getRevisionDraft(Number(newsletterId), issueNo)
              if (draft?.content && Array.isArray(draft.content.sections) && draft.revisionNo === detailRevisionNo) {
                snap = cloneDeep(draft.content)
                showSnackbar('임시저장된 편집 내용을 불러왔습니다.', { variant: 'success' })
              } else if (draft?.content && Array.isArray(draft.content.sections)) {
                snap = detailBaseSnapshot
                showSnackbar('최신 저장 상태와 맞지 않는 임시저장본은 불러오지 않았습니다.', {
                  variant: 'warning',
                  body: '서버의 최신 내용으로 편집을 시작합니다.',
                })
              } else {
                snap = detailBaseSnapshot
              }
            } catch {
              snap = detailBaseSnapshot
            } finally {
              setIsEnteringEditMode(false)
            }
          } else {
            snap = detailBaseSnapshot
          }
        }

        snap ??= detailBaseSnapshot

        if (snap) {
          setSnapshot(cloneDeep(snap))
          resetImagesRef.current()
          resetChartSettingsRef.current()
          const savedPositions = getChartBoxPositions(snap)
          if (Object.keys(savedPositions).length > 0) {
            setStoreBoxPositions(savedPositions)
          }
        }
      }

      setMode(NewsletterDetailPageMode.EDIT)
    } finally {
      enteringEditRef.current = false
      setIsEnteringEditMode(false)
    }
  }, [newsletterId, issueNo, refetchIssueDetail, queryClient, showSnackbar, getLocalDraft, clearLocalDraft, setStoreBoxPositions])

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (!scrollEl) return undefined

    const handleScroll = () => setIsScrolled(scrollEl.scrollTop > 0)
    handleScroll()
    scrollEl.addEventListener('scroll', handleScroll)
    return () => scrollEl.removeEventListener('scroll', handleScroll)
  }, [])

  /** 편집/개정 모드 진입·종료 시 스크롤을 상단으로 */
  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'instant' })
  }, [mode])

  /** REVISION 모드 진입 시 최신 버전을 기본 선택.
   * 사용자가 versions 목록의 버전을 이미 선택했다면 절대 덮어쓰지 않음. */
  const hasSetInitialForRevisionRef = useRef(false)
  useEffect(() => {
    if (mode !== NewsletterDetailPageMode.REVISION) {
      hasSetInitialForRevisionRef.current = false
      return
    }
    if (revisionVersions.length === 0) return

    // 사용자가 이미 유효한 버전(목록에 있거나 최초버전)을 선택했다면 → 절대 덮어쓰지 않음
    const isUserChoiceValid = selectedVersionId === INITIAL_VERSION_ID || revisionVersions.some((v) => v.id === selectedVersionId)
    if (isUserChoiceValid && hasSetInitialForRevisionRef.current) return

    if (!hasSetInitialForRevisionRef.current) {
      hasSetInitialForRevisionRef.current = true
      setSelectedVersionId(revisionVersions[0].id)
    }
  }, [mode, revisionVersions, selectedVersionId])

  const handleReset = useCallback(() => {
    const snap =
      mode === NewsletterDetailPageMode.EDIT && editBaseline ? editBaseline.snapshot : getIssueDetailEffectiveSnapshotData(issueDetailData)
    if (snap) {
      setSnapshot(cloneDeep(snap))
      resetImages()
      resetChartSettings()
    }
  }, [editBaseline, issueDetailData, mode, resetImages, resetChartSettings])

  const handleRelatedNewsChange = useCallback((items: IRelatedNewsEventItem[]) => {
    setSnapshot((prev) => (prev ? updateNewsFlowItems(prev, items) : prev))
  }, [])

  const handleReferencesChange = useCallback((referenceSections: INewsletterSnapshotSection[]) => {
    setSnapshot((prev) => (prev ? mergeReferenceSectionsIntoSnapshot(prev, referenceSections) : prev))
  }, [])

  /** 에디터에서 섹션 순서 변경 시 스냅샷 sections[].order 반영 (순서 불변 시 동일 참조 유지) */
  const handleSnapshotReorder = useCallback((next: INewsletterIssueSnapshotData) => {
    setSnapshot((prev) => (prev === next ? prev : next))
  }, [])

  const handleSectionVisibilityChange = useCallback((sectionId: string, visible: boolean) => {
    setSnapshot((prev) => (prev ? updateSectionVisibilityById(prev, sectionId, visible) : prev))
  }, [])

  const handleTitleChange = useCallback((value?: string) => {
    setSnapshot((prev) =>
      prev && value !== null ? updateSectionFieldsByCode(prev, NEWSLETTER_SECTION_CODE.TITLE, { title: value }) : prev,
    )
  }, [])

  const handleSubtitleChange = useCallback((value?: string) => {
    setSnapshot((prev) =>
      prev && value !== null ? updateSectionFieldsByCode(prev, NEWSLETTER_SECTION_CODE.TITLE, { subtitle: value }) : prev,
    )
  }, [])

  const parseTitleOilPriceInput = useCallback((value?: string): number | undefined => {
    if (value === undefined || value.trim() === '') return undefined
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }, [])

  const handlePriceChangeFromChange = useCallback(
    (value?: string) => {
      if (value === null) return
      const n = parseTitleOilPriceInput(value)
      setSnapshot((prev) => (prev ? updateSectionFieldsByCode(prev, NEWSLETTER_SECTION_CODE.TITLE, { priceChangeFrom: n }) : prev))
    },
    [parseTitleOilPriceInput],
  )

  const handlePriceChangeToChange = useCallback(
    (value?: string) => {
      if (value === null) return
      const n = parseTitleOilPriceInput(value)
      setSnapshot((prev) => (prev ? updateSectionFieldsByCode(prev, NEWSLETTER_SECTION_CODE.TITLE, { priceChangeTo: n }) : prev))
    },
    [parseTitleOilPriceInput],
  )

  const handleSummaryChange = useCallback((value?: string) => {
    setSnapshot((prev) =>
      prev && value !== null ? updateSectionFieldsByCode(prev, NEWSLETTER_SECTION_CODE.SUMMARY, { summaryText: value }) : prev,
    )
  }, [])

  const handleNameChange = useCallback((value?: string) => {
    setSnapshot((prev) =>
      prev && value !== null ? updateSectionFieldsByCode(prev, NEWSLETTER_SECTION_CODE.COVER, { newsletterName: value }) : prev,
    )
  }, [])

  const handleDescriptionChange = useCallback((value?: string) => {
    setSnapshot((prev) =>
      prev && value !== null ? updateSectionFieldsByCode(prev, NEWSLETTER_SECTION_CODE.COVER, { newsletterDescription: value }) : prev,
    )
  }, [])

  const handleCoverShowImageChange = useCallback((show: boolean) => {
    setSnapshot((prev) => (prev ? updateCoverShowImage(prev, show) : prev))
  }, [])

  const handleNewsFlowTitleChange = useCallback((value?: string) => {
    setSnapshot((prev) => (prev && value !== null ? updateNewsFlowPresentationFields(prev, { title: value }) : prev))
  }, [])

  const handleNewsFlowAggregationTimeChange = useCallback((value?: string) => {
    setSnapshot((prev) => (prev && value !== null ? updateNewsFlowPresentationFields(prev, { aggregationTime: value }) : prev))
  }, [])

  const handleFooterContentChange = useCallback((value?: string) => {
    setSnapshot((prev) =>
      prev && value !== null ? updateSectionFieldsByCode(prev, NEWSLETTER_SECTION_CODE.FOOTER, { footerContent: value }) : prev,
    )
  }, [])

  const handleFooterShowLogoChange = useCallback((show: boolean) => {
    setSnapshot((prev) => {
      if (!prev) return prev
      const foot = findFirstSectionByCanonicalCode(prev, NEWSLETTER_SECTION_CODE.FOOTER)
      if (!foot) return prev
      return updateBlockFieldsByBlockIdPattern(prev, foot.id, 'FOOTER_NOTICE', { showLogo: show })
    })
  }, [])

  /**
   * 차트 박스 드래그 종료(또는 리셋) 시에만 스냅샷 CHART 블록에 반영.
   * 드래그 중에는 스토어만 갱신하고, 마우스를 놓은 뒤 한 번만 반영해 리렌더·델타 계산과 충돌하지 않습니다.
   */
  const flushChartBoxPositionsToSnapshot = useCallback(() => {
    const positions = useChartEditStore.getState().boxPositions
    setSnapshot((prev) => {
      if (!prev) return prev
      return updateChartBoxPositions(prev, positions)
    })
  }, [])

  const handlePreview = useCallback(async () => {
    if (isPreviewLoading || !effectiveSnapshot || !isReadyForEmail) return
    setIsChartModalOpen(false)
    setIsPreviewLoading(true)
    try {
      const chartImage = suppressNewsFlowChartUi ? null : (
        <img src={mainChartImage} alt="flow chart" width={800} style={{ display: 'block', width: '800px', border: 0 }} />
      )
      const htmlContent = await renderEmailContent(
        effectiveSnapshot,
        chartImage,
        referenceChartImages,
        coverImage || undefined,
        oilPriceRowImage || undefined,
      )

      const fullHtml = prepareNewsletterEmailHtml(htmlContent, { pageTitle: '뉴스레터 미리보기' })

      const blob = new Blob([fullHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'width=900,height=800,scrollbars=yes,resizable=yes')
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } finally {
      setIsPreviewLoading(false)
    }
  }, [
    effectiveSnapshot,
    isPreviewLoading,
    isReadyForEmail,
    mainChartImage,
    coverImage,
    oilPriceRowImage,
    referenceChartImages,
    renderEmailContent,
    suppressNewsFlowChartUi,
  ])

  const handleChart = useCallback((anchorEl: HTMLElement) => {
    chartAnchorElRef.current = anchorEl
    setIsChartModalOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    if (suppressNewsFlowChartUi) setIsChartModalOpen(false)
  }, [suppressNewsFlowChartUi])

  const handleChartModalClose = useCallback(() => {
    setIsChartModalOpen(false)
  }, [])

  const reloadLatestSnapshotForEdit = useCallback(async (): Promise<boolean> => {
    if (!newsletterId || !issueNo) return false

    let detail: INewsletterIssueDetail | undefined
    try {
      const result = await refetchIssueDetail()
      detail = result.data ?? undefined
    } catch {
      detail = undefined
    }
    detail ??= queryClient.getQueryData<INewsletterIssueDetail>(['newsletterIssueDetail', newsletterId, issueNo])

    if (!detail || String(detail.newsletterId) !== String(newsletterId) || String(detail.issueNo) !== String(issueNo)) {
      return false
    }

    const latestSnapshot = getIssueDetailEffectiveSnapshotData(detail)
    if (!latestSnapshot) return false

    setEditBaseline({
      snapshot: cloneDeep(latestSnapshot),
      revisionNo: detail.snapshot?.revisionNo ?? null,
      deltaCount: detail.deltaCount ?? null,
    })
    setSnapshot(cloneDeep(latestSnapshot))
    resetImages()
    resetChartSettings()

    const savedPositions = getChartBoxPositions(latestSnapshot)
    if (Object.keys(savedPositions).length > 0) {
      setStoreBoxPositions(savedPositions)
    }

    return true
  }, [newsletterId, issueNo, refetchIssueDetail, queryClient, resetImages, resetChartSettings, setStoreBoxPositions])

  const handleRevisionVersionConflict = useCallback(async () => {
    clearLocalDraft()
    setIsDraftSavedWithoutNewEdits(false)
    await reloadLatestSnapshotForEdit()
  }, [clearLocalDraft, reloadLatestSnapshotForEdit])

  const updateEditBaselineRevisionNo = useCallback((revisionNo: number | null | undefined) => {
    if (typeof revisionNo !== 'number' || !Number.isFinite(revisionNo)) return
    setEditBaseline((prev) => (prev ? { ...prev, revisionNo } : prev))
  }, [])

  const handleSaveDraft = useCallback(async () => {
    const result = await saveDraftRevision()
    if (result.success) {
      updateEditBaselineRevisionNo(result.revision.revisionNo)
      clearLocalDraft()
      setIsDraftSavedWithoutNewEdits(true)
    } else if (result.reason === 'revision-version-conflict') {
      await handleRevisionVersionConflict()
    }
  }, [saveDraftRevision, updateEditBaselineRevisionNo, clearLocalDraft, handleRevisionVersionConflict])

  const handleSave = useCallback(async () => {
    const result = await saveFinalRevision()
    if (result.success) {
      clearLocalDraft()
      setIsChartModalOpen(false)
      setEditBaseline(null)
      setMode(NewsletterDetailPageMode.VIEW)
    } else if (result.reason === 'revision-version-conflict') {
      await handleRevisionVersionConflict()
    }
  }, [saveFinalRevision, clearLocalDraft, handleRevisionVersionConflict])

  const handleEndEdit = useCallback(() => {
    if (needsLeaveConfirm) {
      setPendingLeaveAction({ type: 'endEdit' })
    } else {
      clearLocalDraft()
      setIsChartModalOpen(false)
      setEditBaseline(null)
      setMode(NewsletterDetailPageMode.VIEW)
    }
  }, [needsLeaveConfirm, clearLocalDraft])

  const handleLeaveEditSaveDraft = useCallback(async () => {
    setIsSavingOnLeave(true)
    try {
      const result = await saveDraftRevision()
      if (!result.success) {
        if (result.reason === 'revision-version-conflict') {
          await handleRevisionVersionConflict()
          const b = blockerRef.current
          if (b.state === 'blocked') {
            b.reset?.()
          }
          setPendingLeaveAction(null)
        }
        return
      }
      clearLocalDraft()
      setEditBaseline(null)
      const b = blockerRef.current
      if (b.state === 'blocked') {
        b.proceed?.()
      } else {
        setIsChartModalOpen(false)
        setMode(NewsletterDetailPageMode.VIEW)
      }
      setPendingLeaveAction(null)
    } finally {
      setIsSavingOnLeave(false)
    }
  }, [saveDraftRevision, handleRevisionVersionConflict, clearLocalDraft])

  const handleLeaveEditDiscard = useCallback(() => {
    clearLocalDraft()
    setEditBaseline(null)
    const b = blockerRef.current
    if (b.state === 'blocked') {
      b.proceed?.()
    } else {
      setIsChartModalOpen(false)
      setMode(NewsletterDetailPageMode.VIEW)
    }
    setPendingLeaveAction(null)
  }, [clearLocalDraft])

  const handleLeaveEditCancel = useCallback(() => {
    if (isSavingOnLeave) return
    const b = blockerRef.current
    if (b.state === 'blocked') {
      b.reset?.()
    }
    setPendingLeaveAction(null)
  }, [isSavingOnLeave])

  const handleDownloadImage = useCallback(async () => {
    if (isDownloadingImage || !viewSnapshot || !isReadyForEmailView) return
    setIsDownloadingImage(true)
    try {
      const chartImage = viewSuppressNewsFlowChartUi ? null : (
        <img src={mainChartImage} alt="flow chart" width={800} style={{ display: 'block', width: '800px', border: 0 }} />
      )
      const htmlContent = await renderEmailContent(
        viewSnapshot,
        chartImage,
        referenceChartImages,
        coverImage || undefined,
        oilPriceRowImage || undefined,
      )

      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#fff;'
      container.innerHTML = htmlContent
      document.body.appendChild(container)

      await new Promise((r) => setTimeout(r, 100))

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      container.remove()

      const padding = 42
      const paddedCanvas = document.createElement('canvas')
      paddedCanvas.width = canvas.width + padding * 2
      paddedCanvas.height = canvas.height + padding * 2
      const ctx = paddedCanvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height)
        ctx.drawImage(canvas, padding, padding, canvas.width, canvas.height)
      }

      const link = document.createElement('a')
      const { date } = getDateIssueProps(viewSnapshot)
      link.download = `Issue ${issueNo?.padStart(3, '0')} (${date}).png`
      link.href = paddedCanvas.toDataURL('image/png')
      link.click()
    } finally {
      setIsDownloadingImage(false)
    }
  }, [
    viewSnapshot,
    isDownloadingImage,
    issueNo,
    mainChartImage,
    coverImage,
    oilPriceRowImage,
    referenceChartImages,
    renderEmailContent,
    isReadyForEmailView,
    viewSuppressNewsFlowChartUi,
  ])

  /** Outlook 확인용: HTML을 .eml(RFC822)로 만든 뒤 zip에 넣어 다운로드 */
  const handleDownloadEml = useCallback(async () => {
    if (!viewSnapshot || !isReadyForEmailView) return
    const chartImage = viewSuppressNewsFlowChartUi ? null : (
      <img src={mainChartImage} alt="flow chart" width={800} style={{ display: 'block', width: '800px', border: 0 }} />
    )
    const htmlContent = await renderEmailContent(
      viewSnapshot,
      chartImage,
      referenceChartImages,
      coverImage || undefined,
      oilPriceRowImage || undefined,
    )
    const htmlBody = prepareNewsletterEmailHtml(htmlContent)

    const { date, issueNo: issueNoForName } = getDateIssueProps(viewSnapshot)
    const { title } = getTitleProps(viewSnapshot)
    const subject = viewSnapshot?.meta?.emailSubject ?? title ?? ''
    const fileIssue = (issueNoForName ?? issueNo ?? '').padStart(3, '0')

    const eml = [
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      htmlBody,
    ].join('\r\n')

    const emlFileName = `Issue ${fileIssue} (${date}).eml`
    const zip = new JSZip()
    zip.file(emlFileName, eml)
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.download = `Issue ${fileIssue} (${date}).zip`
    link.href = url
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }, [
    viewSnapshot,
    isReadyForEmailView,
    viewSuppressNewsFlowChartUi,
    mainChartImage,
    referenceChartImages,
    coverImage,
    oilPriceRowImage,
    renderEmailContent,
    issueNo,
  ])

  /** 공유 모달 → 편집본 메일 발송용 (뷰 스냅샷·다운로드와 동일 기준) */
  const prepareShareEditionMailPayload = useCallback(async () => {
    if (!viewSnapshot || !isReadyForEmailView) {
      throw new Error('이메일을 준비할 수 없습니다. 잠시 후 다시 시도해 주세요.')
    }
    const chartImage = viewSuppressNewsFlowChartUi ? null : (
      <img src={mainChartImage} alt="flow chart" width={800} style={{ display: 'block', width: '800px', border: 0 }} />
    )
    const htmlWithBase64 = await renderEmailContent(
      viewSnapshot,
      chartImage,
      referenceChartImages,
      coverImage || undefined,
      oilPriceRowImage || undefined,
    )
    const { htmlContent, images } = convertBase64ImagesToCid(htmlWithBase64)
    const { title } = getTitleProps(viewSnapshot)
    return {
      subject: viewSnapshot?.meta?.emailSubject ?? title ?? '',
      htmlBody: prepareNewsletterEmailHtml(htmlContent),
      images,
    }
  }, [
    viewSnapshot,
    isReadyForEmailView,
    viewSuppressNewsFlowChartUi,
    mainChartImage,
    coverImage,
    oilPriceRowImage,
    referenceChartImages,
    renderEmailContent,
  ])

  /**
   * EDIT 모드 앵커 — `NewsletterEdit`의 `sectionOrder`·`newsletterEditAnchorDomId`와 동일 규칙.
   * 스냅샷에 없는 고정 섹션은 렌더에서도 생략되므로 키 목록에 없으면 앵커에서도 제외.
   */
  const editAnchorItems: AnchorItem[] = useMemo(() => {
    if (mode !== NewsletterDetailPageMode.EDIT || !effectiveSnapshot) return []
    const keys = getEditorSectionOrderKeysFromSnapshot(effectiveSnapshot)
    const cover = NEWSLETTER_SECTION_CODE.COVER
    const footer = NEWSLETTER_SECTION_CODE.FOOTER
    const middle = keys.filter((id) => id !== cover && id !== footer)
    /** `NewsletterEdit.sectionOrder`과 동일 — COVER·FOOTER는 항상 양 끝 고정 */
    const orderedKeys = [cover, ...middle, footer]
    let referenceOrdinal = 0
    let ordinal = 0
    return orderedKeys.map((editorKey) => {
      const isFixedSlot = editorKey === cover || editorKey === footer
      if (editorKey.startsWith('ref:')) {
        ordinal += 1
        referenceOrdinal += 1
        const sid = editorKey.slice(4)
        const sec = effectiveSnapshot.sections.find((s) => s.id === sid)
        const title = String(sec?.fields?.title ?? '').trim()
        return {
          id: newsletterEditAnchorDomId(editorKey),
          label: `${String(ordinal).padStart(2, '0')} ${title || `Reference ${referenceOrdinal}`}`,
        }
      }
      if (isFixedSlot) {
        return {
          id: newsletterEditAnchorDomId(editorKey),
          label: NEWSLETTER_SECTION_EDIT_LABEL[editorKey] ?? editorKey,
        }
      }
      ordinal += 1
      return {
        id: newsletterEditAnchorDomId(editorKey),
        label: `${String(ordinal).padStart(2, '0')} ${NEWSLETTER_SECTION_EDIT_LABEL[editorKey] ?? editorKey}`,
      }
    })
  }, [effectiveSnapshot, mode])

  /**
   * VIEW/REVISION — `NewsletterView`/`DiffViewer` + `EmailContent`와 동일한 문서 순서·DOM id.
   * 커버는 `tempHideCover`로 테이블 밖 `id="section-cover"` 한 곳만 쓰임.
   */
  const viewAnchorItems: AnchorItem[] = useMemo(() => {
    if (!viewSnapshot || (mode !== NewsletterDetailPageMode.VIEW && mode !== NewsletterDetailPageMode.REVISION)) {
      return []
    }
    const ordered = getSectionsInOrder(viewSnapshot)
    const refList = getOrderedReferenceSections(viewSnapshot)
    const items: AnchorItem[] = []
    let summaryCount = 0
    let newsFlowCount = 0
    for (const s of ordered) {
      const kind = newsletterSectionToEmailTemplateKind(s)
      if (kind === 'UNKNOWN') continue
      // if (kind === 'COVER') {
      //   if (!items.some((it) => it.id === 'section-cover')) {
      //     items.push({ id: 'section-cover', label: 'Cover' })
      //   }
      //   continue
      // }
      // if (kind === 'DATE_ISSUE') {
      //   items.push({ id: `section-dateAndIssue-${s.id}`, label: 'Date & Issue' })
      //   continue
      // }
      // if (kind === 'TITLE') {
      //   titleCount += 1
      //   const headline = getTitleProps(viewSnapshot, s).title.trim()
      //   items.push({
      //     id: `section-title-${s.id}`,
      //     label: headline || (titleCount === 1 ? '제목' : `제목 (${titleCount})`),
      //   })
      //   continue
      // }
      if (kind === 'SUMMARY') {
        summaryCount += 1
        items.push({
          id: `section-summary-${s.id}`,
          label: summaryCount === 1 ? '핵심 요약' : `핵심 요약 (${summaryCount})`,
        })
        continue
      }
      if (kind === 'SECTION' || kind === 'NEWS_FLOW' || kind === 'SIG_NEWS') {
        newsFlowCount += 1
        const flow = getNewsFlowProps(viewSnapshot, s)
        const flowTitle = flow.title.trim()
        const sub = flow.aggregationTime.trim()
        const label = flowTitle || sub || (newsFlowCount === 1 ? '주요 뉴스 Flow' : `주요 뉴스 Flow (${newsFlowCount})`)
        items.push({
          id: kind === 'SIG_NEWS' ? `section-sigNews-${s.id}` : `section-newsFlow-${s.id}`,
          label,
        })
        continue
      }
      if (kind === 'REFERENCE') {
        const refIndex = refList.findIndex((r) => r.id === s.id)
        if (refIndex >= 0) {
          items.push({
            id: `section-reference-${refIndex}`,
            label: String(s.fields?.title ?? '').trim() || `Reference ${refIndex + 1}`,
          })
        }
      }
      // if (kind === 'FOOTER') {
      //   items.push({ id: `section-footer-${s.id}`, label: 'Footer' })
      //   continue
      // }
    }
    return items
  }, [viewSnapshot, mode])

  /** 현재 모드에 맞는 앵커 항목 */
  const anchorItems = mode === NewsletterDetailPageMode.EDIT ? editAnchorItems : viewAnchorItems

  const { marketOpenTime, marketCloseTime } = getMarketTimes(effectiveSnapshot)
  const newsFlowChartData = useMemo(
    () => ({
      chartData: newsFlowProps.chartData,
      title: newsFlowProps.title,
      aggregationTime: newsFlowProps.aggregationTime,
    }),
    [newsFlowProps],
  )

  const enrichedNewsFlowItems = useMemo(
    () => enrichNewsFlowItemTimestamps(filterVisibleNewsFlowItems(newsFlowProps.newsEventItems)),
    [newsFlowProps.newsEventItems],
  )

  const snapshotBoxPositions = useMemo(() => getChartBoxPositions(effectiveSnapshot), [effectiveSnapshot])

  /** CAPTURE 등에서만 `EmailContent`로 전달. 편집 화면 차트는 `NewsFlowSection`만 사용 */
  let chartNode: ReactNode = null
  if (!suppressNewsFlowChartUi && (mode === NewsletterDetailPageMode.VIEW || mode === NewsletterDetailPageMode.REVISION)) {
    chartNode = (
      <InflectionPointChart
        chartData={newsFlowChartData}
        relatedNews={enrichedNewsFlowItems.filter((n) => n.visibility)}
        mode={mode}
        marketOpenTime={marketOpenTime}
        marketCloseTime={marketCloseTime}
        onChartImageReady={onMainChartImageReady}
        boxPositions={Object.keys(snapshotBoxPositions).length > 0 ? snapshotBoxPositions : undefined}
      />
    )
  }

  if (isIssueDetailLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (isIssueDetailError || !issueDetailSnapshot) {
    return <Navigate to={isIssueDetailError ? '/error/unknown' : '/error/404'} replace />
  }

  let fadeModeKey: 'edit' | 'revision' | 'view'
  let toolbarContent: ReactNode

  if (mode === NewsletterDetailPageMode.EDIT) {
    fadeModeKey = 'edit'
    toolbarContent = (
      <EditToolbar
        onReset={handleReset}
        onPreview={handlePreview}
        isPreviewDisabled={!effectiveSnapshot || !isReadyForEmail}
        isPreviewLoading={isPreviewLoading}
        showChartButton={!suppressNewsFlowChartUi}
        onChart={handleChart}
        onEndEdit={handleEndEdit}
        onSaveDraft={handleSaveDraft}
        onSave={handleSave}
        isSaving={isSaving}
        isSavingDraft={isSavingDraft}
        isSaveDisabled={!hasUnsavedChanges || !isEditSnapshotValid}
        saveDisabledDebugInfo={{
          hasUnsavedChanges,
          isEditSnapshotValid,
          validationIssues: editSaveValidation.issues,
        }}
        isChartActive={isChartModalOpen}
      />
    )
  } else if (mode === NewsletterDetailPageMode.REVISION) {
    fadeModeKey = 'revision'
    toolbarContent = (
      <RevisionToolbar
        versions={revisionVersions}
        isLoading={isRevisionLoading}
        selectedVersionId={selectedVersionId}
        onVersionChange={setSelectedVersionId}
        onEndRevision={() => setMode(NewsletterDetailPageMode.VIEW)}
      />
    )
  } else {
    fadeModeKey = 'view'
    toolbarContent = (
      <ViewToolbar
        snapshot={viewSnapshot}
        isScrolled={effectiveIsScrolled}
        newsletterIssues={newsletterIssues}
        publishedAt={detailMatchesRoute ? (issueDetailData?.publishedAt ?? null) : null}
        isNewsletterSubscribed={subscriptionStatus?.subscribed ?? false}
        isSubscriptionStatusLoading={isSubscriptionStatusLoading}
        onSubscribeToggle={handleSubscribeToggle}
        isSubscriptionMutating={isSubscribeMutating}
        onEditMode={handleEnterEditMode}
        onRevisionMode={() => setMode(NewsletterDetailPageMode.REVISION)}
        onDownloadImage={handleDownloadImage}
        onDownloadEml={handleDownloadEml}
        isDownloadingImage={isDownloadingImage}
        isDownloadDisabled={!viewSnapshot || !isReadyForEmailView}
        isChartImagePreparing={!!viewSnapshot && !isReadyForEmailView}
        editionMail={
          newsletterId && issueNo
            ? {
              newsletterId: Number(newsletterId),
              issueNo,
              defaultSubject: viewSnapshot ? (viewSnapshot.meta?.emailSubject ?? getTitleProps(viewSnapshot).title ?? '') : '',
              preparePayload: prepareShareEditionMailPayload,
              canSend: !!viewSnapshot && isReadyForEmailView,
            }
            : null
        }
      />
    )
  }

  return (
    <Stack position="relative">
      <Backdrop
        open={isEnteringEditMode}
        sx={(theme) => ({
          zIndex: theme.zIndex.modal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.common.white,
        })}
      >
        <Stack alignItems="center" gap={2}>
          <CircularProgress color="inherit" size={40} />
          <Typography variant="body2" sx={{ color: 'inherit' }}>
            편집 화면을 불러오는 중입니다…
          </Typography>
        </Stack>
      </Backdrop>
      <MISimpleConfirm
        open={isDraftLoadConfirmOpen}
        content={
          <Stack gap="4px">
            <Box>임시저장된 편집 내용이 있습니다.</Box>
            <Box>적용하시겠습니까?</Box>
          </Stack>
        }
        handleClose={() => resolveDraftLoadChoice(false)}
        width={400}
        actions={[
          {
            children: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => resolveDraftLoadChoice(false),
          },
          {
            children: '불러오기',
            variant: 'contained',
            color: 'primary',
            onClick: () => resolveDraftLoadChoice(true),
          },
        ]}
      />
      <MISimpleConfirm
        open={pendingLeaveAction !== null}
        disableClose={isSavingOnLeave}
        content={
          <Stack gap="4px">
            <Box>저장하지 않은 수정사항이 있습니다.</Box>
            <Box>임시저장 하시겠습니까?</Box>
          </Stack>
        }
        handleClose={handleLeaveEditCancel}
        width={460}
        actions={[
          {
            children: '취소',
            variant: 'outlined',
            color: 'secondary',
            onClick: handleLeaveEditCancel,
            disabled: isSavingOnLeave,
          },
          {
            children: '저장하지 않기',
            variant: 'outlined',
            color: 'secondary',
            onClick: handleLeaveEditDiscard,
            disabled: isSavingOnLeave,
          },
          {
            children: '임시저장',
            variant: 'contained',
            color: 'primary',
            onClick: handleLeaveEditSaveDraft,
            disabled: isSavingOnLeave,
          },
        ]}
      />
      <Box
        position="sticky"
        top={70}
        zIndex={200}
        sx={{
          overflow: 'hidden',
          transition: 'box-shadow 0.3s ease-in-out',
          boxShadow:
            mode === NewsletterDetailPageMode.EDIT || mode === NewsletterDetailPageMode.REVISION || effectiveIsScrolled
              ? '0 2px 8px rgba(0,0,0,0.06)'
              : 'none',
        }}
      >
        <Fade in appear timeout={{ enter: 480, exit: 480 }} key={fadeModeKey}>
          <Box>{toolbarContent}</Box>
        </Fade>
      </Box>
      <Box sx={{ pt: '38px', pb: '12px', marginBottom: '20px' }}>
        <Box sx={{ position: 'relative', width: 800, margin: '0 auto' }}>
          <Stack justifyContent="space-between" width={800}>
            {mode === NewsletterDetailPageMode.VIEW && (
              <div>
                <NewsletterView
                  snapshot={viewSnapshot}
                  isScrolled={effectiveIsScrolled}
                  onMainChartImageReady={onMainChartImageReady}
                  referenceChartImages={referenceChartImages}
                  onReferenceChartImageReady={onReferenceChartImageReady}
                  onCoverImageReady={onCoverImageReady}
                  onOilPriceRowImageReady={onOilPriceRowImageReady}
                />
              </div>
            )}
            {mode === NewsletterDetailPageMode.REVISION && (
              <DiffViewer
                newsletterId={newsletterId}
                issueNo={issueNo}
                revisionId={issueRevisionId}
                revisionVersions={revisionVersions}
                selectedVersionId={selectedVersionId}
                comparisonTarget={comparisonTarget}
                isScrolled={false}
                onMainChartImageReady={onMainChartImageReady}
                referenceChartImages={referenceChartImages}
                onReferenceChartImageReady={onReferenceChartImageReady}
                onCoverImageReady={onCoverImageReady}
                onOilPriceRowImageReady={onOilPriceRowImageReady}
                fallbackSnapshot={effectiveSnapshot}
              />
            )}
            {mode === NewsletterDetailPageMode.EDIT && (
              <OilPriceRowEmailCapture snapshot={effectiveSnapshot} onOilPriceRowImageReady={onOilPriceRowImageReady} />
            )}
            {mode === NewsletterDetailPageMode.EDIT && (
              <NewsletterEdit
                snapshot={effectiveSnapshot}
                validationIssues={editSaveValidation.issues}
                onMainChartImageReady={onMainChartImageReady}
                onRelatedNewsChange={handleRelatedNewsChange}
                onReferencesChange={handleReferencesChange}
                onReferenceChartImageReady={onReferenceChartImageReady}
                onTitleChange={handleTitleChange}
                onSubtitleChange={handleSubtitleChange}
                onPriceChangeFromChange={handlePriceChangeFromChange}
                onPriceChangeToChange={handlePriceChangeToChange}
                onSummaryChange={handleSummaryChange}
                onNameChange={handleNameChange}
                onDescriptionChange={handleDescriptionChange}
                onCoverShowImageChange={handleCoverShowImageChange}
                onNewsFlowTitleChange={handleNewsFlowTitleChange}
                onNewsFlowAggregationTimeChange={handleNewsFlowAggregationTimeChange}
                onSnapshotReorder={handleSnapshotReorder}
                onFooterContentChange={handleFooterContentChange}
                onFooterShowLogoChange={handleFooterShowLogoChange}
                onSectionVisibilityChange={handleSectionVisibilityChange}
                onBoxPositionDragEnd={flushChartBoxPositionsToSnapshot}
                flowChartEditModalOpen={isChartModalOpen}
              />
            )}
            {mode === NewsletterDetailPageMode.CAPTURE && (
              <>
                <OilPriceRowEmailCapture snapshot={effectiveSnapshot} onOilPriceRowImageReady={onOilPriceRowImageReady} />
                <EmailContent
                  snapshot={effectiveSnapshot}
                  chartNode={chartNode}
                  referenceChartImages={referenceChartImages}
                  onReferenceChartImageReady={onReferenceChartImageReady}
                  useLiveChart
                  coverImage={coverImage || undefined}
                />
              </>
            )}
          </Stack>
          {(mode === NewsletterDetailPageMode.VIEW ||
            mode === NewsletterDetailPageMode.REVISION ||
            mode === NewsletterDetailPageMode.EDIT) &&
            (anchorItems.length > 0 || mode === NewsletterDetailPageMode.REVISION) && (
            <Box
              sx={{
                position: 'absolute',
                left: '100%',
                top: 0,
                bottom: 0,
                marginLeft: '10px',
              }}
            >
              <AnchorNavigation
                items={anchorItems}
                newsletterTitle={
                  mode === NewsletterDetailPageMode.EDIT || mode === NewsletterDetailPageMode.REVISION
                    ? undefined
                    : getTitleProps(viewSnapshot).title
                }
                isScrolled={effectiveIsScrolled}
                onPrepareScroll={() => setForceScrolled(true)}
                onScrollComplete={() => setForceScrolled(null)}
                stickyTop={mode === NewsletterDetailPageMode.EDIT || mode === NewsletterDetailPageMode.REVISION ? 180 : 170}
                scrolledOffset={mode === NewsletterDetailPageMode.EDIT || mode === NewsletterDetailPageMode.REVISION ? 184 : 154}
                unscrolledOffset={mode === NewsletterDetailPageMode.EDIT || mode === NewsletterDetailPageMode.REVISION ? 220 : 360}
                revisionSection={
                  mode === NewsletterDetailPageMode.REVISION
                    ? {
                      versions: revisionVersions,
                      selectedVersionId,
                      onVersionChange: setSelectedVersionId,
                      comparisonTarget,
                      onComparisonTargetChange: setComparisonTarget,
                    }
                    : undefined
                }
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* 차트 편집 모달 - EDIT 모드에서 차트 버튼 클릭 시 */}
      {mode === NewsletterDetailPageMode.EDIT && !suppressNewsFlowChartUi && (
        <ChartEditModal
          open={isChartModalOpen}
          onClose={handleChartModalClose}
          anchorEl={chartAnchorElRef.current}
          chartData={newsFlowChartData}
          relatedNews={enrichedNewsFlowItems}
          marketOpenTime={marketOpenTime}
          marketCloseTime={marketCloseTime}
          onChartImageReady={onMainChartImageReady}
          onBoxPositionDragEnd={flushChartBoxPositionsToSnapshot}
        />
      )}
    </Stack>
  )
}

export default NewsletterDetailPage
