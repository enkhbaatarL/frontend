import { Box, CircularProgress, Divider, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import UploadIcon from '@/components/common/icons/UploadIcon'
import WarningIconRed from '@/components/common/icons/WarningIconRed'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import MIFileUploadDropzone from '@/components/mi/MIFileUploadDropzone'
import MIMorphingPopup, { type MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import useSnackbar from '@/hooks/useSnackbar'
import {
  FUNDAMENTAL_UPLOAD_ACCEPT,
  FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH,
  FUNDAMENTAL_UPLOAD_GUIDE_TEXT,
  FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES,
  FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB,
  FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH,
  UPLOAD_FILE_REQUIRED_BODY,
  UPLOAD_FILE_REQUIRED_TITLE,
  getFundamentalModelFileKind,
  isFundamentalUploadExcelFile,
} from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'
import FundamentalModelSheetDataTable from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable'
import { getFundamentalModelSheetCatalog } from '@/pages/mi/fundamentalModel/components/sheetTemplates/fundamentalModelSheetCatalogMock'
import { sheetTableOrder } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTableOrder'
import {
  getSheetTableTemplates,
  getTemplateSheetNames,
  loadSheetTemplate,
  type FundamentalModelInputKind,
  type SheetTemplate,
  type SheetTemplateDraft,
  type SheetTemplateProps,
} from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'
import { summaryTemplateCoordinates } from '@/pages/mi/fundamentalModel/components/sheetTemplates/summaryTemplateCoordinates'
import { summaryTemplateDefinitions } from '@/pages/mi/fundamentalModel/components/sheetTemplates/summaryTemplateDefinitions'
import fundamentalModelCaseService, { type FundamentalModelCaseStatus } from '@/service/mi/fundamentalModel/case'
import { downloadFile } from '@/utils/file'

export interface FundamentalModelInputEditorPopupRef {
  open: () => void
}

interface FundamentalModelInputEditorPopupProps {
  children: ReactNode
  onCreated: (caseId: string, status: FundamentalModelCaseStatus) => void
  restrictColumnChangesToEnd?: boolean
}

interface InputFile {
  kind: FundamentalModelInputKind
  file: File
}

const inputKinds: ReadonlyArray<{ kind: FundamentalModelInputKind; label: string }> = [
  { kind: 'DEMAND', label: 'Demand' },
  { kind: 'SUPPLY', label: 'Supply' },
  { kind: 'TRADE', label: 'Trade' },
  { kind: 'OUTPUT', label: 'Output' },
]

const isUploadValidationError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false

  const status = error.response?.status
  const responseData = error.response?.data as { code?: string; message?: string } | undefined
  return (
    status === 400 || status === 422 || responseData?.code?.toUpperCase().includes('VALID') || responseData?.message?.includes('유효성')
  )
}

const FundamentalModelInputEditorPopup = forwardRef<FundamentalModelInputEditorPopupRef, FundamentalModelInputEditorPopupProps>(
  ({ children, onCreated, restrictColumnChangesToEnd = true }, ref) => {
    const queryClient = useQueryClient()
    const { data: sheetCatalog } = useQuery({
      queryKey: ['fundamentalModel', 'sheetCatalog', sheetTableOrder, summaryTemplateDefinitions, summaryTemplateCoordinates],
      queryFn: getFundamentalModelSheetCatalog,
      staleTime: Infinity,
    })
    const { showSnackbar } = useSnackbar()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const uploadTargetRef = useRef<FundamentalModelInputKind | undefined>(undefined)
    const templateRequestIdRef = useRef(0)
    const selectedTemplateByKindRef = useRef<Partial<Record<FundamentalModelInputKind, SheetTemplate>>>({})
    const draftStoreRef = useRef<WeakMap<File, Map<string, SheetTemplateDraft>>>(new WeakMap())
    const loadedSheetFilesRef = useRef<WeakSet<File>>(new WeakSet())
    const popupRef = useRef<MIMorphingPopupRef>(null)
    useImperativeHandle(ref, () => ({ open: () => popupRef.current?.open() }), [])
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [inputFiles, setInputFiles] = useState<InputFile[]>([])
    const [selectedKind, setSelectedKind] = useState<FundamentalModelInputKind>('DEMAND')
    const [selectedSheetName, setSelectedSheetName] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState<SheetTemplate>()
    const [SelectedTemplateComponent, setSelectedTemplateComponent] = useState<ComponentType<SheetTemplateProps>>()
    const [isTemplateLoading, setIsTemplateLoading] = useState(false)
    const [isSheetDataLoading, setIsSheetDataLoading] = useState(false)
    const [templateLoadError, setTemplateLoadError] = useState('')
    const [showTitleValidationError, setShowTitleValidationError] = useState(false)
    const [draftResetVersion, setDraftResetVersion] = useState(0)
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

    const sheetNames = useMemo(() => (sheetCatalog ? getTemplateSheetNames(sheetCatalog, selectedKind) : []), [selectedKind, sheetCatalog])
    const selectedTemplates = useMemo(
      () => (sheetCatalog && selectedSheetName ? getSheetTableTemplates(sheetCatalog, selectedKind, selectedSheetName) : []),
      [selectedKind, selectedSheetName, sheetCatalog],
    )
    const selectedFile = inputFiles.find((inputFile) => inputFile.kind === selectedKind)?.file
    const handleSheetDataLoadingChange = useCallback(
      (isLoading: boolean) => {
        setIsSheetDataLoading(isLoading)
        if (!isLoading && selectedFile) loadedSheetFilesRef.current.add(selectedFile)
      },
      [selectedFile],
    )
    const draftStore = draftStoreRef.current
    const selectedTemplateId = selectedTemplate?.id
    const selectedDraft = selectedFile && selectedTemplateId ? draftStore.get(selectedFile)?.get(selectedTemplateId) : undefined
    const regasSourceTemplate =
      selectedKind === 'SUPPLY' && selectedTemplate?.sheetName === 'RegasAdjustment'
        ? sheetCatalog &&
          getSheetTableTemplates(sheetCatalog, 'SUPPLY', 'BCRegasification').find(({ name }) => name === 'Annual Regas Capacity Baseline')
        : undefined
    const linkedSourceDraft = selectedFile && regasSourceTemplate ? draftStore.get(selectedFile)?.get(regasSourceTemplate.id) : undefined
    const saveDraft = useCallback(
      (draft: SheetTemplateDraft) => {
        if (!selectedFile || !selectedTemplateId) return
        let fileDrafts = draftStore.get(selectedFile)
        if (!fileDrafts) {
          fileDrafts = new Map()
          draftStore.set(selectedFile, fileDrafts)
        }
        fileDrafts.set(selectedTemplateId, draft)
      },
      [draftStore, selectedFile, selectedTemplateId],
    )
    const resetCurrentSheet = useCallback(() => {
      if (!selectedFile || !selectedTemplateId) return
      draftStore.get(selectedFile)?.delete(selectedTemplateId)
      setDraftResetVersion((version) => version + 1)
      setIsResetConfirmOpen(false)
    }, [draftStore, selectedFile, selectedTemplateId])
    const isSheetSwitchLoading = isTemplateLoading || isSheetDataLoading
    const areSheetChipsDisabled = !selectedFile || (isSheetSwitchLoading && !loadedSheetFilesRef.current.has(selectedFile))
    const hasAllFiles = inputKinds.every(({ kind }) => inputFiles.some((inputFile) => inputFile.kind === kind))

    const reset = useCallback(() => {
      templateRequestIdRef.current += 1
      selectedTemplateByKindRef.current = {}
      draftStoreRef.current = new WeakMap()
      loadedSheetFilesRef.current = new WeakSet()
      setTitle('')
      setDescription('')
      setInputFiles([])
      setSelectedKind('DEMAND')
      setSelectedSheetName('')
      setSelectedTemplate(undefined)
      setSelectedTemplateComponent(undefined)
      setIsTemplateLoading(false)
      setIsSheetDataLoading(false)
      setTemplateLoadError('')
      setShowTitleValidationError(false)
      setIsResetConfirmOpen(false)
    }, [])

    const handleClose = useCallback(() => popupRef.current?.close(), [])

    const openTemplate = useCallback((template: SheetTemplate) => {
      const requestId = ++templateRequestIdRef.current
      selectedTemplateByKindRef.current[template.kind] = template
      setSelectedTemplate(template)
      setSelectedTemplateComponent(undefined)
      setIsTemplateLoading(true)
      setIsSheetDataLoading(true)
      setTemplateLoadError('')
      void loadSheetTemplate(template)
        .then(({ default: TemplateComponent }) => {
          if (requestId === templateRequestIdRef.current) setSelectedTemplateComponent(() => TemplateComponent)
        })
        .catch(() => {
          if (requestId !== templateRequestIdRef.current) return
          setTemplateLoadError('템플릿을 불러오지 못했습니다.')
          setIsSheetDataLoading(false)
        })
        .finally(() => {
          if (requestId === templateRequestIdRef.current) setIsTemplateLoading(false)
        })
    }, [])

    const selectSheet = useCallback(
      (kind: FundamentalModelInputKind, sheetName: string) => {
        setSelectedSheetName(sheetName)
        const template = sheetCatalog && getSheetTableTemplates(sheetCatalog, kind, sheetName)[0]
        if (template) openTemplate(template)
      },
      [openTemplate, sheetCatalog],
    )

    const selectKind = useCallback(
      (kind: FundamentalModelInputKind) => {
        setSelectedKind(kind)
        const previousTemplate = sheetCatalog?.tables.find((template) => template.id === selectedTemplateByKindRef.current[kind]?.id)
        if (previousTemplate) {
          setSelectedSheetName(previousTemplate.sheetName)
          openTemplate(previousTemplate)
          return
        }
        const sheetName = sheetCatalog && getTemplateSheetNames(sheetCatalog, kind)[0]
        if (sheetName) selectSheet(kind, sheetName)
      },
      [openTemplate, selectSheet, sheetCatalog],
    )

    useEffect(() => {
      if (!sheetCatalog || !selectedFile) return
      const currentTemplate = sheetCatalog.tables.find((template) => template.id === selectedTemplate?.id && template.kind === selectedKind)
      if (!currentTemplate) {
        selectKind(selectedKind)
      } else if (currentTemplate !== selectedTemplate) {
        setSelectedSheetName(currentTemplate.sheetName)
        openTemplate(currentTemplate)
      }
    }, [openTemplate, selectedFile, selectedKind, selectedTemplate, selectKind, sheetCatalog])

    const addFiles = useCallback(
      (files: FileList | File[] | null, targetKind?: FundamentalModelInputKind) => {
        const incomingFiles = Array.from(files ?? [])
        if (!incomingFiles.length) return

        const nextFiles = [...inputFiles]
        let failureMessage = ''
        const addedKinds = new Set<FundamentalModelInputKind>()

        incomingFiles.forEach((file) => {
          if (!isFundamentalUploadExcelFile(file)) {
            failureMessage = `${file.name}은(는) Excel 파일이 아닙니다.`
            return
          }
          if (file.size > FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES) {
            failureMessage = `${file.name}은(는) ${FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB}MB를 초과합니다.`
            return
          }

          const kind = getFundamentalModelFileKind(file.name)
          if (!kind) {
            failureMessage = `${file.name}의 파일명에 Demand, Supply, Trade, Output 중 하나만 포함되어야 합니다.`
            return
          }
          if (targetKind && kind !== targetKind) {
            failureMessage = `${targetKind} 탭에는 파일명에 ${targetKind}이(가) 포함된 Excel 파일만 업로드할 수 있습니다. 선택한 파일: ${file.name}`
            return
          }

          const index = nextFiles.findIndex((inputFile) => inputFile.kind === kind)
          if (index >= 0) {
            if (nextFiles[index].file !== file) delete selectedTemplateByKindRef.current[kind]
            nextFiles[index] = { kind, file }
          } else nextFiles.push({ kind, file })
          addedKinds.add(kind)
        })

        if (addedKinds.size > 0) {
          setInputFiles(nextFiles)
          const firstTabWithAddedFile = inputKinds.find(({ kind }) => addedKinds.has(kind))
          if (firstTabWithAddedFile) selectKind(firstTabWithAddedFile.kind)
        }
        if (failureMessage) showSnackbar('파일 업로드가 실패했습니다.', { variant: 'error', body: failureMessage })
      },
      [inputFiles, selectKind, showSnackbar],
    )

    const handleTabFileUpload = useCallback((kind: FundamentalModelInputKind) => {
      uploadTargetRef.current = kind
      fileInputRef.current?.click()
    }, [])

    const { mutate: createCase, isPending: isCreateCasePending } = useMutation({
      mutationFn: fundamentalModelCaseService.createCase,
      onSuccess: (createdCase) => {
        void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'cases'] })
        onCreated(String(createdCase.caseId), createdCase.status)
        showSnackbar('파일 업로드가 완료되었습니다.', { variant: 'success' })
        handleClose()
      },
      onError: (error) => {
        showSnackbar(isUploadValidationError(error) ? '유효성 검사에 실패했습니다.' : '파일 업로드가 실패했습니다.', {
          variant: 'error',
          body: isUploadValidationError(error) ? '파일 내용을 확인해 주세요.' : undefined,
        })
      },
    })

    const handleSubmit = useCallback(() => {
      if (!title.trim()) {
        setShowTitleValidationError(true)
        return
      }
      if (!hasAllFiles) {
        showSnackbar(UPLOAD_FILE_REQUIRED_TITLE, { variant: 'error', body: UPLOAD_FILE_REQUIRED_BODY })
        return
      }
      createCase({ title, description, files: inputFiles.map((inputFile) => inputFile.file) })
    }, [createCase, description, hasAllFiles, inputFiles, showSnackbar, title])

    const editorHeight = inputFiles.length > 0 ? 'max(447px, calc(100dvh - 188px))' : '447px'
    const editorContent = (
      <Stack flex={1} minHeight={0} height={editorHeight} width="100%">
        <Stack padding="0 20px 20px" flexShrink={0}>
          <Stack gap="10px" padding="20px" borderRadius="8px" bgcolor="contentBG.Primaryactive">
            <Stack direction="row" alignItems="center" gap="12px">
              <Typography component="span" variant="body2SB14" color="contentText.Normal" flexShrink={0}>
                입력값 출처
              </Typography>
              <MISelectMenu
                variant="outlined"
                selected="EXCEL_UPLOAD"
                onSelected={() => undefined}
                items={[{ value: 'EXCEL_UPLOAD', label: '엑셀 업로드' }]}
                sx={{ width: '400px', height: '36px', borderRadius: '8px' }}
              />
            </Stack>

            <Stack direction="row" alignItems="flex-start" gap="30px" width="100%">
              <Stack width="476px" flexShrink={0} minWidth={0}>
                <Stack direction="row" alignItems="center" gap="12px">
                  <Stack direction="row" alignItems="center" width="64px" flexShrink={0}>
                    <Typography component="label" htmlFor="fundamental-model-title" variant="body2SB14" color="contentText.Normal" noWrap>
                      케이스명
                    </Typography>
                    <Box component="span" width="4px" height="4px" borderRadius="50%" bgcolor="point.red1" margin="0 0 8px 4px" />
                  </Stack>
                  <Box
                    id="fundamental-model-title"
                    component="input"
                    value={title}
                    maxLength={FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH}
                    placeholder="케이스명을 입력하세요 (예: 미국-이란 긴장 고조 시나리오)"
                    aria-invalid={showTitleValidationError}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setTitle(event.target.value)
                      setShowTitleValidationError(false)
                    }}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      height: '36px',
                      border: '1px solid',
                      borderColor: showTitleValidationError ? 'point.red1' : 'contentBorder.Normal',
                      borderRadius: '8px',
                      bgcolor: 'commonColor.White',
                      boxSizing: 'border-box',
                      color: 'contentText.Black',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      outline: 'none',
                      padding: '8px 12px',
                      '&::placeholder': { color: 'contentText.Placeholder', opacity: 1 },
                      '&:focus': { borderColor: showTitleValidationError ? 'point.red1' : 'contentBorder.Active' },
                    }}
                  />
                </Stack>
                <Stack direction="row" justifyContent="space-between" minHeight="18px" paddingTop="2px">
                  {showTitleValidationError && (
                    <Typography variant="body3R12" color="point.red1">
                      필수 입력 항목입니다.
                    </Typography>
                  )}
                  <Typography variant="body3R12" color="contentText.Subtext" marginLeft="auto">
                    {title.length} / {FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH}
                  </Typography>
                </Stack>
              </Stack>

              <Stack flex={1} minWidth={0}>
                <Stack direction="row" alignItems="center" gap="12px">
                  <Typography
                    component="label"
                    htmlFor="fundamental-model-description"
                    variant="body2SB14"
                    color="contentText.Normal"
                    flexShrink={0}
                  >
                    설명
                  </Typography>
                  <Box
                    id="fundamental-model-description"
                    component="input"
                    value={description}
                    maxLength={FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH}
                    placeholder="케이스에 대한 설명을 입력하세요 (선택)"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setDescription(event.target.value)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      height: '36px',
                      border: '1px solid',
                      borderColor: 'contentBorder.Normal',
                      borderRadius: '8px',
                      bgcolor: 'commonColor.White',
                      boxSizing: 'border-box',
                      color: 'contentText.Black',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      outline: 'none',
                      padding: '8px 12px',
                      '&::placeholder': { color: 'contentText.Placeholder', opacity: 1 },
                      '&:focus': { borderColor: 'contentBorder.Active' },
                    }}
                  />
                </Stack>
                <Stack direction="row" justifyContent="flex-end" minHeight="18px" paddingTop="2px">
                  <Typography variant="body3R12" color="contentText.Subtext">
                    {description.length} / {FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Stack>

        {inputFiles.length > 0 && !hasAllFiles && (
          <Stack padding="0 20px 20px" flexShrink={0}>
            <Stack
              direction="row"
              alignItems="center"
              gap="8px"
              minHeight="34px"
              padding="8px"
              border="1px solid"
              borderColor="contentBorder.Error"
              borderRadius="8px"
              bgcolor="#FFF9F9"
              boxSizing="border-box"
              role="alert"
            >
              <Stack direction="row" alignItems="center" gap="4px" flexShrink={0}>
                <WarningIconRed width="16px" height="16px" />
                <Typography component="span" fontSize="13px" fontWeight={600} lineHeight={1.4} color="contentText.Error">
                  {UPLOAD_FILE_REQUIRED_TITLE}
                </Typography>
              </Stack>
              <Divider orientation="vertical" flexItem sx={{ height: '8px', alignSelf: 'center', borderColor: 'contentBorder.Error' }} />
              <Typography component="span" fontSize="13px" lineHeight={1.4} color="contentText.Error">
                {UPLOAD_FILE_REQUIRED_BODY}
              </Typography>
            </Stack>
          </Stack>
        )}

        {inputFiles.length === 0 ? (
          <Stack flex={1} minHeight={0} padding="0 20px">
            <MIFileUploadDropzone
              accept={FUNDAMENTAL_UPLOAD_ACCEPT}
              guideText={FUNDAMENTAL_UPLOAD_GUIDE_TEXT}
              maxFileSizeMb={FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB}
              onFilesAdd={addFiles}
              sx={{ flex: 1, minHeight: '195px', borderRadius: '10px', padding: '40px 20px', marginBottom: '20px' }}
            />
          </Stack>
        ) : (
          <Stack flex={1} minHeight={0} overflow="hidden">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept={FUNDAMENTAL_UPLOAD_ACCEPT}
              onChange={(event) => {
                addFiles(event.target.files, uploadTargetRef.current)
                event.target.value = ''
              }}
            />
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              padding="0 24px"
              borderBottom="1px solid"
              borderColor="contentBorder.Normal"
              flexShrink={0}
            >
              <Tabs
                value={selectedKind}
                onChange={(_event, kind: FundamentalModelInputKind) => {
                  if (kind !== selectedKind && inputFiles.some((inputFile) => inputFile.kind === kind)) selectKind(kind)
                }}
                aria-label="수급모델 입력 파일"
                sx={{ minHeight: '54px', '& .MuiTabs-indicator': { height: '2px', bgcolor: 'commonColor.Black' } }}
              >
                {inputKinds.map(({ kind, label }) => {
                  const file = inputFiles.find((inputFile) => inputFile.kind === kind)?.file
                  return (
                    <Tab
                      key={kind}
                      value={kind}
                      label={
                        <Stack direction="row" alignItems="center" gap="8px">
                          <Typography
                            fontSize="16px"
                            fontWeight={selectedKind === kind ? 700 : 600}
                            lineHeight={1.4}
                            color={file ? 'contentText.Black' : 'contentText.Disabled'}
                          >
                            {label}
                          </Typography>
                          {!file && <UploadIcon width="20px" height="20px" />}
                        </Stack>
                      }
                      onClick={() => {
                        if (!file) handleTabFileUpload(kind)
                      }}
                      sx={{
                        minHeight: '54px',
                        minWidth: 0,
                        padding: '16px 20px',
                        textTransform: 'none',
                        color: file ? 'contentIcon.Activeb' : 'contentIcon.Disabled',
                      }}
                    />
                  )
                })}
              </Tabs>
              <MIBaseButton
                variant="outlined"
                prefix={<ChartDownloadIcon />}
                disabled={!selectedFile}
                onClick={() => {
                  if (selectedFile) downloadFile(selectedFile, selectedFile.name)
                }}
                sx={{ height: '36px', padding: '8px 10px 8px 6px', borderRadius: '8px', flexShrink: 0 }}
              >
                인풋 파일 다운로드
              </MIBaseButton>
            </Stack>

            <Stack flex={1} minHeight={0} overflow="hidden">
              <Stack padding="10px 20px" bgcolor="gray.10" borderBottom="1px solid" borderColor="contentBorder.Normal" flexShrink={0}>
                <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
                  {sheetNames.map((sheetName) => (
                    <MIBaseButton
                      key={sheetName}
                      variant="outlined"
                      disabled={areSheetChipsDisabled || selectedSheetName === sheetName}
                      aria-disabled={areSheetChipsDisabled || selectedSheetName === sheetName}
                      onClick={() => selectSheet(selectedKind, sheetName)}
                      sx={{
                        maxWidth: '260px',
                        minWidth: 0,
                        flexShrink: 0,
                        height: '32px',
                        padding: '6px 10px',
                        borderRadius: '100px',
                        bgcolor: areSheetChipsDisabled
                          ? 'contentBG.Disabled'
                          : selectedSheetName === sheetName
                            ? 'contentBG.PrimaryFade'
                            : 'commonColor.White',
                        borderColor: areSheetChipsDisabled
                          ? 'contentBorder.Disabled'
                          : selectedSheetName === sheetName
                            ? 'contentBorder.Primaryactive'
                            : 'contentBorder.Normal',
                        '&.Mui-disabled':
                          selectedSheetName === sheetName && !areSheetChipsDisabled
                            ? { bgcolor: 'contentBG.PrimaryFade', borderColor: 'contentBorder.Primaryactive' }
                            : undefined,
                      }}
                    >
                      <Typography
                        variant={selectedSheetName === sheetName ? 'body2SB14' : 'body2M14'}
                        color={areSheetChipsDisabled ? 'contentText.Disabled' : 'contentText.Normal'}
                        noWrap
                      >
                        {sheetName}
                      </Typography>
                    </MIBaseButton>
                  ))}
                </HorizontalScrollContainer>
              </Stack>
              <Stack padding="12px 20px" bgcolor="gray.5" borderBottom="1px solid" borderColor="contentBorder.Normal" flexShrink={0}>
                <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
                  {selectedTemplates.map((template) => (
                    <MIBaseButton
                      key={template.id}
                      variant="outlined"
                      disabled={areSheetChipsDisabled || selectedTemplate?.id === template.id}
                      aria-disabled={areSheetChipsDisabled || selectedTemplate?.id === template.id}
                      onClick={() => openTemplate(template)}
                      sx={{
                        maxWidth: '260px',
                        minWidth: '0px',
                        flexShrink: 0,
                        height: '28px',
                        padding: '6px 10px',
                        borderRadius: '100px',
                        bgcolor: areSheetChipsDisabled
                          ? 'contentBG.Disabled'
                          : selectedTemplate?.id === template.id
                            ? 'contentBG.PrimaryFade'
                            : 'commonColor.White',
                        borderColor: areSheetChipsDisabled
                          ? 'contentBorder.Disabled'
                          : selectedTemplate?.id === template.id
                            ? 'contentBorder.Primaryactive'
                            : 'contentBorder.Normal',
                        '&.Mui-disabled':
                          selectedTemplate?.id === template.id && !areSheetChipsDisabled
                            ? { bgcolor: 'contentBG.PrimaryFade', borderColor: 'contentBorder.Primaryactive' }
                            : undefined,
                        '&:hover:not(:disabled)': {
                          bgcolor: selectedTemplate?.id === template.id ? 'contentBG.PrimaryFade' : 'contentBG.Active',
                          borderColor: selectedTemplate?.id === template.id ? 'contentBorder.Primaryactive' : 'contentBorder.Normal',
                        },
                      }}
                    >
                      <Typography
                        variant={selectedTemplate?.id === template.id ? 'body2SB14' : 'body2M14'}
                        color={
                          areSheetChipsDisabled
                            ? 'contentText.Disabled'
                            : selectedTemplate?.id === template.id
                              ? 'contentText.Black'
                              : 'contentText.Normal'
                        }
                        noWrap
                      >
                        {template.name}
                      </Typography>
                    </MIBaseButton>
                  ))}
                </HorizontalScrollContainer>
              </Stack>
              <Stack flex={1} minWidth={0} minHeight={0} padding="20px" bgcolor="gray.5">
                {selectedFile ? (
                  <Stack direction="row" flex={1} minWidth={0} minHeight={0}>
                    <Stack flex={1} minWidth={0} minHeight={0}>
                      <Stack
                        flex={1}
                        minWidth={0}
                        minHeight={0}
                        border="1px solid"
                        borderColor="contentBorder.Normal"
                        borderRadius="10px"
                        overflow="hidden"
                        bgcolor="commonColor.White"
                      >
                        {selectedTemplate && !isTemplateLoading && !templateLoadError && (
                          <FundamentalModelSheetDataTable
                            file={selectedFile}
                            sheetName={selectedTemplate.sheetName}
                            linkedSourceSheetName={regasSourceTemplate?.sheetName}
                            onLoadingChange={handleSheetDataLoadingChange}
                          >
                            {(data, linkedSourceData) =>
                              SelectedTemplateComponent ? (
                                <SelectedTemplateComponent
                                  key={`${selectedTemplate.id}:${draftResetVersion}`}
                                  data={data}
                                  restrictColumnChangesToEnd={restrictColumnChangesToEnd}
                                  draft={selectedDraft}
                                  linkedSourceDraft={linkedSourceDraft}
                                  linkedSourceData={linkedSourceData}
                                  onDraftChange={saveDraft}
                                />
                              ) : (
                                <Box component="pre">{JSON.stringify(data, null, 2)}</Box>
                              )
                            }
                          </FundamentalModelSheetDataTable>
                        )}
                        {isTemplateLoading && (
                          <Stack flex={1} alignItems="center" justifyContent="center" role="status" aria-label="템플릿 로딩 중">
                            <CircularProgress size={24} thickness={4} sx={{ color: 'contentIcon.ActiveSecondary' }} />
                          </Stack>
                        )}
                        {templateLoadError && (
                          <Stack flex={1} alignItems="center" justifyContent="center">
                            <Typography variant="body2M14" color="point.red1">
                              {templateLoadError}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack flex={1} alignItems="center" justifyContent="center" gap="12px">
                    <Typography variant="body2SB14" color="contentText.Normal">
                      {selectedKind} 파일을 업로드하세요.
                    </Typography>
                    <MIBaseButton variant="outlined" prefix={<UploadIcon />} onClick={() => handleTabFileUpload(selectedKind)}>
                      파일 추가
                    </MIBaseButton>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Stack>
        )}

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          height="64px"
          minHeight="64px"
          padding="12px 20px"
          borderTop="1px solid"
          borderColor="contentBorder.Normal"
          boxSizing="border-box"
          flexShrink={0}
        >
          <MIBaseButton
            variant="outlined"
            disabled={isCreateCasePending || !selectedFile || !selectedTemplate || isTemplateLoading || isSheetDataLoading}
            onClick={() => setIsResetConfirmOpen(true)}
            sx={{ height: '36px', padding: '8px 10px', borderRadius: '8px' }}
          >
            초기화
          </MIBaseButton>
          <MIBaseButton
            variant="contained"
            disabled={isCreateCasePending || !title.trim() || !hasAllFiles}
            onClick={handleSubmit}
            sx={{ height: '36px', padding: '8px 10px', borderRadius: '8px' }}
          >
            {isCreateCasePending ? '업로드 중...' : 'MI 수급모델 실행'}
          </MIBaseButton>
        </Stack>
      </Stack>
    )

    return (
      <>
        <MIMorphingPopup
          ref={popupRef}
          display="inline-flex"
          onClick={() => popupRef.current?.open()}
          popup={{
            title: 'MI 수급모델 실행',
            hideHeaderLine: true,
            content: editorContent,
            measureContent: <Box height={editorHeight} />,
            showSkeleton: false,
            minWidth: Math.min(1376, window.innerWidth - 32),
            maxWidth: Number.POSITIVE_INFINITY,
            useInternalScroll: true,
            closeOnBackdropClick: false,
            hideCloseButton: isCreateCasePending,
            onOpen: reset,
            onClose: reset,
          }}
        >
          {children}
        </MIMorphingPopup>
        {isCreateCasePending && createPortal(<Box position="fixed" zIndex={1301} sx={{ inset: 0 }} />, document.body)}
        <MIConfirm
          open={isResetConfirmOpen}
          title="현재 화면 초기화"
          width="480px"
          zIndex={1402}
          handleClose={() => setIsResetConfirmOpen(false)}
          actions={[
            { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setIsResetConfirmOpen(false) },
            { label: '초기화', variant: 'filled', color: 'red', onClick: resetCurrentSheet },
          ]}
        >
          현재 화면의 모든 변경 사항이 초기화됩니다. 다른 항목에는 적용되지 않으며, 초기화 후에는 복구할 수 없습니다. 계속하시겠습니까?
        </MIConfirm>
      </>
    )
  },
)

FundamentalModelInputEditorPopup.displayName = 'FundamentalModelInputEditorPopup'

export default FundamentalModelInputEditorPopup
