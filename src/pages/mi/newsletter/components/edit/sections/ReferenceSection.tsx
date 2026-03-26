import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'

import Block, { type BlockOrderProps } from './Block'

import type { INewsletterSnapshotBlock, INewsletterSnapshotSection } from '@/service/mi/newsletter'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIMaskInput from '@/components/common/input/MIMaskInput'
import useSnackbar from '@/hooks/useSnackbar'
import ReferenceChart from '@/pages/mi/newsletter/components/chart/ReferenceChart'
import ReferenceTable from '@/pages/mi/newsletter/components/emailTemplate/ReferenceTable'
import {
  fullInsertIndexForVisibleBlockTarget,
  getBlockFields,
  getEffectiveFieldDef,
  getReferenceContentBlocks,
  isReferenceBlockRemoved,
  type ReferenceContentBlockPatch,
} from '@/pages/mi/newsletter/utils/snapshotUtils'

const MAX_REFERENCE_IMAGE_BYTES = 5 * 1024 * 1024
const BLOCK_TITLE_MAX = 100
const ALLOWED_REFERENCE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export type ReferenceSectionProps = {
  section: INewsletterSnapshotSection
  refIndex: number
  blockOrder?: BlockOrderProps
  siblingIds?: string[]
  onOrderChange?: (targetIndex: number) => void
  marketOpenTime?: number
  marketCloseTime?: number
  onSectionFieldsChange: (partial: { title?: string; description?: string }) => void
  onSectionVisibilityChange?: (visible: boolean) => void
  onBlockPatch: (contentBlockIndex: number, patch: ReferenceContentBlockPatch) => void
  onBlockItemDelete?: (contentBlockIndex: number) => void
  onBlockItemOrderChange: (fromIndex: number, targetIndex: number) => void
  onChartImageReady?: (flatChartIndex: number, image: string) => void
  getFlatChartIndex: (contentBlockIndex: number) => number
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

/** API·템플릿 기준 참고(Reference) 섹션 편집. 사용자 «섹션 추가» 섹션은 `UserCustomSection` 사용. */
const ReferenceSection = ({
  section,
  refIndex,
  blockOrder,
  siblingIds = [],
  onOrderChange,
  marketOpenTime,
  marketCloseTime,
  onSectionFieldsChange,
  onSectionVisibilityChange,
  onBlockPatch,
  onBlockItemDelete,
  onBlockItemOrderChange,
  onChartImageReady,
  getFlatChartIndex,
}: ReferenceSectionProps) => {
  const { showSnackbar } = useSnackbar()
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
    if (!ALLOWED_REFERENCE_IMAGE_TYPES.has(file.type)) {
      showSnackbar('JPG, PNG, GIF, WEBP 형식만 업로드할 수 있습니다.', { variant: 'warning' })
      return
    }
    if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
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
      label="Section"
      order={order}
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
                onDelete={visibleBlockEntries.length > 1 && onBlockItemDelete ? () => onBlockItemDelete(itemIndex) : undefined}
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
                        label="블록 제목"
                        placeholder="블록 제목 입력"
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
                        rows={4}
                        maxLength={500}
                        sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
                        slotProps={{
                          input: {
                            sx: {
                              minHeight: 120,
                              alignItems: 'flex-start',
                              padding: '8px 12px',
                            },
                          },
                        }}
                      />
                    </Stack>
                  )}

                  {block.type === 'IMAGE' &&
                    (() => {
                      const im = getBlockFields<{ imageBase64?: string; fileName?: string }>(block)
                      const imageBase64 = String(im?.imageBase64 ?? '')
                      const fileName = String(im?.fileName ?? '')
                      const inputId = `reference-section-image-${block.id}`
                      return (
                        <Stack gap="12px">
                          <MIMaskInput
                            label="블록 제목"
                            placeholder="블록 제목 입력"
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
                            placeholder="이미지 설명(선택)"
                            value={contentFromBlock(block)}
                            onUpdateValue={(v: string | undefined) => onBlockPatch(itemIndex, { content: v ?? '' })}
                            multiline
                            rows={3}
                            maxLength={500}
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
                      rows={4}
                      maxLength={500}
                      sx={{ '& .MuiInputBase-root': { borderRadius: '8px' } }}
                      slotProps={{
                        input: {
                          sx: {
                            minHeight: 120,
                            alignItems: 'flex-start',
                            padding: '8px 12px',
                          },
                        },
                      }}
                    />
                  )}
                </Stack>
              </Block>
            )
          })}
        </Stack>
      </Stack>
    </Block>
  )
}

export default ReferenceSection
