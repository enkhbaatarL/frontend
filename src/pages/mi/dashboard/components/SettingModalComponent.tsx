import DeleteIcon from '@mui/icons-material/Delete'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { useForm, useStore } from '@tanstack/react-form'
import { useEffect, FC, useState } from 'react'

import AdminConfirm from '@/components/admin/AdminConfirm'
import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIButton from '@/components/common/button/MIButton'
import MIChip from '@/components/common/chip/MIChip'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import MISelect from '@/components/common/select/MISelect'
import MITabs from '@/components/common/tabs/MITabs'
import useSnackbar from '@/hooks/useSnackbar'

interface SettingModalProps {
  open: boolean
  onClose: () => void
}

interface TransactionItem {
  id: string
  title: string
  dataName: string
  numberData: number
  status: 'increase' | 'decrease'
  value: string
}

const SettingModalComponent: FC<SettingModalProps> = ({ open, onClose }) => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: '1',
      title: '번호롤',
      dataName: '선택한정형데이터명',
      numberData: 10,
      status: 'increase',
      value: '상승',
    },
    {
      id: '2',
      title: '번호롤',
      dataName: '선택한정형데이터명',
      numberData: 10,
      status: 'increase',
      value: '상승',
    },
    {
      id: '3',
      title: '번호롤',
      dataName: '선택한정형데이터명',
      numberData: 20,
      status: 'increase',
      value: '상승',
    },
    {
      id: '4',
      title: '번호롤',
      dataName: '선택한정형데이터명',
      numberData: 3,
      status: 'decrease',
      value: '하락',
    },
    {
      id: '5',
      title: '번호롤',
      dataName: '선택한정형데이터명',
      numberData: 5,
      status: 'decrease',
      value: '하락',
    },
    {
      id: '6',
      title: '번호롤',
      dataName: '선택한정형데이터명',
      numberData: 20,
      status: 'decrease',
      value: '하락',
    },
    {
      id: '7',
      title: '번호롤',
      dataName: '선택한정형데이터명',
      numberData: 20,
      status: 'decrease',
      value: '하락',
    },
    {
      id: '8',
      title: '번호롤',
      dataName: '선택한정형데이터명',
      numberData: 20,
      status: 'decrease',
      value: '하락',
    },
    {
      id: '9',
      title: '번호롤',
      dataName: '선택한정형데이터명',
      numberData: 20,
      status: 'decrease',
      value: '하락',
    },
    {
      id: '10',
      title: '번호롤',
      dataName: '선택한정형데이터명',
      numberData: 20,
      status: 'decrease',
      value: '하락',
    },
  ])
  const [hideFooter, setHideFooter] = useState(false)
  const { showSnackbar } = useSnackbar()
  const handleDelete = (id: string) => {
    setTransactions((prevTransactions) => prevTransactions.filter((transaction) => transaction.id !== id))
    showSnackbar('삭제되었습니다.', { variant: 'success' })
  }
  const handleClose = () => {
    onClose()
    setHideFooter(false)
  }

  useEffect(() => {
    if (open) {
      setHideFooter(false)
    }
  }, [open])

  const form = useForm({
    defaultValues: {
      standard: 'rate',
      status: '',
      ratio: '',
    },
    validators: {
      onChange: ({ value }) => {
        const isRequired = (v: string) => (v.trim().length === 0 ? '비율은 필수입니다' : undefined)
        const isNumber = (v: string) => (v.trim().length > 0 && isNaN(Number(v)) ? '숫자만 입력해주세요' : undefined)
        const noZeroOrLeadingZero = (v: string) => {
          const trimmed = v.trim()

          if (trimmed === '0') return '0은 입력할 수 없습니다.'
          if (/^0[0-9]/.test(trimmed)) return '0은 입력할 수 없습니다.'

          return undefined
        }

        return {
          fields: {
            status: isRequired(value.status),
            ratio: isRequired(value.ratio) ?? isNumber(value.ratio) ?? noZeroOrLeadingZero(value.ratio),
          },
        }
      },
    },
  })
  const formCanSubmit = useStore(form.store, (state) => state.isDirty && state.canSubmit)
  const tabsData = [
    {
      label: '알람 설정',
      content: (
        <Grid container direction={'column'} pt={5} gap={5}>
          <form.Field name="standard">
            {(field) => (
              <MIField labelSize="sm" label="기준">
                <RadioGroup row value={field.state.value} onChange={(e) => field.handleChange(e.target.value)}>
                  <FormControlLabel value="rate" control={<Radio />} label="변동률 기준" />
                  <FormControlLabel value="threshold" control={<Radio />} label="임계값 기준" />
                </RadioGroup>
              </MIField>
            )}
          </form.Field>
          <form.Field name="status">
            {(field) => (
              <MIField labelSize="sm" required label="조건">
                <MISelect
                  fullWidth
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as string)}
                  options={[
                    { label: '상승', value: 'rise' },
                    { label: '하락', value: 'fall' },
                  ]}
                />
              </MIField>
            )}
          </form.Field>
          <form.Field name="standard">
            {(standardField) => (
              <form.Field name="ratio">
                {(field) => (
                  <MIField
                    labelSize="sm"
                    subText={standardField.state.value === 'threshold' ? '' : '기준 : 직전값'}
                    required
                    label={standardField.state.value === 'threshold' ? '임계값' : '비율'}
                  >
                    <MIInput
                      error={field.state.value !== '' && field.state.meta.errors.length !== 0}
                      errorMessage={field.state.meta.errors[0] as string}
                      value={field.state.value}
                      appendContent={standardField.state.value === 'threshold' ? '{기본단위}' : '%'}
                      size="h36"
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                      }}
                    />
                  </MIField>
                )}
              </form.Field>
            )}
          </form.Field>
        </Grid>
      ),
    },
    {
      label: (
        <Grid gap={2} container alignItems={'center'}>
          내가 설정한 알람
          <MIChip sx={{ border: 0 }} label={transactions.length} color={'gray'} size={'h24'} fontType="chipM" />
        </Grid>
      ),
      content: (
        <>
          {transactions && transactions.length === 0 ? (
            <Box
              display={'flex'}
              borderBottom={'1px solid'}
              borderColor={'gray.30'}
              alignItems={'center'}
              justifyContent={'center'}
              bgcolor={'gray.5'}
              textAlign={'center'}
              height={460}
            >
              <Box display="flex" flexDirection="column" rowGap="10px" alignItems="center">
                <ErrorOutlineIcon />
                <Typography variant="body3SB12" color="gray.60">
                  설정된 알람이 없습니다.
                </Typography>
              </Box>
            </Box>
          ) : (
            <ScrollWrapper styScroll={{ right: 0 }} sx={{ minHeight: 460 }} maxHeight={615.41}>
              <Grid direction={'column'} container>
                {transactions.map((item, index) => (
                  <Grid
                    borderBottom={index === transactions.length - 1 ? '0' : '1px solid'}
                    borderColor={'gray.20'}
                    key={index}
                    gap={2}
                    py={3}
                    px={4}
                    container
                    alignItems={'center'}
                    justifyContent={'space-between'}
                  >
                    <Box>
                      <Grid gap={2} container alignItems={'center'}>
                        <Typography color={'gray.90'} variant={'body2SB14'}>
                          {item.title}
                        </Typography>
                        <MIChip label={item.value} color={item.status === 'increase' ? 'green-climb' : 'red-decline'} size={'h20'} />
                      </Grid>
                      <Typography variant="body2R14" component="div" mt={1} color={'gray.70'}>
                        ({item.dataName})이 ({item.numberData}%) 상승률 초과
                      </Typography>
                    </Box>
                    <MIButton
                      onClick={() => handleDelete(item.id)}
                      size={'h28'}
                      contentType={'icon'}
                      type={'ghost'}
                      color={'gray'}
                      startIcon={<DeleteOutlineOutlinedIcon sx={{ color: '#868E96' }} fontSize={'small'} />}
                      hoverIcon={<DeleteIcon sx={{ color: '#343A40' }} fontSize={'small'} />}
                    />
                  </Grid>
                ))}
              </Grid>
            </ScrollWrapper>
          )}
        </>
      ),
    },
  ]

  return (
    <AdminConfirm
      open={open}
      title="알람"
      width={500}
      handleClose={onClose}
      hideFooter={hideFooter}
      actions={[
        { label: '취소', variant: 'outlined', color: 'gray', onClick: handleClose },
        { label: '등록', disabled: !formCanSubmit, variant: 'filled', color: 'primary', onClick: handleClose },
      ]}
    >
      <MITabs onChange={(value) => setHideFooter(!!value)} arrayItem={tabsData} />
    </AdminConfirm>
  )
}

export default SettingModalComponent
