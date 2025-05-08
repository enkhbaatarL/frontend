import { Chart } from 'chart.js'

export const getDatasetMetaData = (chart: Chart<'line'>, label: string) => {
  const { datasets } = chart.data

  const targetIndex = datasets.findIndex((dataset) => dataset.label === label)

  if (targetIndex === -1) return null

  return chart.getDatasetMeta(targetIndex)
}

export const generateYAxis = (params: {
  unit: string
  position: 'left' | 'right'
  isMain?: boolean
  label?: string
  borderColor?: string
}) => ({
  unit: params.unit,
  title: {
    display: false,
    text: params.label ?? '',
  },
  afterFit(axis: { width: number }) {
    // Set a fixed width for the y-axis
    axis.width = Math.max(67, axis.width) // Set to desired width in pixels
  },
  position: params.position ?? 'right',
  grid: {
    color: params.isMain ? '#DEE2E6' : 'transparent',
    drawTicks: false,
  },
  border: {
    dash: [2, 2],
    color: params.borderColor ?? '#2E3F5E',
  },
  ticks: {
    padding: 12,
    color: params.isMain ? '#2E3F5E' : '#868E96', // Change this to your desired color
    font: {
      size: 14, // Font size in pixels
      family: 'Pretendard,sans-serif', // Font family
      weight: '500', // Optional: font weight
    },
    stepSize: 1,
    beginAtZero: true,
    callback(value: number, index: number, ticks: number[]) {
      // Hide the first tick (index 0)
      if (index === 0 || index === ticks.length - 1) return ''

      return value
    },
  },
})
