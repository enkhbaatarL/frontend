import { Fragment, type CSSProperties } from 'react'

import type { INewsletterIssueSnapshotData, INewsletterSnapshotSection } from '@/service/mi/newsletter'

import ItemTitle from '@/pages/mi/newsletter/components/emailTemplate/ItemTitle'
import ChangedLabel from '@/pages/mi/newsletter/components/view/ChangedLabel'
import {
  getBlockFields,
  getReferenceContentBlocks,
  isReferenceBlockRemoved,
  wasReferenceContentBlockRemovedInSnapshot,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import { EMAIL_FONT_FAMILY } from '@/utils/email'

interface UserCustomProps {
  section: INewsletterSnapshotSection
  titleDiffHtml?: string
  descriptionDiffHtml?: string
  showRemovedBlocks?: boolean
  diffComparisonSnapshot?: INewsletterIssueSnapshotData | null
}

const UserCustom = ({
  section,
  titleDiffHtml,
  descriptionDiffHtml,
  showRemovedBlocks = false,
  diffComparisonSnapshot = null,
}: UserCustomProps) => {
  const allBlocks = getReferenceContentBlocks(section).filter((b) => b.visibility !== false && b.type === 'TEXT')
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
          <td style={{ paddingTop: '12px', paddingBottom: '24px' }}>
            <ItemTitle title={title} subtitle={description} titleDiffHtml={titleDiffHtml} subtitleDiffHtml={descriptionDiffHtml} />
          </td>
        </tr>

        {displayBlocks.map((block) => {
          const blockRemoved = isReferenceBlockRemoved(block)
          const text = String(getBlockFields<{ content?: string }>(block)?.content ?? '')
          const textTitle = String(block.title ?? '').trim()
          const hasContent = text.trim().length > 0
          if (!hasContent && !textTitle && !blockRemoved) return null
          if (!hasContent && !textTitle && blockRemoved) {
            return (
              <tr key={block.id}>
                <td style={{ position: 'relative', paddingBottom: '24px' }}>
                  <ChangedLabel labelKind="deleted" top="8px" />
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
            opacity: blockRemoved ? 0.72 : undefined,
            textDecoration: blockRemoved ? 'line-through' : undefined,
          }

          return (
            <Fragment key={block.id}>
              {textTitle ? (
                <tr>
                  <td
                    style={{
                      ...titleInnerStyle,
                      position: 'relative',
                      paddingBottom: hasContent ? '10px' : '24px',
                    }}
                  >
                    {blockRemoved && <ChangedLabel labelKind="deleted" top="8px" />}
                    {textTitle}
                  </td>
                </tr>
              ) : null}
              {hasContent ? (
                <tr>
                  <td style={{ ...contentCellStyle, position: 'relative' }}>
                    {!textTitle && blockRemoved && <ChangedLabel labelKind="deleted" top="8px" />}
                    {text.split('\n').map((line, lineIdx) => (
                      <Fragment key={lineIdx}>
                        {lineIdx > 0 ? <br /> : null}
                        {line}
                      </Fragment>
                    ))}
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
