/* eslint-disable react-hooks/rules-of-hooks */
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { useState } from 'react'

import MIRadio from '@/components/common/input/MIRadio'

const meta = {
  title: 'common/MIRadio',
  component: MIRadio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the radio button is checked',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the radio button is disabled',
    },
    onChange: {
      action: 'changed',
      description: 'Callback fired when the state is changed',
    },
    name: {
      control: 'text',
      description: 'Name attribute for the input element',
    },
    value: {
      control: 'text',
      description: 'Value attribute for the input element',
    },
  },
  args: { onChange: fn() },
} satisfies Meta<typeof MIRadio>

export default meta

type Story = StoryObj<typeof meta>

// Basic states
export const Default: Story = {
  args: {
    value: 'default',
  },
}

export const Checked: Story = {
  args: {
    checked: true,
    value: 'checked',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'disabled',
  },
}

export const CheckedDisabled: Story = {
  args: {
    checked: true,
    disabled: true,
    value: 'checked-disabled',
  },
}

// Radio with Label
export const WithLabel: Story = {
  render: (args) => <FormControlLabel control={<MIRadio {...args} />} label="Radio with label" />,
}

// Radio Group
export const RadioGroupStory: Story = {
  render: () => {
    const [value, setValue] = useState('option1')

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value)
    }

    return (
      <FormControl>
        <FormLabel id="demo-radio-buttons-group-label">Radio Group Example</FormLabel>
        <RadioGroup aria-labelledby="demo-radio-buttons-group-label" name="radio-buttons-group" value={value} onChange={handleChange}>
          <FormControlLabel value="option1" control={<MIRadio />} label="Option 1" />
          <FormControlLabel value="option2" control={<MIRadio />} label="Option 2" />
          <FormControlLabel value="option3" control={<MIRadio />} label="Option 3" />
        </RadioGroup>
      </FormControl>
    )
  },
}

// Horizontal Radio Group
export const HorizontalRadioGroup: Story = {
  render: () => {
    const [value, setValue] = useState('option1')

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value)
    }

    return (
      <FormControl>
        <FormLabel id="demo-radio-buttons-group-label">Horizontal Radio Group</FormLabel>
        <RadioGroup row aria-labelledby="demo-radio-buttons-group-label" name="radio-buttons-group" value={value} onChange={handleChange}>
          <FormControlLabel value="option1" control={<MIRadio />} label="Option 1" />
          <FormControlLabel value="option2" control={<MIRadio />} label="Option 2" />
          <FormControlLabel value="option3" control={<MIRadio />} label="Option 3" />
        </RadioGroup>
      </FormControl>
    )
  },
}

// Mixed State Group
export const MixedStateGroup: Story = {
  render: () => {
    const [value, setValue] = useState('option1')

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value)
    }

    return (
      <FormControl>
        <FormLabel id="mixed-state-group-label">Mixed States</FormLabel>
        <RadioGroup aria-labelledby="mixed-state-group-label" name="mixed-state-group" value={value} onChange={handleChange}>
          <FormControlLabel value="option1" control={<MIRadio />} label="Standard Option" />
          <FormControlLabel value="option2" control={<MIRadio />} label="Another Option" />
          <FormControlLabel value="option3" disabled control={<MIRadio />} label="Disabled Option" />
          <FormControlLabel value="option4" disabled checked={true} control={<MIRadio />} label="Disabled Checked Option" />
        </RadioGroup>
      </FormControl>
    )
  },
}
