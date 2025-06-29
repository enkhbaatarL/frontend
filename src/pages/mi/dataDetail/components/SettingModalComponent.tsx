import DeleteIcon from '@mui/icons-material/Delete'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import { Box, CircularProgress, Grid2 as Grid, Stack, Switch, Typography } from '@mui/material'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { useForm, useStore } from '@tanstack/react-form'
import { useEffect, FC, useState } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIButton from '@/components/common/button/MIButton'
import MIChip from '@/components/common/chip/MIChip'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import MISelect from '@/components/common/select/MISelect'
import MITabs from '@/components/common/tabs/MITabs'
import useSnackbar from '@/hooks/useSnackbar'
import notificationService from '@/service/mi/notification'

interface SettingModalProps {
  open: boolean
  onClose: () => void
  onRegister?: () => void
  isNotification?: boolean
  goodsDataSourceNoList: { goodsDataSourceNm: string; goodsDataSourceNo: number; type: string }[]
  currentUnit?: string
}

interface TransactionItem {
  id: string
  title: string
  dataName: string
  numberData: number
  status: 'increase' | 'decrease'
  value: string
  unit: string
  unit2: string
  description: string
}

interface NotificationSettingItem {
  userGoodsNotificationSettingNo: number
  criticalValueSettingUnitNm: string
  goodsDataSourceNm: string
  criticalValueSettingVol: number
  notificationCriticalValueSeparateCd: string
}

