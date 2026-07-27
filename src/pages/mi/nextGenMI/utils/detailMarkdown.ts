import type { EventDetail, EventInstitutionOutlook, EventRelatedRecord, EventImpactIndexTerm } from '@/service/mi/nextGenMI/event'
import type { IScenarioDetailViewRes, IScenarioGroupDetailRes } from '@/service/mi/nextGenMI/scenarioGroup'

import { formatNextGenMIDateTime, formatNextGenMIDateTimeYmdHm } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'

type MarkdownValue = string | number | boolean | null | undefined

const displayValue = (value: MarkdownValue) => {
  if (value === null || value === undefined) return '-'
  const text = String(value).trim()
  return text || '-'
}

const escapeTableCell = (value: MarkdownValue) => displayValue(value).replaceAll('|', '\\|').replace(/\r?\n/g, '<br>')

const markdownTable = (headers: string[], rows: MarkdownValue[][]) => {
  if (rows.length === 0) return '_표시할 데이터가 없습니다._'

  return [
    `| ${headers.map(escapeTableCell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escapeTableCell).join(' | ')} |`),
  ].join('\n')
}

const markdownList = (items: string[]) =>
  items.length > 0 ? items.map((item) => `- ${displayValue(item).replace(/\r?\n/g, '\n  ')}`).join('\n') : '_표시할 데이터가 없습니다._'

