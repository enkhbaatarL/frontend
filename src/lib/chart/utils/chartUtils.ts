import { Chart } from 'chart.js'

export const getDatasetMetaData = (chart: Chart<'line'>, label: string) => {
  const { datasets } = chart.data

  const targetIndex = datasets.findIndex((dataset) => dataset.label === label)

  if (targetIndex === -1) return null

  return chart.getDatasetMeta(targetIndex)
}
