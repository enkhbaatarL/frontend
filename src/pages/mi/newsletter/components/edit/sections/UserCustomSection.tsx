import AddIcon from '@mui/icons-material/Add'
import { Button, Stack } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'

import type { INewsletterSnapshotBlock, INewsletterSnapshotSection } from '@/service/mi/newsletter'

import MIMaskInput from '@/components/common/input/MIMaskInput'
import useSnackbar from '@/hooks/useSnackbar'
import AddBlockModal from '@/pages/mi/newsletter/components/edit/AddBlockModal'
import AddSectionModal from '@/pages/mi/newsletter/components/edit/AddSectionModal'
import Block, { type BlockOrderProps } from '@/pages/mi/newsletter/components/edit/sections/Block'
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

const BLOCK_TITLE_MAX = 100
const BLOCK_CONTENT_MAX = 1000

const contentFromBlock = (block: INewsletterSnapshotBlock) => getBlockFields<{ content?: string }>(block)?.content ?? ''

export type UserCustomSectionProps = {
  section: INewsletterSnapshotSection
  refIndex: number
  blockOrder?: BlockOrderProps
  siblingIds?: string[]
  onOrderChange?: (targetIndex: number) => void
  showRequiredIndicator?: boolean
  getContentBlockMissingRequired?: (blockId: string) => boolean
  onSectionFieldsChange: (partial: { title?: string; description?: string }) => void
  onSectionVisibilityChange?: (visible: boolean) => void
  onDelete?: () => void
  onBlockPatch: (contentBlockIndex: number, patch: ReferenceContentBlockPatch) => void
  onBlockItemDelete?: (contentBlockIndex: number) => void
  onBlockItemOrderChange: (fromIndex: number, targetIndex: number) => void
  onAppendContentBlock?: (block: INewsletterSnapshotBlock) => void
}

/** 사용자가 추가한 뉴스레터 섹션 전용 편집 UI. */
export const UserCustomSection = ({
  section,
  refIndex,
  blockOrder,
  siblingIds = [],
  onOrderChange,
  showRequiredIndicator = false,
  getContentBlockMissingRequired,
  onSectionFieldsChange,
  onSectionVisibilityChange,
  onDelete,
  onBlockPatch,
  onBlockItemDelete,
  onBlockItemOrderChange,
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

  return (
    <Block
      key={section.id}
      label={USER_CUSTOM_SECTION_HEADER_LABEL}
      order={order}
      onDelete={onDelete}
      collapsedPreview={title || undefined}
      showRequiredIndicator={showRequiredIndicator}
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
          {visibleBlockEntries.map(({ block, itemIndex }) => (
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
              showRequiredIndicator={getContentBlockMissingRequired?.(String(block.id ?? '')) ?? false}
            >
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
            </Block>
          ))}
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
