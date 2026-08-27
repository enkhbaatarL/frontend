import { Stack, Typography } from '@mui/material'

import MIMarkdown from '@/components/common/markdown/MIMarkdown'

export type ScenarioRationaleBlock = {
  heading?: string
  markdown?: string
  paragraphs?: string[]
  bullets?: string[]
}

export type ScenarioRationaleSection = {
  title?: string
  blocks: ScenarioRationaleBlock[]
}

const ScenarioRationaleCard = ({ section }: { section: ScenarioRationaleSection }) => {
  const title = section.title?.trim()

  return (
    <Stack width="100%" padding="8px" borderRadius="10px" bgcolor="gray.5" boxSizing="border-box">
      <Stack width="100%" padding="8px" gap="0px" boxSizing="border-box">
        {title ? (
          <Typography fontSize="13px" fontWeight={600} color="contentText.Normal" lineHeight={1.6}>
            {title}
          </Typography>
        ) : null}
        <Stack gap="0px" width="100%">
          {section.blocks.map((block, blockIndex) => (
            <Stack key={`${title ?? 'rationale'}-${blockIndex}`} width="100%">
              {block.heading ? (
                <Typography fontSize="15px" fontWeight={500} color="contentText.Black" lineHeight={1.6} whiteSpace="pre-wrap">
                  {block.heading}
                </Typography>
              ) : null}
              {block.markdown ? (
                <MIMarkdown
                  sx={
                    title
                      ? undefined
                      : {
                        '& > :first-of-type': { marginTop: 0 },
                        '& > :last-child': { marginBottom: 0 },
                      }
                  }
                >
                  {block.markdown}
                </MIMarkdown>
              ) : null}
              {block.paragraphs?.map((paragraph, paragraphIndex) => (
                <Typography
                  key={`${section.title}-${blockIndex}-p-${paragraphIndex}`}
                  fontSize="15px"
                  fontWeight={500}
                  color="contentText.Black"
                  lineHeight={1.6}
                  whiteSpace="pre-wrap"
                >
                  {paragraph}
                </Typography>
              ))}
              {block.bullets && block.bullets.length > 0 ? (
                <Stack
                  component="ul"
                  margin={0}
                  padding="0 0 0 22px"
                  sx={{
                    listStyleType: 'disc',
                    listStylePosition: 'outside',
                  }}
                >
                  {block.bullets.map((bullet, bulletIndex) => (
                    <Typography
                      key={`${section.title}-${blockIndex}-b-${bulletIndex}`}
                      component="li"
                      fontSize="15px"
                      fontWeight={500}
                      color="contentText.Black"
                      lineHeight={1.6}
                      sx={{ display: 'list-item' }}
                    >
                      {bullet}
                    </Typography>
                  ))}
                </Stack>
              ) : null}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}

const ScenarioRationalePopupContent = ({ sections, fallbackText }: { sections?: ScenarioRationaleSection[]; fallbackText?: string }) => {
  const resolvedSections =
    sections && sections.length > 0
      ? sections
      : fallbackText?.trim()
        ? [
          {
            title: '설계 근거',
            blocks: [{ paragraphs: [fallbackText.trim()] }],
          },
        ]
        : []

  return (
    <Stack width="100%" gap="12px" padding="12px 24px 24px" boxSizing="border-box">
      {resolvedSections.length > 0 ? (
        resolvedSections.map((section, index) => <ScenarioRationaleCard key={section.title ?? index} section={section} />)
      ) : (
        <ScenarioRationaleCard
          section={{
            title: '설계 근거',
            blocks: [{ paragraphs: ['설계 근거가 없습니다.'] }],
          }}
        />
      )}
    </Stack>
  )
}

export default ScenarioRationalePopupContent
