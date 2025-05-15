import { Box, FormControlLabel, Radio, RadioGroup, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { t } from 'i18next'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import AdminCheckboxField from '@/components/admin/AdminCheckboxField'
import AdminChip from '@/components/admin/AdminChip'
import AdminDatePicker from '@/components/admin/AdminDatePicker'
import AdminTable, { AdminTableCell } from '@/components/admin/AdminTable'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import DetailItem from '@/components/common/detail-item/DetailItem'
import Flex from '@/components/common/display/Flex'
import DownloadIcon from '@/components/common/icons/DownloadIcon'
import PersonIcon from '@/components/common/icons/PersonIcon'
import VisibilityIcon from '@/components/common/icons/VisibilityIcon'
import MICheckBox from '@/components/common/input/MICheckBox'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import companiesService, { ICompanySetting, IIndividualSettings, IUpdateUserPermissionRequest, IDetail } from '@/service/admin/companies'

const AdminCustomerCompanyProductDetailPageHeader = (props: {
  onChange: (value: boolean) => void
  label: string
  value: boolean
  editMode: boolean
  changeMode: (value: boolean) => void
  onCancel: () => void
  onSave: () => void
}) => (
  <Flex gap={4} align="center">
    {props.editMode ? (
      <Box display={'flex'} columnGap={'10px'}>
        <AdminButton variant="outlined" color="secondary" size="h34" onClick={() => props.onCancel()}>
          취소
        </AdminButton>
        <AdminButton variant="contained" color="primary" size="h34" onClick={() => props.onSave()}>
          저장
        </AdminButton>
      </Box>
    ) : (
      <>
        <FormControlLabel
          control={<Switch defaultChecked checked={props.value} onChange={(e) => props.onChange(e.target.checked)} />}
          label={props.label}
        />
        <AdminButton variant="contained" color="primary" size="h34" onClick={() => props.changeMode(true)}>
          상세 권한 설정
        </AdminButton>
      </>
    )}
  </Flex>
)

const CustomPageTitle = (props: { isEdit: boolean; isActive: boolean }) => (
  <Box display="flex" alignItems="center" columnGap={'10px'}>
    {props.isEdit && <AdminChip label={props.isActive ? t('사용중') : t('미사용')} color={props.isActive ? 'green' : 'white'} size="h24" />}
    <Typography color="gray.90" variant="heading2">
      {props.isEdit ? '상품 상세 권한 설정' : '상품 상세'}
    </Typography>
  </Box>
)

const AdminCustomerCompanyProductDetailPage = () => {
  const { showSnackbar } = useSnackbar()
  const { setCustomComponent, setSubHeader, setCustomTitle } = useAdminHeader()
  const [openConfirmActive, setOpenConfirmActive] = useState(false)
  const [isDetailPermissionSetting, setIsDetailPermissionSetting] = useState(false)
  const [openCancelConfirm, setOpenCancelConfirm] = useState(false)
  const [openSaveConfirm, setOpenSaveConfirm] = useState(false)
  const queryClient = useQueryClient()

  const { companyNo, providerNo, goodsNo } = useParams()
  const { state } = useLocation()
  const { companyNm } = state as { companyNm: string }

  const { data: goodsDetailData } = useQuery({
    queryKey: ['goodsDetail', companyNo, providerNo, goodsNo],
    queryFn: async () => await companiesService.getGoodsDetail(Number(companyNo), Number(providerNo), Number(goodsNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo || !!providerNo || !!goodsNo,
  })

  const { data: goodsDetailLatestData } = useQuery({
    queryKey: ['goodsDetailLatest', companyNo, providerNo, goodsNo],
    queryFn: async () => await companiesService.getGoodsLatestUpdated(Number(companyNo), Number(providerNo), Number(goodsNo)),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo || !!providerNo || !!goodsNo,
  })

  const { data: userPermissions } = useQuery({
    queryKey: ['userPermissions', companyNo, providerNo, goodsNo],
    queryFn: async () =>
      await companiesService.getUserPermissions(Number(companyNo), Number(providerNo), Number(goodsNo), { page: 1, size: 20 }),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: !!companyNo || !!providerNo || !!goodsNo,
  })

  const [isActive, setIsActive] = useState<boolean>(true)
  const [permission, setPermission] = useState<string>('')
  const [isEditViewable, setIsEditViewable] = useState<boolean>(false)
  const [isEditDownloadable, setIsEditDownloadable] = useState<boolean>(false)
  const [isEditUsageBeginDate, setIsEditUsageBeginDate] = useState<boolean>(false)
  const [isEditUsageEndDate, setIsEditUsageEndDate] = useState<boolean>(false)

  // 회사 권한 설정 상태
  const [companyPermission, setCompanyPermission] = useState<ICompanySetting>({
    isViewable: goodsDetailData?.companySetting ? goodsDetailData.companySetting.isViewable : false,
    isDownloadable: goodsDetailData?.companySetting ? goodsDetailData.companySetting.isDownloadable : false,
    usageBeginDate: goodsDetailData?.companySetting ? goodsDetailData.companySetting.usageBeginDate : '',
    usageEndDate: goodsDetailData?.companySetting ? goodsDetailData.companySetting.usageEndDate : '',
  })

  const [checkList, setCheckList] = useState<
    Record<number, { isViewable: boolean; isDownloadable: boolean; usageBeginDate: string; usageEndDate: string }>
  >([])

  useEffect(() => {
    if (goodsDetailData) {
      setIsActive(goodsDetailData.isUsed)
      setCompanyPermission({
        isViewable: goodsDetailData?.companySetting ? goodsDetailData.companySetting.isViewable : false,
        isDownloadable: goodsDetailData?.companySetting ? goodsDetailData.companySetting.isDownloadable : false,
        usageBeginDate: goodsDetailData?.companySetting ? goodsDetailData.companySetting.usageBeginDate : '',
        usageEndDate: goodsDetailData?.companySetting ? goodsDetailData.companySetting.usageEndDate : '',
      })
      setPermission(goodsDetailData.goodsAuthManagementSeparateCd)
      setCustomComponent(
        <AdminCustomerCompanyProductDetailPageHeader
          editMode={isDetailPermissionSetting}
          changeMode={setIsDetailPermissionSetting}
          onSave={() => setOpenSaveConfirm(true)}
          onCancel={() => setOpenCancelConfirm(true)}
          value={isActive}
          onChange={() => setOpenConfirmActive(true)}
          label={isActive ? '사용' : '미사용'}
        />,
      )
      setSubHeader(
        <DetailItem
          title={
            <Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography variant="body1" color="gray.70">
                  {companyNm}
                </Typography>
                <Box width={'1px'} height={'14px'} bgcolor="common.black" mx="10px" />
                <Typography variant="contentTitle" color="gray.90">
                  {goodsDetailData?.goodsNm}
                </Typography>
              </Box>
            </Box>
          }
          subTitle={
            <Typography variant="subtext" color="gray.60">
              {goodsDetailData?.goodsExpn}
            </Typography>
          }
          fields={[
            {
              label: t('등록일'),
              value: dayjs(goodsDetailData?.auditInfo.createDt).format('YYYY-MM-DD'),
            },
            {
              label: t('수정일'),
              value: goodsDetailLatestData ? dayjs(goodsDetailLatestData?.modifyDt).format('YYYY-MM-DD') : '-',
            },
            {
              label: t('등록자'),
              value: String(goodsDetailData?.auditInfo.createUserNm),
            },
            {
              label: t('수정자'),
              value: goodsDetailLatestData ? String(goodsDetailLatestData?.modifyUserNm) : '-',
            },
          ]}
          tooltipMessage="기본 정보 수정"
        />,
      )
      setCustomTitle(<CustomPageTitle isEdit={isDetailPermissionSetting} isActive={isActive} />)
    }

    return () => {
      setCustomComponent(null)
      setSubHeader(null)
      setCustomTitle(null)
    }
  }, [
    setCustomComponent,
    setSubHeader,
    isActive,
    isDetailPermissionSetting,
    goodsDetailData,
    goodsDetailLatestData,
    companyNm,
    setCustomTitle,
  ])

  // 개인 권한 설정 상태
  const [individualPermissions, setIndividualPermissions] = useState<IIndividualSettings[]>([])

  // 권한 설정 업데이트
  const updatePermissions = async () => {
    try {
      const requestBody: IUpdateUserPermissionRequest = {
        isUsed: isActive,
        goodsAuthManagementSeparateCd: permission,
        ...(permission === 'COMPANY' && { companySetting: companyPermission }),
        ...(permission === 'INDIVIDUAL' && { IndividualSettings: individualPermissions }),
      }

      await companiesService.updateUserPermission(Number(companyNo), Number(providerNo), Number(goodsNo), requestBody)
      setOpenSaveConfirm(false)
      showSnackbar('저장되었습니다.', { variant: 'success' })
      setIsDetailPermissionSetting(false)
      await queryClient.invalidateQueries({ queryKey: ['goodsDetail', companyNo, providerNo, goodsNo] })
      await queryClient.invalidateQueries({ queryKey: ['goodsDetailLatest', companyNo, providerNo, goodsNo] })
      await queryClient.invalidateQueries({ queryKey: ['userPermissions', companyNo, providerNo, goodsNo] })
      setIndividualPermissions([])
      setCompanyPermission({
        isViewable: goodsDetailData?.companySetting ? goodsDetailData.companySetting.isViewable : false,
        isDownloadable: goodsDetailData?.companySetting ? goodsDetailData.companySetting.isDownloadable : false,
        usageBeginDate: goodsDetailData?.companySetting ? goodsDetailData.companySetting.usageBeginDate : '',
        usageEndDate: goodsDetailData?.companySetting ? goodsDetailData.companySetting.usageEndDate : '',
      })
      setIsEditViewable(false)
      setIsEditDownloadable(false)
      setIsEditUsageBeginDate(false)
      setIsEditUsageEndDate(false)
      setCheckList([])
    } catch (error) {
      console.error(error)
    }
  }

  // 권한 변경
  const handlePermissionChange = (e: ChangeEvent<HTMLInputElement>, row: IDetail, type?: boolean) => {
    const { checked, name } = e.target
    const userNo = row.userNo
    const targetUser = userPermissions?.detail?.find((user: IDetail) => user.userNo === userNo)
    if (!targetUser) return

    const newPermission = {
      userNo: targetUser.userNo,
      isViewable: goodsDetailData?.companySetting ? checkList[userNo].isViewable : name === 'isViewable' ? checked : targetUser.isViewable,
      isDownloadable: goodsDetailData?.companySetting
        ? checkList[userNo].isDownloadable
        : name === 'isDownloadable'
          ? checked
          : targetUser.isDownloadable,
      usageBeginDate: type ? dayjs().format('YYYYMMDD') : targetUser.usageBeginDate,
      usageEndDate: type ? dayjs().add(10, 'year').endOf('year').format('YYYYMMDD') : targetUser.usageEndDate,
    }

    setIndividualPermissions((prev) => {
      const updated = prev.map((p) => (p.userNo === userNo ? newPermission : p))

      const exists = prev.some((p) => p.userNo === userNo)
      return exists ? updated : [...prev, newPermission]
    })
  }

  // 권한 적용 기간 변경
  const handleDateChange = (value: string, row: IDetail, type: string, isNew?: boolean) => {
    const userNo = row.userNo

    const targetUser = userPermissions?.detail?.find((user: IDetail) => user.userNo === userNo)

    if (!targetUser) return

    const newPermission = {
      userNo: targetUser.userNo,
      isViewable: isNew ? checkList[userNo].isViewable : targetUser.isViewable,
      isDownloadable: isNew ? checkList[userNo].isDownloadable : targetUser.isDownloadable,
      usageBeginDate: type === 'usageBeginDate' ? value : isNew ? checkList[userNo].usageBeginDate : targetUser.usageBeginDate,
      usageEndDate: type === 'usageEndDate' ? value : isNew ? checkList[userNo].usageEndDate : targetUser.usageEndDate,
    }

    setIndividualPermissions((prev) => {
      const updated = prev.map((p) => (p.userNo === userNo ? newPermission : p))

      const exists = prev.some((p) => p.userNo === userNo)
      return exists ? updated : [...prev, newPermission]
    })
  }

  useEffect(() => {
    if (userPermissions?.detail) {
      const initialCheckList = userPermissions.detail.reduce(
        (acc, user) => {
          acc[user.userNo] = {
            isViewable: false,
            isDownloadable: false,
            usageBeginDate: dayjs().format('YYYYMMDD'),
            usageEndDate: dayjs().add(10, 'year').endOf('year').format('YYYYMMDD'),
          }
          return acc
        },
        {} as Record<number, { isViewable: boolean; isDownloadable: boolean; usageBeginDate: string; usageEndDate: string }>,
      )
      setCheckList(initialCheckList)
    }
  }, [userPermissions])

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'userNo',
        headerName: t('No.'),
        width: 50,
        sortable: false,
        align: 'center',
        renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
      },
      {
        field: 'userNm',
        headerName: '이름',
        width: 120,
        sortable: false,
        renderCell: (params) => <AdminTableCell>{params.value}</AdminTableCell>,
      },
      {
        field: 'department',
        headerName: t('직위/부서명/회사명'),
        width: 392,
        flex: 1,
        sortable: false,
        renderCell: (params) => <AdminTableCell>{`${params.row.onDutyNm} / ${params.row.departmentNm} / ${companyNm}`}</AdminTableCell>,
      },
      {
        field: 'isViewable',
        headerName: '조회 권한',
        width: 100,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        name: 'isViewable',
        renderCell: (params) =>
          goodsDetailData?.goodsAuthManagementSeparateCd === 'INDIVIDUAL' ? (
            <MICheckBox
              checked={params.row.isViewable}
              onChange={(e) => {
                if (e.target.checked === false) params.row.isDownloadable = false
                params.row.isViewable = e.target.checked
                handlePermissionChange(e, params.row)
              }}
              disabled={!isDetailPermissionSetting}
            />
          ) : (
            <MICheckBox
              checked={checkList[params.row.userNo].isViewable}
              onChange={(e) => {
                if (e.target.checked === false) checkList[params.row.userNo].isDownloadable = false
                checkList[params.row.userNo].isViewable = e.target.checked
                handlePermissionChange(e, params.row, true)
              }}
              disabled={!isDetailPermissionSetting}
            />
          ),
      },
      {
        field: 'isDownloadable',
        headerName: t('다운로드 권한'),
        width: 100,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        name: 'isDownloadable',
        renderCell: (params) =>
          goodsDetailData?.goodsAuthManagementSeparateCd === 'INDIVIDUAL' ? (
            <MICheckBox
              checked={params.row.isDownloadable}
              onChange={(e) => {
                if (e.target.checked === true) params.row.isViewable = true
                params.row.isDownloadable = e.target.checked
                handlePermissionChange(e, params.row)
              }}
              disabled={!isDetailPermissionSetting}
            />
          ) : (
            <MICheckBox
              checked={checkList[params.row.userNo].isDownloadable}
              onChange={(e) => {
                if (e.target.checked === true) checkList[params.row.userNo].isViewable = true
                checkList[params.row.userNo].isDownloadable = e.target.checked
                handlePermissionChange(e, params.row, true)
              }}
              disabled={!isDetailPermissionSetting}
            />
          ),
      },
      {
        field: 'usageBeginDate',
        headerName: t('권한 적용 기간'),
        width: 391,
        sortable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) =>
          goodsDetailData?.goodsAuthManagementSeparateCd === 'INDIVIDUAL' ? (
            <Box display={'flex'} alignItems={'center'} maxWidth={'100%'} padding="7px 12px">
              <AdminDatePicker
                readOnly={!isDetailPermissionSetting || (!params.row.isViewable && !params.row.isDownloadable)}
                size="h26"
                onChange={(e: Dayjs | null) => {
                  if (e) {
                    const value = e.format('YYYYMMDD')
                    params.row.usageBeginDate = value
                    handleDateChange(value, params.row, 'usageBeginDate')
                  }
                }}
                value={dayjs(
                  `${params.row.usageBeginDate.slice(0, 4)}-${params.row.usageBeginDate.slice(4, 6)}-${params.row.usageBeginDate.slice(6, 8)}`,
                )}
              />
              <Typography component={'div'} mx={'8px'} color="gray.50" variant="breadcrumbs">
                ~
              </Typography>
              <AdminDatePicker
                readOnly={!isDetailPermissionSetting || (!params.row.isViewable && !params.row.isDownloadable)}
                size="h26"
                onChange={(e: Dayjs | null) => {
                  if (e) {
                    const value = e.format('YYYYMMDD')
                    params.row.usageEndDate = value
                    handleDateChange(value, params.row, 'usageEndDate')
                  }
                }}
                value={dayjs(
                  `${params.row.usageEndDate.slice(0, 4)}-${params.row.usageEndDate.slice(4, 6)}-${params.row.usageEndDate.slice(6, 8)}`,
                )}
              />
            </Box>
          ) : (
            <Box display={'flex'} alignItems={'center'} maxWidth={'100%'} padding="7px 12px">
              <AdminDatePicker
                readOnly={
                  !isDetailPermissionSetting || (!checkList[params.row.userNo].isViewable && !checkList[params.row.userNo].isDownloadable)
                }
                size="h26"
                onChange={(e: Dayjs | null) => {
                  if (e) {
                    const value = e.format('YYYYMMDD')
                    checkList[params.row.userNo].usageBeginDate = value
                    handleDateChange(value, params.row, 'usageBeginDate', true)
                  }
                }}
                value={dayjs(checkList[params.row.userNo].usageBeginDate)}
              />
              <Typography component={'div'} mx={'8px'} color="gray.50" variant="breadcrumbs">
                ~
              </Typography>
              <AdminDatePicker
                readOnly={
                  !isDetailPermissionSetting || (!checkList[params.row.userNo].isViewable && !checkList[params.row.userNo].isDownloadable)
                }
                size="h26"
                onChange={(e: Dayjs | null) => {
                  if (e) {
                    const value = e.format('YYYYMMDD')
                    checkList[params.row.userNo].usageEndDate = value
                    handleDateChange(value, params.row, 'usageEndDate', true)
                  }
                }}
                value={dayjs(checkList[params.row.userNo].usageEndDate)}
              />
            </Box>
          ),
      },
    ],
    [isDetailPermissionSetting, permission, companyPermission, goodsDetailData, checkList],
  )

  // 회사 권한 적용 기간
  const handleChangeCompanyDate = (value: Dayjs | null, type: string) => {
    if (value) {
      const formattedDate = value.format('YYYYMMDD')
      setCompanyPermission((prev) => ({ ...prev, [type]: formattedDate }))
      setIsEditUsageBeginDate(type === 'usageBeginDate')
      setIsEditUsageEndDate(type === 'usageEndDate')
    }
  }

  // 사용/미사용 변경
  const handleChangeActive = async () => {
    try {
      const response = await companiesService.updateUserPermission(Number(companyNo), Number(providerNo), Number(goodsNo), {
        isUsed: !isActive,
        goodsAuthManagementSeparateCd: permission,
      })

      setIsActive(response?.isUsed)
      setOpenConfirmActive(false)
      showSnackbar(response?.isUsed ? t('사용으로 변경되었습니다.') : t('미사용으로 변경되었습니다.'), { variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['goodsDetail', companyNo, providerNo, goodsNo] })
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <>
      <Box>
        <Box display={'flex'} flexDirection={'column'} alignItems={'start'} gap={'30px'}>
          <Box minWidth={'210px'}>
            <Typography component={'p'} variant="subtitle" color="gray.90" mb="12px">
              <Box>
                {t('권한 유형')}
                {isDetailPermissionSetting && (
                  <Typography component={'sup'} variant="asterisk" color="point.red1">
                    *
                  </Typography>
                )}
              </Box>
            </Typography>
            <RadioGroup
              row
              value={permission}
              onChange={(e) => {
                setPermission(e.target.value)
              }}
            >
              <FormControlLabel disabled={!isDetailPermissionSetting} value="INDIVIDUAL" control={<Radio />} label="개별 권한" />
              <FormControlLabel disabled={!isDetailPermissionSetting} value="COMPANY" control={<Radio />} label="회사 권한" />
            </RadioGroup>
          </Box>
          {permission === 'COMPANY' && (
            <>
              <Box minWidth={'210px'}>
                <Typography component={'p'} variant="subtitle" color="gray.90" mb="12px">
                  {t('회사 권한 설정')}
                </Typography>

                <Flex>
                  <AdminCheckboxField
                    disabled={!isDetailPermissionSetting}
                    checked={
                      goodsDetailData?.companySetting && !isEditViewable
                        ? goodsDetailData?.companySetting.isViewable
                        : isEditViewable
                          ? companyPermission.isViewable
                          : false
                    }
                    value={
                      goodsDetailData?.companySetting && !isEditViewable
                        ? goodsDetailData?.companySetting.isViewable
                        : isEditViewable
                          ? companyPermission.isViewable
                          : false
                    }
                    label="조회"
                    onChange={(e) => {
                      const checked = e.target.checked
                      // setCompanyPermission((prev) => ({ ...prev, isViewable: e.target.checked }))
                      setCompanyPermission((prev) => ({
                        ...prev,
                        isViewable: checked,
                        isDownloadable: !checked ? false : prev.isDownloadable,
                      }))
                      setIsEditViewable(true)
                      if (!checked) setIsEditDownloadable(false)
                    }}
                  />
                  <AdminCheckboxField
                    disabled={!isDetailPermissionSetting}
                    checked={
                      goodsDetailData?.companySetting && !isEditDownloadable
                        ? goodsDetailData?.companySetting.isDownloadable
                        : isEditDownloadable
                          ? companyPermission.isDownloadable
                          : false
                    }
                    value={
                      goodsDetailData?.companySetting && !isEditDownloadable
                        ? goodsDetailData?.companySetting.isDownloadable
                        : isEditDownloadable
                          ? companyPermission.isDownloadable
                          : false
                    }
                    label="다운로드"
                    onChange={(e) => {
                      const checked = e.target.checked
                      setCompanyPermission((prev) => ({
                        ...prev,
                        isDownloadable: checked,
                        isViewable: checked ? true : prev.isViewable,
                      }))
                      setIsEditDownloadable(true)
                      if (checked) setIsEditViewable(true)
                    }}
                  />
                </Flex>
              </Box>
              <Box minWidth={'210px'}>
                <Typography component={'p'} variant="subtitle" color="gray.90" mb="12px">
                  {t('권한 적용 기간')}
                  {isDetailPermissionSetting && (
                    <Typography component={'sup'} variant="asterisk" color="point.red1">
                      *
                    </Typography>
                  )}
                </Typography>
                <Box display={'flex'} alignItems={'center'} maxWidth={'100%'}>
                  <AdminDatePicker
                    readOnly={
                      !isDetailPermissionSetting ||
                      (isDetailPermissionSetting && !(companyPermission.isViewable || companyPermission.isDownloadable))
                    }
                    size="h26"
                    value={(() => {
                      const year =
                        goodsDetailData?.companySetting?.usageBeginDate && !isEditUsageBeginDate
                          ? goodsDetailData?.companySetting?.usageBeginDate.slice(0, 4)
                          : companyPermission?.usageBeginDate?.slice(0, 4)
                      const month =
                        goodsDetailData?.companySetting?.usageBeginDate && !isEditUsageBeginDate
                          ? goodsDetailData?.companySetting?.usageBeginDate.slice(4, 6)
                          : companyPermission?.usageBeginDate?.slice(4, 6)
                      const day =
                        goodsDetailData?.companySetting?.usageBeginDate && !isEditUsageBeginDate
                          ? goodsDetailData?.companySetting?.usageBeginDate.slice(6, 8)
                          : companyPermission?.usageBeginDate?.slice(6, 8)

                      return dayjs(`${year}-${month}-${day}`)
                    })()}
                    onChange={(value) => {
                      handleChangeCompanyDate(value, 'usageBeginDate')
                    }}
                  />
                  <Typography component={'div'} mx={'8px'} color="gray.50" variant="breadcrumbs">
                    ~
                  </Typography>
                  <AdminDatePicker
                    readOnly={
                      !isDetailPermissionSetting ||
                      (isDetailPermissionSetting && !(companyPermission.isViewable || companyPermission.isDownloadable))
                    }
                    size="h26"
                    value={(() => {
                      const year =
                        goodsDetailData?.companySetting?.usageEndDate && !isEditUsageEndDate
                          ? goodsDetailData?.companySetting?.usageEndDate.slice(0, 4)
                          : companyPermission?.usageEndDate?.slice(0, 4)
                      const month =
                        goodsDetailData?.companySetting?.usageEndDate && !isEditUsageEndDate
                          ? goodsDetailData?.companySetting?.usageEndDate.slice(4, 6)
                          : companyPermission?.usageEndDate?.slice(4, 6)
                      const day =
                        goodsDetailData?.companySetting?.usageEndDate && !isEditUsageEndDate
                          ? goodsDetailData?.companySetting?.usageEndDate.slice(6, 8)
                          : companyPermission?.usageEndDate?.slice(6, 8)

                      return dayjs(`${year}-${month}-${day}`)
                    })()}
                    onChange={(value) => {
                      handleChangeCompanyDate(value, 'usageEndDate')
                    }}
                  />
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>
      {permission === 'INDIVIDUAL' && (
        <Box>
          <Box minWidth={'210px'} mb="5px">
            <Typography component={'p'} variant="subtitle" color="gray.90">
              {t('상세 권한 설정')}
            </Typography>
            <Typography variant="subtext" color="gray.60">
              {t('회원별 상세 권한은 회사 권한 설정과 동일합니다.')}
            </Typography>
          </Box>
          <Box
            display={'flex'}
            alignItems={'center'}
            padding="10px 12px"
            height={'54px'}
            boxSizing={'border-box'}
            bgcolor={'gray.5'}
            borderBottom={'1px solid'}
            borderTop={'1px solid'}
            borderColor={'gray.30'}
          >
            <>
              <Box display={'flex'} alignItems={'center'} columnGap={'4px'}>
                <Box>{<PersonIcon />}</Box>
                <Typography variant="subtitle2" color="gray.60">
                  {t('회원')}
                </Typography>
                <Typography variant="chip1">{userPermissions?.extension?.numberOfUsers}</Typography>
              </Box>
              <Box width={'1px'} height={'14px'} bgcolor={'gray.30'} mx="8px" />
              <Box display={'flex'} alignItems={'center'} columnGap={'4px'}>
                <Box>{<VisibilityIcon />}</Box>
                <Typography variant="subtitle2" color="gray.60">
                  {t('조회')}
                </Typography>
                <Typography variant="chip1">{userPermissions?.extension?.numberOfViewable}</Typography>
              </Box>
              <Box width={'1px'} height={'14px'} bgcolor={'gray.30'} mx="8px" />
              <Box display={'flex'} alignItems={'center'} columnGap={'4px'}>
                <Box>{<DownloadIcon />}</Box>
                <Typography variant="subtitle2" color="gray.60">
                  {t('다운로드')}
                </Typography>
                <Typography variant="chip1">{userPermissions?.extension?.numberOfDownloadable}</Typography>
              </Box>
              <Box width={'1px'} height={'14px'} bgcolor={'gray.30'} mx="8px" />
            </>
          </Box>

          <AdminTable
            getRowId={(row) => row.userNo}
            columns={columns}
            data={isDetailPermissionSetting ? userPermissions?.detail : userPermissions}
          />
        </Box>
      )}
      <MIConfirm
        open={openConfirmActive}
        title={<>{isActive ? t('미사용으로 변경하시겠습니까?') : t('사용으로 변경하시겠습니까?')}</>}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenConfirmActive(false)
            },
          },
          {
            label: t('변경'),
            variant: 'filled',
            color: 'primary',
            onClick: async () => {
              await handleChangeActive()
            },
          },
        ]}
      >
        {isActive
          ? t('변경 시 해당 프로바이더와 연계된 상품도 비활성화됩니다.')
          : t('변경 시 해당 프로바이더와 연계된 상품도 활성화됩니다.')}
      </MIConfirm>

      <MIConfirm
        open={openCancelConfirm}
        title={t('취소하시겠습니까?')}
        width={450}
        handleClose={() => {
          setOpenConfirmActive(false)
        }}
        actions={[
          {
            label: t('이어서 작성'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenCancelConfirm(false)
            },
          },
          {
            label: t('취소 및 이동'),
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setOpenCancelConfirm(false)
              setIsDetailPermissionSetting(false)
            },
          },
        ]}
      >
        {t('취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.')}
      </MIConfirm>

      <MIConfirm
        open={openSaveConfirm}
        title={t('저장하시겠습니까?')}
        width={450}
        handleClose={() => {
          setOpenSaveConfirm(false)
        }}
        actions={[
          {
            label: t('취소'),
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenSaveConfirm(false)
            },
          },
          {
            label: t('저장'),
            variant: 'filled',
            color: 'primary',
            onClick: async () => {
              await updatePermissions()
            },
          },
        ]}
      ></MIConfirm>
    </>
  )
}

export default AdminCustomerCompanyProductDetailPage
