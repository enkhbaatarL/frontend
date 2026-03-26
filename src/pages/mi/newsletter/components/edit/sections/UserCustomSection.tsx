import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'

import type { INewsletterSnapshotBlock, INewsletterSnapshotSection } from '@/service/mi/newsletter'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIMaskInput from '@/components/common/input/MIMaskInput'
import useSnackbar from '@/hooks/useSnackbar'
import ReferenceChart from '@/pages/mi/newsletter/components/chart/ReferenceChart'
import AddBlockModal from '@/pages/mi/newsletter/components/edit/AddBlockModal'
import AddSectionModal from '@/pages/mi/newsletter/components/edit/AddSectionModal'
import Block, { type BlockOrderProps } from '@/pages/mi/newsletter/components/edit/sections/Block'
import ReferenceTable from '@/pages/mi/newsletter/components/emailTemplate/ReferenceTable'
import {
  createReferenceContentBlock,
  createUserCustomSnapshotSection,
  fullInsertIndexForVisibleBlockTarget,
  getBlockFields,
  getEffectiveFieldDef,
  getReferenceContentBlocks,
  isReferenceBlockRemoved,
  type ReferenceContentBlockPatch,
} from '@/pages/mi/newsletter/utils/snapshotUtils'

export const USER_CUSTOM_SECTION_HEADER_LABEL = 'Section'

const MAX_CUSTOM_SECTION_IMAGE_BYTES = 5 * 1024 * 1024
/** {@link NewsFormFields} 뉴스 제목·내용과 동일 */
const BLOCK_TITLE_MAX = 100
const BLOCK_CONTENT_MAX = 1000
const ALLOWED_CUSTOM_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export type UserCustomSectionProps = {
  section: INewsletterSnapshotSection
  refIndex: number
  blockOrder?: BlockOrderProps
  siblingIds?: string[]
  onOrderChange?: (targetIndex: number) => void
  marketOpenTime?: number
  marketCloseTime?: number
  onSectionFieldsChange: (partial: { title?: string; description?: string }) => void
  onSectionVisibilityChange?: (visible: boolean) => void
  onDelete?: () => void
  onBlockPatch: (contentBlockIndex: number, patch: ReferenceContentBlockPatch) => void
  onBlockItemDelete?: (contentBlockIndex: number) => void
  onBlockItemOrderChange: (fromIndex: number, targetIndex: number) => void
  onChartImageReady?: (flatChartIndex: number, image: string) => void
  getFlatChartIndex: (contentBlockIndex: number) => number
  onAppendContentBlock?: (block: INewsletterSnapshotBlock) => void
}

const chartViewFromBlock = (block: INewsletterSnapshotBlock) => {
  const c = getBlockFields<{
    timestamps?: number[]
    series?: {
      seriesId: string
      label: string
      renderAs: string
      values: number[]
      isVisible: boolean
    }[]
  }>(block)
  const series = (c?.series ?? []).map((s) => ({ ...s, isLineChartDashStyle: null as string | null }))
  return {
    timestamps: c?.timestamps ?? [],
    series,
  }
}

const tableViewFromBlock = (block: INewsletterSnapshotBlock) => {
  const c = getBlockFields<{
    tableData?: {
      tableId?: string | null
      headers?: { field: string; name: string }[]
      rows?: { cells: string[] }[]
    }
  }>(block)
  const td = c?.tableData
  return {
    tableId: String(td?.tableId ?? ''),
    headers: td?.headers ?? [],
    rows: td?.rows ?? [],
  }
}

const contentFromBlock = (block: INewsletterSnapshotBlock) => getBlockFields<{ content?: string }>(block)?.content ?? ''

