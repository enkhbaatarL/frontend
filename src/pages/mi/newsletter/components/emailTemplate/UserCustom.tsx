import DOMPurify from 'dompurify'
import { Fragment, type CSSProperties } from 'react'

import type { ReferenceBlockDiff } from '@/pages/mi/newsletter/hooks/useDocumentDiff'
import type { INewsletterIssueSnapshotData, INewsletterSnapshotSection } from '@/service/mi/newsletter'

import ItemTitle from '@/pages/mi/newsletter/components/emailTemplate/ItemTitle'
import ChangedLabel from '@/pages/mi/newsletter/components/view/ChangedLabel'
import {
  getBlockFields,
  getReferenceContentBlocks,
  isReferenceBlockRemoved,
  wasReferenceContentBlockRemovedInSnapshot,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import { EMAIL_FONT_FAMILY, msoLineHeightAltScaled, msoPaddingAltScaled } from '@/utils/email'

interface UserCustomProps {
  section: INewsletterSnapshotSection
  titleDiffHtml?: string
  descriptionDiffHtml?: string
  showRemovedBlocks?: boolean
  diffComparisonSnapshot?: INewsletterIssueSnapshotData | null
  blockChanges?: Record<string, ReferenceBlockDiff>
}

const UserCustom = ({
  section,
  titleDiffHtml,
  descriptionDiffHtml,
  showRemovedBlocks = false,
  diffComparisonSnapshot = null,
  blockChanges,
}: UserCustomProps) => {
  const allBlocks = getReferenceContentBlocks(section).filter((b) => b.visibility && b.type === 'TEXT')
  const withRemoved = showRemovedBlocks ? allBlocks : allBlocks.filter((b) => !isReferenceBlockRemoved(b))
  const displayBlocks =
    showRemovedBlocks && diffComparisonSnapshot
      ? withRemoved.filter((b) => {
        if (!isReferenceBlockRemoved(b)) return true
        return !wasReferenceContentBlockRemovedInSnapshot(diffComparisonSnapshot, section.id, b.id)
      })
      : withRemoved
  const sf = section.fields ?? {}
  const title = String(sf.title ?? '')
  const description = String(sf.description ?? '')

  return (
    <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ paddingTop: '12px', paddingBottom: '24px', ...({ msoPaddingAlt: '6px 0 12px 0' } as CSSProperties) }}>
            <ItemTitle title={title} subtitle={description} titleDiffHtml={titleDiffHtml} subtitleDiffHtml={descriptionDiffHtml} />
          </td>
        </tr>

        {displayBlocks.map((block) => {
          const blockRemoved = isReferenceBlockRemoved(block)
          const blockDiff = blockChanges?.[block.id]
          const blockChangeKind = blockDiff?.kind
          const bf = getBlockFields<{ content?: string; title?: string }>(block)
          const text = String(bf?.content ?? '')
          const textTitle = String(bf?.title ?? block.title ?? '').trim()
          const hasContent = text.trim().length > 0
          if (!hasContent && !textTitle && !blockRemoved && !blockChangeKind) return null
          if (!hasContent && !textTitle && (blockRemoved || blockChangeKind)) {
            return (
              <tr key={block.id}>
                <td style={{ position: 'relative', paddingBottom: '24px' }}>
                  <ChangedLabel labelKind={blockRemoved ? 'deleted' : blockChangeKind!} top="5px" />
                </td>
              </tr>
            )
          }

          const titleInnerStyle: CSSProperties = {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#212529',
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: '20px',
            fontWeight: 600,
            lineHeight: '28px',
            ...({
              msoAnsiFontSize: '13.5px',
              msoFareastFontSize: '13.5px',
              msoLineHeightAlt: msoLineHeightAltScaled(28, 20, 13.5),
              msoLineHeightRule: 'exactly',
            } as CSSProperties),
            opacity: blockRemoved ? 0.72 : undefined,
            textDecoration: blockRemoved ? 'line-through' : undefined,
          }
          const contentCellStyle: CSSProperties = {
            paddingBottom: '24px',
            color: '#495057',
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: '18px',
            fontWeight: 400,
            lineHeight: '27px',
            ...({
              msoAnsiFontSize: '10px',
              msoFareastFontSize: '10px',
              msoLineHeightAlt: msoLineHeightAltScaled(27, 18, 10),
              msoLineHeightRule: 'exactly',
            } as CSSProperties),
            opacity: blockRemoved ? 0.72 : undefined,
            textDecoration: blockRemoved ? 'line-through' : undefined,
          }

          const blockLabel = blockRemoved ? 'deleted' : blockChangeKind
          const titleHtml = blockDiff?.titleDiffHtml
          const contentHtml = blockDiff?.contentDiffHtml
          return (
            <Fragment key={block.id}>
              {textTitle || titleHtml ? (
                <tr>
                  <td style={{ position: 'relative', paddingBottom: hasContent ? '10px' : '24px' }}>
                    {blockLabel && <ChangedLabel labelKind={blockLabel} top="5px" />}
                    <div
                      style={titleInnerStyle}
                      {...(titleHtml ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(titleHtml) } } : { children: textTitle })}
                    />
                  </td>
                </tr>
              ) : null}
              {hasContent || contentHtml ? (
                <tr>
                  <td
                    style={{
                      ...contentCellStyle,
                      ...(textTitle || titleHtml ? { paddingTop: '4px' } : {}),
                      ...({
                        msoPaddingAlt:
                          textTitle || titleHtml ? msoPaddingAltScaled(4, 0, 24, 0, 18, 10) : msoPaddingAltScaled(0, 0, 24, 0, 18, 10),
                      } as CSSProperties),
                      position: 'relative',
                    }}
                  >
                    {!textTitle && !titleHtml && blockLabel && <ChangedLabel labelKind={blockLabel} top="5px" />}
                    {contentHtml ? (
                      <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentHtml) }} />
                    ) : (
                      text.split('\n').map((line, lineIdx) => (
                        <Fragment key={lineIdx}>
                          {lineIdx > 0 ? <br /> : null}
                          {line}
                        </Fragment>
                      ))
                    )}
                  </td>
                </tr>
              ) : null}
            </Fragment>
          )
        })}
      </tbody>
    </table>
  )
}

export default UserCustom
