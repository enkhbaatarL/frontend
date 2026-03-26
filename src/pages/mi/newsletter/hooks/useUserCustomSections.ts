import { useCallback, useMemo } from 'react'

import type { INewsletterIssueSnapshotData, INewsletterSnapshotBlock, INewsletterSnapshotSection } from '@/service/mi/newsletter'

import {
  getOrderedReferenceSections,
  getReferenceContentBlocks,
  isReferenceBlockRemoved,
  patchReferenceContentBlock,
  replaceReferenceSectionContentBlocks,
  type ReferenceContentBlockPatch,
} from '@/pages/mi/newsletter/utils/snapshotUtils'

export type UseUserCustomSectionsParams = {
  snapshot: INewsletterIssueSnapshotData | null
  onReferencesChange?: (referenceSections: INewsletterSnapshotSection[]) => void
}

export const useUserCustomSections = ({ snapshot, onReferencesChange }: UseUserCustomSectionsParams) => {
  const referenceSections = useMemo(() => getOrderedReferenceSections(snapshot), [snapshot])

  const pushReferenceSnapshot = useCallback(
    (nextRefs: INewsletterSnapshotSection[]) => {
      if (!snapshot || !onReferencesChange) return
      onReferencesChange(nextRefs)
    },
    [snapshot, onReferencesChange],
  )

  const getRefIndexBySectionId = useCallback(
    (sectionId: string) => referenceSections.findIndex((s) => s.id === sectionId),
    [referenceSections],
  )

  const updateReferenceSectionById = useCallback(
    (sectionId: string, updater: (s: INewsletterSnapshotSection) => INewsletterSnapshotSection) => {
      const idx = getRefIndexBySectionId(sectionId)
      if (idx < 0) return
      pushReferenceSnapshot(referenceSections.map((s, i) => (i === idx ? updater(s) : s)))
    },
    [getRefIndexBySectionId, referenceSections, pushReferenceSnapshot],
  )

  const updateReferenceSectionVisibilityById = useCallback(
    (sectionId: string, visible: boolean) => {
      updateReferenceSectionById(sectionId, (s) => ({ ...s, visibility: visible }))
    },
    [updateReferenceSectionById],
  )

  const appendReferenceContentBlock = useCallback(
    (sectionId: string, block: INewsletterSnapshotBlock) => {
      updateReferenceSectionById(sectionId, (s) => {
        const blocks = [...getReferenceContentBlocks(s), block]
        return replaceReferenceSectionContentBlocks(s, blocks)
      })
    },
    [updateReferenceSectionById],
  )

  const updateReferenceFieldsById = useCallback(
    (sectionId: string, partial: { title?: string; description?: string }) => {
      updateReferenceSectionById(sectionId, (s) => ({
        ...s,
        fields: {
          ...(s.fields ?? {}),
          ...(partial.title !== undefined ? { title: partial.title } : {}),
          ...(partial.description !== undefined ? { description: partial.description } : {}),
        },
      }))
    },
    [updateReferenceSectionById],
  )

  const deleteReferenceBySectionId = useCallback(
    (sectionId: string) => {
      pushReferenceSnapshot(referenceSections.map((s) => (s.id === sectionId ? { ...s, removed: true } : s)))
    },
    [referenceSections, pushReferenceSnapshot],
  )

  const patchContentBlockByIndex = useCallback(
    (sectionId: string, contentBlockIndex: number, patch: ReferenceContentBlockPatch) => {
      updateReferenceSectionById(sectionId, (s) => {
        const blocks = getReferenceContentBlocks(s)
        const next = blocks.map((b, i) => (i === contentBlockIndex ? patchReferenceContentBlock(b, patch) : b))
        return replaceReferenceSectionContentBlocks(s, next)
      })
    },
    [updateReferenceSectionById],
  )

  const deleteContentBlockByIndex = useCallback(
    (sectionId: string, contentBlockIndex: number) => {
      updateReferenceSectionById(sectionId, (s) => {
        const blocks = getReferenceContentBlocks(s)
        const next = blocks.map((b, i) => (i === contentBlockIndex ? patchReferenceContentBlock(b, { state: { removed: true } }) : b))
        return replaceReferenceSectionContentBlocks(s, next)
      })
    },
    [updateReferenceSectionById],
  )

  const reorderContentBlocksById = useCallback(
    (sectionId: string, fromIndex: number, targetIndex: number) => {
      if (fromIndex === targetIndex) return
      updateReferenceSectionById(sectionId, (s) => {
        const blocks = [...getReferenceContentBlocks(s)]
        const [removed] = blocks.splice(fromIndex, 1)
        blocks.splice(targetIndex, 0, removed!)
        return replaceReferenceSectionContentBlocks(s, blocks)
      })
    },
    [updateReferenceSectionById],
  )

  const getFlatChartIndexBySectionId = useCallback(
    (sectionId: string, contentBlockIndex: number): number => {
      const refIdx = getRefIndexBySectionId(sectionId)
      let idx = 0
      for (let r = 0; r < refIdx; r++) {
        const sec = referenceSections[r]!
        if (sec.visibility === false || sec.removed === true) continue
        idx += getReferenceContentBlocks(sec).filter(
          (b) => b.type === 'CHART' && b.visibility !== false && !isReferenceBlockRemoved(b),
        ).length
      }
      const currentBlocks = getReferenceContentBlocks(referenceSections[refIdx]!)
      for (let i = 0; i < contentBlockIndex; i++) {
        if (currentBlocks[i]?.type === 'CHART' && currentBlocks[i]?.visibility !== false && !isReferenceBlockRemoved(currentBlocks[i]!))
          idx++
      }
      return idx
    },
    [getRefIndexBySectionId, referenceSections],
  )

  return {
    referenceSections,
    pushReferenceSnapshot,
    updateReferenceFieldsById,
    updateReferenceSectionVisibilityById,
    deleteReferenceBySectionId,
    patchContentBlockByIndex,
    deleteContentBlockByIndex,
    reorderContentBlocksById,
    getFlatChartIndexBySectionId,
    appendReferenceContentBlock,
  }
}