/** 사용자가 추가한 뉴스레터 섹션 전용 편집 UI. */
export const UserCustomSection = ({
  section,
  refIndex,
  blockOrder,
  siblingIds = [],
  onOrderChange,
  marketOpenTime,
  marketCloseTime,
  onSectionFieldsChange,
  onSectionVisibilityChange,
  onDelete,
  onBlockPatch,
  onBlockItemDelete,
  onBlockItemOrderChange,
  onChartImageReady,
  getFlatChartIndex,
  onAppendContentBlock,
}: UserCustomSectionProps) => {
  const { showSnackbar } = useSnackbar()
  const [addBlockOpen, setAddBlockOpen] = useState(false)
  const contentBlocks = useMemo(() => getReferenceContentBlocks(section), [section])
  const visibleBlockEntries = useMemo(
    () => contentBlocks.map((block, itemIndex) => ({ block, itemIndex })).filter(({ block: b }) => !isReferenceBlockRemoved(b)),
    [contentBlocks],
  )
  const order = blockOrder ?? {
    siblingIds,
    currentId: String(refIndex),
    onOrderChange: onOrderChange ?? (() => {}),
  }

  const sf = section.fields ?? {}
  const title = String(sf.title ?? '')
  const description = String(sf.description ?? '')
  const dTitle = getEffectiveFieldDef(section.fieldDefs, 'title')
  const dDesc = getEffectiveFieldDef(section.fieldDefs, 'description')

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>, itemIndex: number) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED_CUSTOM_IMAGE_TYPES.has(file.type)) {
      showSnackbar('JPG, PNG, GIF, WEBP 형식만 업로드할 수 있습니다.', { variant: 'warning' })
      return
    }
    if (file.size > MAX_CUSTOM_SECTION_IMAGE_BYTES) {
      showSnackbar('이미지 크기는 5MB 이하여야 합니다.', { variant: 'warning' })
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      onBlockPatch(itemIndex, { imageBase64: dataUrl, fileName: file.name })
      showSnackbar('이미지가 적용되었습니다.', { variant: 'success' })
    } catch {
      showSnackbar('이미지를 읽는 데 실패했습니다.', { variant: 'error' })
    }
  }

  return (
    <Block
      key={section.id}
      label={USER_CUSTOM_SECTION_HEADER_LABEL}
      order={order}
      onDelete={onDelete}
      collapsedPreview={title || undefined}
      visibility={section.visibility !== false}
      onVisibilityChange={onSectionVisibilityChange}
    >
      <Stack gap="12px">
        <MIMaskInput
          label="섹션 제목"
          placeholder="섹션 제목 입력"
          value={title}
          onUpdateValue={(v) => onSectionFieldsChange({ title: v ?? '' })}
          maxLength={100}
          required={dTitle.required}
          disabled={dTitle.disabled}
        />
        <MIMaskInput
          label="섹션 부제"
          placeholder="섹션 부제 입력"
          value={description}
          onUpdateValue={(v) => onSectionFieldsChange({ description: v ?? '' })}
          multiline
          minRows={1}
          maxRows={4}
          maxLength={500}
          required={dDesc.required}
          disabled={dDesc.disabled}
        />

        <Stack pt="12px" gap="12px">
          {visibleBlockEntries.map(({ block, itemIndex }) => {
            const chartData = block.type === 'CHART' ? chartViewFromBlock(block) : null
            const tableData = block.type === 'TABLE' ? tableViewFromBlock(block) : null
            return (
              <Block
                key={block.id}
                label="Block"
                order={{
                  siblingIds: visibleBlockEntries.map((e) => e.block.id),
                  currentId: block.id,
                  onOrderChange: (targetVisibleIndex) => {
                    const without = [...contentBlocks]
                    without.splice(itemIndex, 1)
                    const insertAt = fullInsertIndexForVisibleBlockTarget(without, targetVisibleIndex)
                    onBlockItemOrderChange(itemIndex, insertAt)
                  },
                }}
                onDelete={onBlockItemDelete ? () => onBlockItemDelete(itemIndex) : undefined}
                visibility={block.visibility !== false}
                onVisibilityChange={(v) => onBlockPatch(itemIndex, { visibility: v })}
              >
                <Stack gap="12px">
                  {block.type === 'CHART' && chartData && (
                    <Box borderRadius="12px" bgcolor="commonColor.White" py="6px" sx={{ overflow: 'hidden' }}>
                      <ReferenceChart
                        chartData={chartData}
                        marketOpenTime={marketOpenTime}
                        marketCloseTime={marketCloseTime}
                        onChartImageReady={onChartImageReady ? (img) => onChartImageReady(getFlatChartIndex(itemIndex), img) : undefined}
                      />
                    </Box>
                  )}

                  {block.type === 'TABLE' && tableData && (
                    <Box pb="12px">
                      {tableData.headers?.length || tableData.rows?.length ? (
                        <ReferenceTable tableData={tableData} />
                      ) : (
                        <Typography variant="body3" color="contentText.Disabled">
                          표 데이터가 없습니다.
                        </Typography>
                      )}
                    </Box>
                  )}

                  {block.type === 'TEXT' && (
                    <Stack gap="12px">
                      <MIMaskInput
                        label="제목"
                        placeholder="제목 입력"
                        value={String(block.title ?? '')}
                        onUpdateValue={(v: string | undefined) => onBlockPatch(itemIndex, { title: v ?? '' })}
                        maxLength={BLOCK_TITLE_MAX}
                        required
                      />
                      <MIMaskInput
                        label="내용"
                        placeholder="내용 입력"
                        value={contentFromBlock(block)}
                        onUpdateValue={(v: string | undefined) => onBlockPatch(itemIndex, { content: v ?? '' })}
                        multiline
                        rows={6}
                        maxLength={BLOCK_CONTENT_MAX}
                      />
                    </Stack>
                  )}

                  {block.type === 'IMAGE' &&
                    (() => {
                      const im = getBlockFields<{ imageBase64?: string; fileName?: string }>(block)
                      const imageBase64 = String(im?.imageBase64 ?? '')
                      const fileName = String(im?.fileName ?? '')
                      const inputId = `user-custom-image-${block.id}`
                      return (
                        <Stack gap="12px">
                          <MIMaskInput
                            label="제목"
                            placeholder="제목 입력"
                            value={String(block.title ?? '')}
                            onUpdateValue={(v: string | undefined) => onBlockPatch(itemIndex, { title: v ?? '' })}
                            maxLength={BLOCK_TITLE_MAX}
                            required
                          />
                          {imageBase64 ? (
                            <Box
                              component="img"
                              src={imageBase64}
                              alt=""
                              sx={{ maxWidth: '100%', maxHeight: 280, borderRadius: '8px', objectFit: 'contain' }}
                            />
                          ) : null}
                          <input
                            id={inputId}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            hidden
                            onChange={(ev) => handleImageFile(ev, itemIndex)}
                          />
                          <Stack direction="row" alignItems="center" gap="12px" flexWrap="wrap">
                            <Box component="label" htmlFor={inputId} sx={{ cursor: 'pointer', display: 'inline-flex' }}>
                              <MIBaseButton
                                component="span"
                                variant="outlined"
                                tabIndex={-1}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  pointerEvents: 'none',
                                }}
                              >
                                이미지 선택
                              </MIBaseButton>
                            </Box>
                            {fileName ? (
                              <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body3" color="contentText.Normal" noWrap title={fileName}>
                                  {fileName}
                                </Typography>
                                <MIBaseButton
                                  variant="text"
                                  enableHoverBackground
                                  onClick={() => onBlockPatch(itemIndex, { imageBase64: '', fileName: '' })}
                                  sx={{ flexShrink: 0, p: '6px' }}
                                  aria-label="이미지 제거"
                                >
                                  <DeleteOutlineRounded fontSize="small" />
                                </MIBaseButton>
                              </Stack>
                            ) : (
                              <Typography variant="body3" color="contentText.Disabled">
                                파일을 선택하세요 (최대 5MB)
                              </Typography>
                            )}
                          </Stack>
                          <MIMaskInput
                            label="내용"
                            placeholder="내용 입력"
                            value={contentFromBlock(block)}
                            onUpdateValue={(v: string | undefined) => onBlockPatch(itemIndex, { content: v ?? '' })}
                            multiline
                            rows={6}
                            maxLength={BLOCK_CONTENT_MAX}
                          />
                        </Stack>
                      )
                    })()}

                  {(block.type === 'CHART' || block.type === 'TABLE') && (
                    <MIMaskInput
                      label="내용"
                      placeholder="내용 입력"
                      value={contentFromBlock(block)}
                      onUpdateValue={(v: string | undefined) => onBlockPatch(itemIndex, { content: v ?? '' })}
                      multiline
                      rows={6}
                      maxLength={BLOCK_CONTENT_MAX}
                    />
                  )}
                </Stack>
              </Block>
            )
          })}
        </Stack>

        {typeof onAppendContentBlock === 'function' ? (
          <>
            <AddBlockModal
              open={addBlockOpen}
              onClose={() => setAddBlockOpen(false)}
              onAdd={(payload) => {
                const block = createReferenceContentBlock(payload.kind, {
                  title: payload.title,
                  content: payload.content,
                  imageBase64: payload.imageBase64,
                  fileName: payload.fileName,
                })
                onAppendContentBlock(block)
                showSnackbar('블록이 추가되었습니다.', { variant: 'success' })
              }}
            />
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setAddBlockOpen(true)}
              startIcon={<AddIcon sx={{ fontSize: 20 }} />}
              sx={{
                py: '7px',
                px: 2,
                borderRadius: '4px',
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.4,
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: 'commonColor.White',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'commonColor.White',
                },
              }}
            >
              블록 추가
            </Button>
          </>
        ) : null}
      </Stack>
    </Block>
  )
}

