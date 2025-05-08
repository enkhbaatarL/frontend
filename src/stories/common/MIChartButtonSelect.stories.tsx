import { Meta, StoryObj } from '@storybook/react'

import MIChartButtonSelect from '@/components/common/chart/MIChartButtonSelect'
import CandlestickChartIcon from '@/components/common/icons/CandlestickChartIcon'
import CandlestickChartOutlineIcon from '@/components/common/icons/CandlestickChartOutlineIcon'
import ShowChartIcon from '@/components/common/icons/ShowChartIcon'

const meta = {
  title: 'common/chart/MIChartButtonSelect',
  component: MIChartButtonSelect,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  args: {},
} satisfies Meta<typeof MIChartButtonSelect>

export default meta

type Story = StoryObj<typeof meta>

export const ButtonInterval: Story = {
  args: {
    value: {
      value: 'day',
      label: '1 day',
    },
    options: [
      {
        value: 'day',
        label: '1 day',
      },
      {
        value: 'week',
        label: '1 week',
      },
      {
        value: 'month',
        label: '1 month',
      },
    ],
    minWidthMenu: '97px',
  },
}

export const ButtonChartType: Story = {
  args: {
    value: {
      value: 'candles',
      label: 'Candles',
      icon: <CandlestickChartOutlineIcon />,
      activeIcon: <CandlestickChartIcon />,
    },
    options: [
      {
        value: 'line',
        label: 'Line',
        icon: <ShowChartIcon />,
        activeIcon: <ShowChartIcon />,
      },
      {
        value: 'candles',
        label: 'Candles',
        icon: <CandlestickChartOutlineIcon />,
        activeIcon: <CandlestickChartIcon />,
      },
    ],
    minWidthMenu: '130px',
  },
}

export const ButtonChartUnit: Story = {
  args: {
    value: {
      value: 'm3',
      label: (
        <>
          m<sup>3</sup>
        </>
      ),
    },
    options: [
      {
        value: 'm3',
        label: (
          <>
            m<sup>3</sup>
          </>
        ),
      },
      {
        value: 'mmBtu',
        label: 'MMBtu',
      },
      {
        value: 'cf',
        label: 'cf',
      },
      {
        value: 'bcf',
        label: 'Bcf',
      },
      {
        value: 'tcf',
        label: 'Tcf',
      },
      {
        value: 'mt',
        label: 'mt',
      },
    ],
    minWidthMenu: '95px',
  },
}