const normalizeEmbeddedMarkdownHeadings = (markdown: string, parentHeadingLevel: number) => {
  const lines = markdown.split(/\r?\n/)
  const headings: { index: number; level: number }[] = []
  let fenceMarker: '`' | '~' | null = null

  lines.forEach((line, index) => {
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (fence) {
      const marker = fence[1][0] as '`' | '~'
      if (fenceMarker === null) fenceMarker = marker
      else if (fenceMarker === marker) fenceMarker = null
      return
    }

    if (fenceMarker !== null) return

    const heading = line.match(/^(\s{0,3})(#{1,6})(?=\s)/)
    if (heading) headings.push({ index, level: heading[2].length })
  })

  if (headings.length === 0) return markdown

  const minimumHeadingLevel = Math.min(...headings.map((heading) => heading.level))
  headings.forEach(({ index, level }) => {
    const normalizedLevel = Math.min(6, parentHeadingLevel + 1 + level - minimumHeadingLevel)
    lines[index] = lines[index].replace(/^(\s{0,3})#{1,6}(?=\s)/, `$1${'#'.repeat(normalizedLevel)}`)
  })

  return lines.join('\n')
}

const formatImpact = (impact?: EventImpactIndexTerm | null) => {
  if (!impact) return '-'

  const level = impact.marketImpactLevelLabel ?? impact.marketImpactLevel
  const direction = impact.directionLabel ?? impact.direction
  return [level, direction].filter(Boolean).join(' / ') || '-'
}

const formatScenarioTableLabel = (displayOrder: number, baseCase: boolean, scenarioName: string) =>
  `${displayOrder}. ${baseCase ? '[BC] ' : ''}${displayValue(scenarioName)}`

const formatScenarioDetailTitle = (displayOrder: number, baseCase: boolean, scenarioName: string) =>
  `시나리오 ${displayOrder} - ${baseCase ? '[BC] ' : ''}${displayValue(scenarioName)}`

const formatProbability = (probability?: number | null) => (probability === null || probability === undefined ? '-' : `${probability}%`)

export const getMarkdownFileName = (title: string, fallback: string) => {
  const fileName = title
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[.\s]+$/g, '')
    .trim()
    .slice(0, 100)

  return `${fileName || fallback}.md`
}

export const buildEventDetailMarkdown = ({
  detail,
  records,
  outlooks,
}: {
  detail: EventDetail
  records: EventRelatedRecord[]
  outlooks: EventInstitutionOutlook[]
}) => {
  const impactAnalysis = detail.impactAnalysis
  const relatedScenarios = (detail.relatedEventScenario?.scenarios ?? []).filter((scenario) => scenario.status !== 'discarded')
  const relatedDimensionColumns = detail.relatedEventScenario?.dimensionColumns ?? []
  const sections = [
    `# ${displayValue(detail.eventName)}`,
    [`- 생성: ${formatNextGenMIDateTimeYmdHm(detail.createdAt)}`, `- 갱신: ${formatNextGenMIDateTimeYmdHm(detail.updatedAt)}`]
      .filter(Boolean)
      .join('\n'),
    '## AI Insights',
    '### 핵심요약',
    markdownList(detail.aiInsights?.keySummaries ?? []),
    '### 상세분석',
    detail.aiInsights?.detailedAnalysis?.trim() || '_표시할 데이터가 없습니다._',
    '## 영향도 분석',
  ]

  if (detail.signalType === 'noise') {
    sections.push('_해당 없음._')
  } else {
    sections.push(
      `- 카테고리: ${displayValue(impactAnalysis?.eventTypeLv1Label ?? impactAnalysis?.eventTypeLv1)}`,
      `- 세부 카테고리: ${displayValue(impactAnalysis?.eventTypeLv2Label ?? impactAnalysis?.eventTypeLv2)}`,
      `- 출처: ${displayValue(impactAnalysis?.sources?.filter(Boolean).join(', '))}`,
      markdownTable(
        ['대상', '단기 영향', '중장기 영향'],
        (impactAnalysis?.indexImpacts ?? []).map((impact) => [
          impact.indexName,
          formatImpact(impact.shortTerm),
          formatImpact(impact.midLongTerm),
        ]),
      ),
      '### 영향도 분석 종합',
      impactAnalysis?.analysisText?.trim()
        ? normalizeEmbeddedMarkdownHeadings(impactAnalysis.analysisText.trim(), 3)
        : '_표시할 데이터가 없습니다._',
    )
  }

  sections.push(
    '## Index Driver별 영향도 분석',
    markdownTable(
      ['대상', 'Driver Lv1', 'Driver Lv2', 'Driver Lv3', '단기 영향', '중장기 영향', '근거'],
      (detail.driverTreeScoreboard ?? []).flatMap((index) => {
        const drivers = index.drivers ?? []
        if (drivers.length === 0) return [[index.indexName]]

        return drivers.map((driver) => [
          index.indexName,
          driver.lv1Label,
          driver.lv2Label,
          driver.lv3Label,
          formatImpact(driver.shortTerm),
          formatImpact(driver.midLongTerm),
          driver.reason,
        ])
      }),
    ),
    '## 기관 전망',
  )

  if (detail.institutionViewSynthesis?.trim()) {
    sections.push('### 기관 전망 종합 분석', detail.institutionViewSynthesis.trim())
  }

  sections.push(
    markdownTable(
      ['일자', '기관', '전망 요약'],
      outlooks.map((outlook) => [outlook.viewDate, outlook.institutionName, outlook.outlookSummary]),
    ),
    '## MI Records',
    markdownTable(
      ['일자', '종류', '제목', '요약'],
      records.map((record) => [record.publishedAt, record.recordType, record.title, record.summary]),
    ),
    '## 관련 시나리오',
  )

  if (detail.scenarioSuggestReason?.trim()) {
    sections.push('### 시나리오 제안 사유', detail.scenarioSuggestReason.trim())
  }

  if (detail.relatedEventScenario?.groupName?.trim()) {
    sections.push(`- 시나리오 그룹: ${detail.relatedEventScenario.groupName.trim()}`)
  }

  sections.push(
    markdownTable(
      ['시나리오', ...relatedDimensionColumns.map((column) => column.label), '실행가능성'],
      relatedScenarios.map((scenario) => [
        formatScenarioTableLabel(scenario.displayOrder, scenario.baseCase, scenario.scenarioName),
        ...relatedDimensionColumns.map((column) => scenario.dimensions?.find((dimension) => dimension.key === column.key)?.valueLabel),
        formatProbability(scenario.adjustedProbability ?? scenario.probability),
      ]),
    ),
  )

  return `${sections.join('\n\n')}\n`
}

export const buildScenarioGroupDetailMarkdown = (detail: IScenarioGroupDetailRes, scenarioDetails: IScenarioDetailViewRes[]) => {
  const sections = [
    `# ${displayValue(detail.groupName)}`,
    '## 요약',
    '### Base Event',
    markdownTable(
      ['이벤트', '이벤트 유형', '업데이트 일시'],
      detail.baseEvent
        ? [[detail.baseEvent.eventName, detail.baseEvent.eventTypeLv1Label, formatNextGenMIDateTimeYmdHm(detail.baseEvent.updatedAt)]]
        : [],
    ),
    '### 시나리오 그룹 설명',
    detail.summary?.trim() || '_표시할 데이터가 없습니다._',
    '## 가정 및 실현 가능성',
    markdownTable(
      ['시나리오', ...detail.dimensionColumns.map((column) => column.label), '실행가능성', '상태'],
      detail.scenarios
        .filter((scenario) => scenario.status !== 'discarded')
        .map((scenario) => [
          formatScenarioTableLabel(scenario.displayOrder, scenario.baseCase, scenario.scenarioName),
          ...detail.dimensionColumns.map((column) => scenario.dimensions.find((dimension) => dimension.key === column.key)?.valueLabel),
          formatProbability(scenario.adjustedProbability ?? scenario.probability),
          scenario.statusLabel,
        ]),
    ),
    '## 시나리오 상세',
  ]

  if (scenarioDetails.length === 0) {
    sections.push('_표시할 시나리오가 없습니다._')
    return `${sections.join('\n\n')}\n`
  }

  scenarioDetails.forEach((scenarioDetail) => {
    sections.push(
      `### ${formatScenarioDetailTitle(scenarioDetail.displayOrder, scenarioDetail.baseCase, scenarioDetail.scenarioName)}`,
      '#### 시나리오 내러티브',
      scenarioDetail.narrative?.trim() || '_표시할 데이터가 없습니다._',
      '#### 시나리오 발생 확률',
      formatProbability(scenarioDetail.adjustedProbability ?? scenarioDetail.probability),
      '#### 시나리오 주요 가정',
      markdownTable(
        ['구분', '가정'],
        scenarioDetail.dimensions.map((dimension) => [dimension.label, dimension.valueLabel]),
      ),
      '#### Signpost 정의',
      markdownTable(
        ['Signpost Label', '방향', '영향도', '핵심 근거'],
        scenarioDetail.signpostDefinitions.map((definition) => [
          definition.label,
          definition.directionLabel,
          definition.strengthLabel,
          definition.rationale,
        ]),
      ),
      '#### Signpost 모니터링 현황',
      markdownTable(
        ['업데이트 일시', 'Signpost 이벤트 요약', '상세 내역 (Signpost 매칭 근거)'],
        scenarioDetail.signpostMonitorings.map((monitoring) => [
          formatNextGenMIDateTime(monitoring.updatedAt, 'YYYY-MM-DD'),
          monitoring.eventSummary,
          monitoring.rationale,
        ]),
      ),
    )
  })

  return `${sections.join('\n\n')}\n`
}
