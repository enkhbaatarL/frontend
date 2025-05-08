import { Meta, StoryObj } from '@storybook/react'

import MIChart from '@/components/common/chart/MIChart'
import { calculateBollingerBands, calculateSMA, getMockOHLCData } from '@/utils/mock-data'

const meta = {
  title: 'common/chart/MIChart',
  component: MIChart,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    interval: {
      control: 'radio',
      type: 'string',
      options: ['day', 'month', 'year'],
    },
    chartType: {
      control: 'radio',
      type: 'string',
      options: ['candlestick', 'line'],
    },
    numberOfBars: {
      control: 'number',
      type: 'number',
    },
    height: {
      control: 'number',
      type: 'number',
    },
    width: {
      control: 'number',
      type: 'number',
    },
  },
  args: {
    interval: 'day',
    chartType: 'candlestick',
    numberOfBars: 60,
  },
} satisfies Meta<typeof MIChart>

export default meta

type Story = StoryObj<typeof meta>

const mockMainData = getMockOHLCData(200)
const genMockSMA = (day: number) => {
  const rawData = calculateSMA(
    mockMainData.map((d) => d.close),
    day,
  )

  return mockMainData.map((d, i) => ({
    time: d.time,
    value: i >= day ? rawData[i - day] : null,
  }))
}

const genMockBB = () => {
  const rawData = calculateBollingerBands(
    mockMainData.map((d) => d.close),
    120,
    2,
  )

  const upper = mockMainData.map((d, i) => ({
    time: d.time,
    value: i >= 119 ? rawData.upper[i - 119] : null,
  }))

  const lower = mockMainData.map((d, i) => ({
    time: d.time,
    value: i >= 119 ? rawData.lower[i - 119] : null,
  }))

  return {
    upper,
    lower,
  }
}

const mockSMA5 = genMockSMA(5)
const mockSMA20 = genMockSMA(20)
const mockSMA60 = genMockSMA(60)
const mockSMA120 = genMockSMA(120)
const mockbb = genMockBB()

const comparisionData1 = getMockOHLCData(200).map((item) => ({ time: item.time, value: item.close }))
const comparisionData2 = getMockOHLCData(200).map((item) => ({ time: item.time, value: item.close }))
const comparisionData3 = getMockOHLCData(200).map((item) => ({ time: item.time, value: item.close }))

export const DefaultChart: Story = {
  args: {
    mainData: {
      label: 'MainData',
      data: mockMainData,
      unit: '$/MMbtu',
    },
    height: 598,
  },
}

export const ChartWithComparisionData: Story = {
  args: {
    mainData: {
      label: '주인공',
      data: mockMainData,
      unit: '$/MMbtu',
    },
    comparisionDataGroup: [
      {
        label: '비교군 1',
        data: comparisionData1,
        unit: 'mg',
      },
      {
        label: '비교군 2',
        data: comparisionData2,
        unit: '$/MMbtu',
      },
    ],
    height: 598,
  },
}

export const ChartWithMAData: Story = {
  args: {
    mainData: {
      label: 'MainData',
      data: mockMainData,
      unit: '$/MMbtu',
      sma5: mockSMA5,
      sma20: mockSMA20,
      sma60: mockSMA60,
      sma120: mockSMA120,
    },
    height: 598,
  },
}

export const ChartWithFullData: Story = {
  args: {
    mainData: {
      label: 'MainData',
      data: mockMainData,
      unit: '$/MMbtu',
      sma5: mockSMA5,
      sma20: mockSMA20,
      sma60: mockSMA60,
      sma120: mockSMA120,
      bb: mockbb,
    },
    comparisionDataGroup: [
      {
        label: '비교군 1',
        data: comparisionData1,
        unit: 'mg',
      },
      {
        label: '비교군 2',
        data: comparisionData2,
        unit: 'mg',
      },
      {
        label: '비교군 3',
        data: comparisionData3,
        unit: '$/MMbtu',
      },
    ],
    height: 598,
  },
}