const SettingModalComponent: FC<SettingModalProps> = ({
  open,
  onClose,
  isNotification = false,
  onRegister,
  goodsDataSourceNoList,
  currentUnit,
}) => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [hideFooter, setHideFooter] = useState(false)
  const [alarmStatus, setAlarmStatus] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showSnackbar } = useSnackbar()
  const [selectGoodsDataSourceNo, setSelectGoodsDataSourceNo] = useState(() =>
    goodsDataSourceNoList?.length === 1 ? goodsDataSourceNoList[0].goodsDataSourceNo : 0,
  )
  const [notificationType, setNotificationType] = useState(() =>
    goodsDataSourceNoList?.length === 1 ? goodsDataSourceNoList[0].type : 'ACTUAL',
  )
  const [disabledSwitch, setDisabledSwitch] = useState(false)

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

          if (trimmed === '-') return '음수는 입력할 수 없습니다.'

          // 0 입력 방지
          if (trimmed === '0') return '0은 입력할 수 없습니다.'

          // 앞자리 0 방지 (예: 01, 02, 003 등)
          if (/^0[0-9]/.test(trimmed)) return '0은 입력할 수 없습니다.'

          // 음수 방지
          if (trimmed.startsWith('-') || Number(trimmed) < 0) {
            return '음수는 입력할 수 없습니다.'
          }

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

  useEffect(() => {
    if (goodsDataSourceNoList?.length === 1 && selectGoodsDataSourceNo !== goodsDataSourceNoList[0].goodsDataSourceNo) {
      setSelectGoodsDataSourceNo(goodsDataSourceNoList[0].goodsDataSourceNo)
      setNotificationType(goodsDataSourceNoList[0].type)
    }
  }, [goodsDataSourceNoList, selectGoodsDataSourceNo])

  const transformNotificationData = (data: NotificationSettingItem[]): TransactionItem[] =>
    data.map((item) => {
      const isRate = ['INCRATE', 'DECRATE'].includes(item.notificationCriticalValueSeparateCd)
      const isIncrease = ['INCRATE', 'UPPER'].includes(item.notificationCriticalValueSeparateCd)

      let description = ''
      const unitText = item.criticalValueSettingUnitNm?.trim() || ''

      switch (item.notificationCriticalValueSeparateCd) {
        case 'UPPER':
          description = `{${item.goodsDataSourceNm}}이 {${item.criticalValueSettingVol}${unitText}} 이상으로 상승`
          break
        case 'LOWER':
          description = `{${item.goodsDataSourceNm}}이 {${item.criticalValueSettingVol}${unitText}} 이하로 하락`
          break
        case 'INCRATE':
          description = `{${item.goodsDataSourceNm}}이 {${item.criticalValueSettingVol}${unitText}} 상승률 초과`
          break
        case 'DECRATE':
          description = `{${item.goodsDataSourceNm}}이 {${item.criticalValueSettingVol}${unitText}} 하락률 초과`
          break
        default:
          description = `{${item.goodsDataSourceNm}}이 {${item.criticalValueSettingVol}${unitText}}`
      }

      return {
        id: item.userGoodsNotificationSettingNo.toString(),
        title: isRate ? '변동률' : '임계값',
        dataName: item.goodsDataSourceNm,
        numberData: item.criticalValueSettingVol,
        status: isIncrease ? 'increase' : 'decrease',
        value: isIncrease ? '상승' : '하락',
        unit: item.criticalValueSettingUnitNm,
        unit2: isRate ? '초과' : isIncrease ? '이상' : '이하',
        description,
      }
    })

  const handleDelete = async (id: string) => {
    if (!selectGoodsDataSourceNo) {
      showSnackbar('상품 데이터 소스 정보가 없습니다.', { variant: 'error' })
      return
    }

    try {
      const response = await notificationService.deleteNotificationSetting(selectGoodsDataSourceNo, id)

      if (response.status) {
        setTransactions((prevTransactions) => prevTransactions.filter((transaction) => transaction.id !== id))
        showSnackbar('삭제되었습니다.', { variant: 'success' })
      } else {
        showSnackbar(response.message || '알림 삭제에 실패했습니다.', { variant: 'error' })
      }
    } catch (error) {
      console.error('알림 삭제 오류:', error)
      showSnackbar('알림 삭제 중 오류가 발생했습니다.', { variant: 'error' })
    }
  }

  const handleClose = () => {
    onClose()
    setHideFooter(false)
  }

  const fetchNotificationSettings = async () => {
    if (!selectGoodsDataSourceNo) return

    try {
      setIsLoadingTransactions(true)
      const response = await notificationService.getGoodsDataNotificationSettingList(selectGoodsDataSourceNo, {
        page: 1,
        size: 20,
      })

      if (response.detail) {
        const transformedData = transformNotificationData(response.detail)
        setTransactions(transformedData)
      }

      const notificationSettingResponse = await notificationService.getNotificationSetting()
      setAlarmStatus(notificationSettingResponse?.isUserNotificationSetting)
    } catch (error) {
      console.error('알림 설정 목록 조회 오류:', error)
      showSnackbar('알림 설정 목록을 불러오는데 실패했습니다.', { variant: 'error' })
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const handleRegister = async () => {
    if (!selectGoodsDataSourceNo) {
      showSnackbar('상품 데이터 소스 정보가 없습니다.', { variant: 'error' })
      return
    }

    try {
      setIsSubmitting(true)

      const formValues = form.state.values

      // notificationCriticalValueSeparateCd 값 결정
      let notificationCriticalValueSeparateCd: string

      if (formValues.standard === 'rate' && formValues.status === 'rise') {
        notificationCriticalValueSeparateCd = 'INCRATE'
      } else if (formValues.standard === 'rate' && formValues.status === 'fall') {
        notificationCriticalValueSeparateCd = 'DECRATE'
      } else if (formValues.standard === 'threshold' && formValues.status === 'rise') {
        notificationCriticalValueSeparateCd = 'UPPER'
      } else if (formValues.standard === 'threshold' && formValues.status === 'fall') {
        notificationCriticalValueSeparateCd = 'LOWER'
      } else {
        showSnackbar('알림 설정 값이 올바르지 않습니다.', { variant: 'error' })
        return
      }

      const requestBody = {
        notificationCriticalValueSeparateCd,
        criticalValueSettingVol: Number(formValues.ratio),
        notificationType,
      }

      const response = await notificationService.registerNotificationSetting(selectGoodsDataSourceNo, requestBody)

      if (response.status) {
        showSnackbar('등록되었습니다.', { variant: 'success' })
        onRegister?.()

        // 등록 후 목록 새로고침
        await fetchNotificationSettings()

        handleClose()

        // 폼 초기화
        form.reset()
      } else {
        showSnackbar(response.message || '알림 등록에 실패했습니다.', { variant: 'error' })
      }
    } catch (error) {
      console.error('알림 등록 오류:', error)
      showSnackbar('알림 등록 중 오류가 발생했습니다.', { variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangeStatus = async (value: boolean) => {
    if (disabledSwitch) return

    setDisabledSwitch(true)
    try {
      await notificationService.updateNotificationSetting(!alarmStatus)
      setAlarmStatus(value)
    } finally {
      setDisabledSwitch(false)
    }
  }

  useEffect(() => {
    if (open) {
      setHideFooter(false)
      fetchNotificationSettings()
    }
  }, [open, selectGoodsDataSourceNo])

  const formCanSubmit = useStore(form.store, (state) => state.isDirty && state.canSubmit)

  const tabsData = [
    {
      label: '알람 설정',
      content: (
        <Grid container direction={'column'} pt={5} gap={5}>
          {goodsDataSourceNoList?.length > 1 && (
            <form.Field name="standard">
              {() => (
                <MIField labelSize="sm" required label="예측 타겟">
                  <MISelect
                    fullWidth
                    type="button"
                    value={String(selectGoodsDataSourceNo)}
                    onChange={(e) => {
                      const selectedNo = Number(e.target.value)
                      const selectedItem = goodsDataSourceNoList.find((item) => item.goodsDataSourceNo === selectedNo)

                      setSelectGoodsDataSourceNo(selectedNo)
                      if (selectedItem) {
                        setNotificationType(selectedItem.type)
                      }
                    }}
                    options={goodsDataSourceNoList.map(({ goodsDataSourceNm, goodsDataSourceNo }) => ({
                      label: goodsDataSourceNm,
                      value: String(goodsDataSourceNo),
                    }))}
                  />
                </MIField>
              )}
            </form.Field>
          )}
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
                  type="button"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as string)}
                  useAllOption={false}
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
                      appendContent={standardField.state.value === 'threshold' ? currentUnit : '%'}
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
                        {item.description}
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

  const visibleTabs = isNotification ? [tabsData[1]] : tabsData

  return (
    <MIConfirm
      open={open}
      title="알람"
      width={500}
      handleClose={onClose}
      hideFooter={hideFooter || isLoadingTransactions}
      actions={[
        { label: '취소', variant: 'outlined', color: 'gray', onClick: handleClose },
        {
          label: '등록',
          disabled: !formCanSubmit || isSubmitting,
          variant: 'filled',
          color: 'primary',
          onClick: handleRegister,
        },
      ]}
    >
      {isLoadingTransactions ? (
        <Box display={'flex'} alignItems={'center'} justifyContent={'center'} height={320}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ position: 'absolute', right: 0, top: 14, zIndex: 1 }}>
            <Stack direction="row" alignItems="center">
              <Switch size={'small'} checked={alarmStatus} onChange={(e) => handleChangeStatus(e.target.checked)} />
              <Typography width={'54px'} variant="body2M14" color={'gray.70'} whiteSpace={'nowrap'} onClick={(e) => e.stopPropagation()}>
                {alarmStatus ? '알람 ON' : '알람 OFF'}
              </Typography>
            </Stack>
          </Box>
          <MITabs onChange={(value) => setHideFooter(!!value)} arrayItem={visibleTabs} />
        </Box>
      )}
    </MIConfirm>
  )
}

export default SettingModalComponent
