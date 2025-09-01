import { Checkbox, CheckboxProps } from '@mui/material'
import { styled } from '@mui/material/styles'

const BpIcon = styled('span')(({ theme }) => ({
  borderRadius: 4,
  width: 16,
  height: 16,
  border: '2px solid #CED4DA',
  boxSizing: 'border-box',
  flexShrink: 0,
  backgroundColor: '#fff',
  '.Mui-focusVisible &': {
    outline: '2px auto rgba(19,124,189,.6)',
    outlineOffset: 2,
  },
  '.Mui-checked': {
    borderColor: '#2E3F5E',
  },
  'input:hover ~ &': {
    backgroundColor: '#ebf1f5',
    borderColor: '#2E3F5E',
    ...theme.applyStyles('dark', {
      backgroundColor: '#30404d',
    }),
  },
  'input:disabled ~ &': {
    boxShadow: 'none',
    background: '#E9ECEF',
    ...theme.applyStyles('dark', {
      background: 'rgba(57,75,89,.5)',
    }),
    outline: 'none',
    borderColor: '#CED4DA',
  },
  'input:disabled ~ span::before': {
    outline: 'none',
  },
  ...theme.applyStyles('dark', {
    boxShadow: '0 0 0 1px rgb(16 22 26 / 40%)',
    backgroundColor: '#394b59',
    backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.05),hsla(0,0%,100%,0))',
  }),
}))

const BpCheckedIcon = styled(BpIcon)({
  backgroundColor: '#2E3F5E',
  backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
  boxSizing: 'border-box',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: 'none',
  '&::before': {
    boxSizing: 'border-box',
    display: 'block',
    width: '100%',
    height: '100%',
    backgroundSize: 14,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    // outline: '1px auto #2E3F5E',
    // outlineOffset: 0,
    backgroundImage:
      'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Cpath' +
      ' fill-rule=\'evenodd\' clip-rule=\'evenodd\' d=\'M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 ' +
      '1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z\' fill=\'%23fff\'/%3E%3C/svg%3E")',
    content: '""',
  },
  'input:hover ~ &': {
    backgroundColor: '#2E3F5E',
  },
})
const AdminCheckbox = (props: CheckboxProps) => <Checkbox checkedIcon={<BpCheckedIcon />} icon={<BpIcon />} {...props} />

export default AdminCheckbox