export type UserCustomSectionAddToolbarProps = {
  enabled: boolean
  referenceSections: INewsletterSnapshotSection[]
  onReplaceReferenceSections: (next: INewsletterSnapshotSection[]) => void
}

export const UserCustomSectionAddToolbar = ({
  enabled,
  referenceSections,
  onReplaceReferenceSections,
}: UserCustomSectionAddToolbarProps) => {
  const { showSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)

  const handleAdd = useCallback(
    (title: string, subtitle: string) => {
      const ordinal = referenceSections.length + 1
      const newSection = createUserCustomSnapshotSection(ordinal, title, subtitle)
      onReplaceReferenceSections([...referenceSections, newSection])
      showSnackbar('섹션이 추가되었습니다.', { variant: 'success' })
    },
    [referenceSections, onReplaceReferenceSections, showSnackbar],
  )

  if (!enabled) return null

  return (
    <>
      <AddSectionModal open={open} onClose={() => setOpen(false)} onAdd={handleAdd} />
      <Button
        fullWidth
        variant="outlined"
        onClick={() => setOpen(true)}
        startIcon={<AddIcon sx={{ fontSize: 20 }} />}
        sx={{
          py: '7px',
          px: 2,
          borderRadius: '4px',
          textTransform: 'none',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.4,
          borderColor: 'primary.main',
          color: 'primary.main',
          bgcolor: 'commonColor.White',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'commonColor.White',
          },
        }}
      >
        섹션 추가
      </Button>
    </>
  )
}

export default UserCustomSection
