import { Meta, StoryObj } from '@storybook/react'

import MIBrentForecastChart from '@/components/common/forecast-chart/MIForecastChart'
import { generateChartMonths, generateForecastDataset } from '@/components/common/forecast-chart/mockBrentForecastData'

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
    forecastDatasets: [
      {
        ...generateForecastDataset(months),
        label: 'Actual data 1',
        color: '#40597A',
      },
      {
        ...generateForecastDataset(months),
        label: 'Actual data 2',
        color: '#26757B',
      },
      {
        ...generateForecastDataset(months),
        label: 'Actual data 3',
        color: '#EFA460',
      },
    ],
    months,
    height: 598,
    bottomLabel: 'First Unit',
    topLabel: 'Unit: USD/bbl',
    lastUpated: 'April 29, 2025',
  },
}

export const SingleForecast: Story = {
  args: {
    forecastDatasets: [
      {
        ...generateForecastDataset(months, { forecastByMonth: false }),
        label: 'Actual data 1',
        color: '#40597A',
      },
      {
        ...generateForecastDataset(months, { hasForecast: false }),
        label: 'Actual data 2',
        color: '#26757B',
      },
      {
        ...generateForecastDataset(months, { hasForecast: false }),
        label: 'Actual data 3',
        color: '#EFA460',
      },
    ],
    months,
    showForecastTrend: false,
    hidePoint: true,
    height: 598,
    topLabel: 'Unit: USD/bbl',
  },
}

export const SKInovationPriceChart: Story = {
  args: {
    forecastDatasets: [
      {
        ...generateForecastDataset(months, { forecastByMonth: false }),
        label: 'Actual data 1',
        color: '#40597A',
        hidePoint: true,
      },
      {
        ...generateForecastDataset(months),
        label: 'Actual data 2',
        color: '#26757B',
        hidePoint: true,
        type: 'future',
      },
      {
        ...generateForecastDataset(months),
        label: 'Actual data 3',
        color: '#EFA460',
        hidePoint: true,
        type: 'future',
      },
    ],
    months,
    showForecastTrend: false,
    hidePoint: true,
    height: 598,
    topLabel: 'Unit: USD/bbl',
  },
}

export const SKEnergyChart: Story = {
  args: {
    forecastDatasets: [
      {
        ...generateForecastDataset(months),
        label: 'Actual data 1',
        color: '#40597A',
      },
      {
        ...generateForecastDataset(months),
        label: 'Future 1',
        color: '#26757B',
        type: 'future',
        hidePoint: true,
      },
      {
        ...generateForecastDataset(months),
        label: 'Future 2',
        color: '#EFA460',
        type: 'future',
        hidePoint: true,
      },
    ],
    months,
    height: 598,
    topLabel: 'Unit: USD/bbl',
    lastUpated: 'April 29, 2025',
  },
}

export const SKOnChart: Story = {
  args: {
    forecastDatasets: [
      {
        ...generateForecastDataset(months, { forecastByMonth: false }),
        label: 'Actual data 1',
        color: '#40597A',
        hidePoint: true,
      },
      {
        ...generateForecastDataset(months, { forecastByMonth: false }),
        label: 'Future 1',
        color: '#26757B',
        hidePoint: true,
      },
      {
        ...generateForecastDataset(months, { forecastByMonth: false }),
        label: 'Future 2',
        color: '#EFA460',
        hidePoint: true,
      },
    ],
    months,
    height: 598,
    topLabel: 'Unit: USD/bbl',
    lastUpated: 'April 29, 2025',
  },
}

export const SKSiltronChart: Story = {
  args: {
    forecastDatasets: [
      {
        ...generateForecastDataset(months, { forecastByMonth: false }),
        label: 'Actual data 1',
        color: '#40597A',
        hidePoint: true,
      },
      {
        ...generateForecastDataset(months, { forecastByMonth: false }),
        label: 'Future 1',
        color: '#26757B',
        hidePoint: true,
        yAxisID: 'y1',
      },
      {
        ...generateForecastDataset(months, { forecastByMonth: false }),
        label: 'Future 2',
        color: '#EFA460',
        hidePoint: true,
        yAxisID: 'y2',
      },
    ],
    months,
    height: 598,
    topLabel: 'Unit: USD/bbl',
    lastUpated: 'April 29, 2025',
    showForecastTrend: false,
  },
}
