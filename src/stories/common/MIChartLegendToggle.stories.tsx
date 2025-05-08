import { Meta, StoryObj } from '@storybook/react'

import MIChartLegendToggle from '@/components/common/chart/MIChartLegendToggle'

const meta = {
  title: 'common/chart/MIChartLegendToggle',
  component: MIChartLegendToggle,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  args: {},
} satisfies Meta<typeof MIChartLegendToggle>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultLegendToggle: Story = {
  args: {
    labels: ['비교군 데이터명 비교군 데이터명', '비교군 데이터명', '비교군 데이터명 비교군 데이터명'],
  },
}

export const LegendToggleWithMoreThan3Legend: Story = {
  args: {
    labels: [
      '비교군 데이터명 비교군 데이터명',
      '비교군 데이터명',
      '비교군 데이터명 비교군 데이터명',
      '비교군 데이터명',
      '비교군 데이터명 비교군 데이터명',
    ],
  },
}
