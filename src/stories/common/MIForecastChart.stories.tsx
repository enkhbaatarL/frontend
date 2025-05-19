import { Meta, StoryObj } from '@storybook/react'

import MIBrentForecastChart from '@/components/common/forecast-chart/MIForecastChart'
import {
  actualData,
  generateChartMonths,
  generateForecastDatasets,
  generateMockFuturesData,
  generateSingleForecastDatasets,
} from '@/components/common/forecast-chart/mockBrentForecastData'

const meta = {
  title: 'common/chart/MIForecastChart',
  component: MIBrentForecastChart,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  args: {},
} satisfies Meta<typeof MIBrentForecastChart>

export default meta

type Story = StoryObj<typeof meta>

const { months } = generateChartMonths()

export const DefaultChart: Story = {
  args: {
    actualData: {
      label: 'Actual data',
      data: actualData,
      color: '#40597A',
    },
    months,
    forecastData: generateForecastDatasets(months),
    futureDatasets: [
      {
        label: 'Futures M1',
        data: generateMockFuturesData(actualData, { varianceMin: -2, varianceMax: 1.5, trendBias: -0.5, volatility: 0.4 }),
        color: '#26757B',
      },
      {
        label: 'Futures M2',
        data: generateMockFuturesData(actualData, { varianceMin: -3, varianceMax: 1, trendBias: -1, volatility: 0.5 }),
        color: '#EFA460',
      },
    ],
    height: 598,
    bottomLabel: 'First Unit',
    topLabel: 'Unit: USD/bbl',
    lastUpdated: 'April 29, 2025',
  },
}

export const SingleForecast: Story = {
  args: {
    actualData: {
      label: 'Actual data',
      data: actualData,
      color: '#40597A',
    },
    months,
    forecastData: generateSingleForecastDatasets(months),
    showForecastTrend: false,
    hidePoint: true,
    futureDatasets: [
      {
        label: 'Futures M1',
        data: generateMockFuturesData(actualData, { varianceMin: -2, varianceMax: 1.5, trendBias: -0.5, volatility: 0.4 }),
        color: '#26757B',
      },
      {
        label: 'Futures M2',
        data: generateMockFuturesData(actualData, { varianceMin: -3, varianceMax: 1, trendBias: -1, volatility: 0.5 }),
        color: '#EFA460',
      },
      {
        label: 'Futures M3',
        data: generateMockFuturesData(actualData, { varianceMin: -1, varianceMax: 2, trendBias: 0.5, volatility: 0.3 }),
        color: '#94826B',
      },
      {
        label: 'Futures M4',
        data: generateMockFuturesData(actualData, { varianceMin: -1, varianceMax: 2, trendBias: 0.5, volatility: 0.5 }),
        color: '#EFD485',
      },
    ],
    height: 598,
    topLabel: 'Unit: USD/bbl',
  },
}
