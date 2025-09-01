import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import { Box, Chip, FormGroup, Grid2 as Grid, Typography } from '@mui/material'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { Updater, useForm, useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminDataRegiUploadComponent, { AdminDataUploadFileInfo } from './components/AdminDataRegiUploadComponent'

import AdminCheckbox from '@/components/admin/AdminCheckbox'
import MIButton from '@/components/common/button/MIButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField'
import MIInput from '@/components/common/input/MIInput'
import MISelect from '@/components/common/select/MISelect'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import dataProviderService, { IProviderGoodsDataRegisterRequest } from '@/service/admin/dataProvider'

export interface FileInfo {
  id?: string
  name: string
  size: number
  type: string
  url: string
}

const AdminDataProvidersListPageHeader = (props: { disabled: boolean; onRegister: () => void; onCancel: () => void }) => (
  <Flex gap={10}>
    <MIButton type="outlined" color="gray" onClick={props.onCancel}>
      {t('취소')}
    </MIButton>
    <MIButton disabled={props.disabled} onClick={props.onRegister}>
      {t('등록')}
    </MIButton>
  </Flex>
)

const AdminDataRegistration = () => {
  const { showSnackbar } = useSnackbar()
  const { setCustomComponent, setCustomTitle } = useAdminHeader()
  const navigate = useNavigate()
  const { providerNo, goodsNo, dataNo } = useParams()

  /** 수정모드시 수정하는 데이터 No */
  const [editDataNo, setEditDataNo] = useState<number | null>(null)
  const [isEdit, setIsEdit] = useState<boolean>(!!dataNo)
  const [categories, setCategories] = useState<string[]>([])
  /** 대분류 */
  const [majorOccupation, setMajorOccupation] = useState('')
  /** 중분류 */
  const [mediumOccupation, setMediumOccupation] = useState('')
  /** 이동 시 confirm 다이어로그 trigger */
  const [openCancelConfirmation, setOpenCancelConfirmation] = useState(false)
  /** 파일 업로드 실패 다이어로그 trigger */
  const [openRegisterErrorFileAlert, setOpenRegisterErrorFileAlert] = useState(false)
  /** 등록 버튼 클릭 시 confirm 다이어로그 trigger */
  const [openRegisterSuccessFileAlert, setOpenRegisterSuccessFileAlert] = useState(false)
  /** 비정형 체크박스 해제시 파일 삭제 다이어로그 trigger */
  const [openUnstructuredConfirm, setOpenUnstructuredConfirm] = useState(false)

  /** 데이터 등록/수정 중 상태 */
  const [isSubmitting, setIsSubmitting] = useState(false)

  /** 정형화 업로드 파일 목록 */
  const [filesStructured, setFilesStructured] = useState<AdminDataUploadFileInfo[]>([])
  /** 비정형화 업로드 파일 목록 */
  const [filesUnstructured, setFilesUnstructured] = useState<AdminDataUploadFileInfo[]>([])

  /** 기등록 비정형 파일 중 삭제한 파일No 리스트 */
  const [deletedUnstructeredFiles, setDeletedUnstructeredFiles] = useState<number[]>([])

  const form = useForm({
    defaultValues: {
      goodsDataNm: '',
      goodsDataExpn: '',
      goodsDataSummaryCntt: '',
      docCategoryList: [] as string[],
      langCategoryList: [] as string[],
      fileTypes: [] as string[],
    },
    validators: {
      onChange: ({ value }) => {
        const isEmpty = (v: Array<unknown> | string) => {
          if (typeof v === 'string') return v.trim().length === 0
          if (Array.isArray(v)) return v.length === 0
          return !v
        }
        const shouldValidateDocCategory = filesUnstructured.length > 0
        return {
          fields: {
            goodsDataNm: isEmpty(value.goodsDataNm),
            goodsDataSummaryCntt: isEmpty(value.goodsDataSummaryCntt),
            docCategoryList: shouldValidateDocCategory ? isEmpty(value.docCategoryList) : false,
            langCategoryList: shouldValidateDocCategory ? isEmpty(value.langCategoryList) : false,
          },
        }
      },
    },
  })

  /** GET 데이터 상세 조회 */
  const { data: dataDetail, refetch: refetchDataDetail } = useQuery({
    queryKey: ['getGoodsDataDetail', providerNo, goodsNo, editDataNo],
    queryFn: async () => await dataProviderService.getGoodsDataDetail(Number(providerNo), Number(goodsNo), Number(editDataNo)),
    select: (res) => res,
    enabled: !!providerNo && !!goodsNo && !!editDataNo,
  })

  /** 삭제한 파일 제외하고 기등록된 데이터 파일 리스트 */
  const savedDataInfo = useMemo(() => {
    const structured = dataDetail?.structuredDataList ?? []
    const unstructured = dataDetail?.unstructuredDataList.filter((f) => !deletedUnstructeredFiles.includes(f.fileNo)) ?? []
    return { structured, unstructured }
  }, [dataDetail?.structuredDataList, dataDetail?.unstructuredDataList, deletedUnstructeredFiles])

  /** 필수 값 등 제출 가능 한 상태 여부 */
  const formCanSubmit = useStore(form.store, (state) => {
    const valid = state.isValid
    /** 기 제출한 파일이 있는경우 파일 업로드 확인 생략 */
    if (!!savedDataInfo.structured.length || !!savedDataInfo.unstructured.length) {
      return valid
    }
    const hasFile = [...filesStructured, ...filesUnstructured].length > 0
    return valid && hasFile
  })

  const onRegister = useCallback(() => {
    if (isSubmitting) return

    const checkFilesStatusClean = () => [...filesStructured, ...filesUnstructured].every((m) => m.status === 'pass')
    if (!checkFilesStatusClean()) {
      setOpenRegisterErrorFileAlert(true)
      return
    }
    setOpenRegisterSuccessFileAlert(true)
  }, [filesStructured, filesUnstructured, isSubmitting])

  // GET 데이터명 목록
  const { data: getDataList = [] } = useQuery({
    queryKey: ['getDataList'],
    queryFn: async () => await dataProviderService.getDataList(Number(providerNo), Number(goodsNo)),
    select: (res) => res.map((m) => ({ label: m.goodDataNm, value: m.goodDataNo })),
  })

  // GET 문서 타입 카테고리
  const { data: providerDocumentTypeOptions = [] } = useQuery({
    queryKey: ['getProviderDocumentType'],
    queryFn: async () => await dataProviderService.getProviderDocumentType(),
  })

  // GET 언어 타입 카테고리
  const { data: providerLanguageOptions = [] } = useQuery({
    queryKey: ['getProviderLanguageType'],
    queryFn: async () => await dataProviderService.getProviderLanguageType(),
  })

  /** GET 신규 등록 데이터 상품 명 조회 */
  const { data: goodsNm } = useQuery({
    queryKey: ['productDetailData', providerNo, goodsNo],
    queryFn: async () => await dataProviderService.getProviderGoodsDetail(Number(providerNo), Number(goodsNo)),
    select: (res) => res.goodsNm,
    enabled: !!providerNo && !!goodsNo,
  })

  /** 기존 등록된 데이터 수정 */
  useEffect(() => {
    if (!!editDataNo && dataDetail) {
      form.reset()
      const langCategoryList = dataDetail.langCategoryList.map((m) => m.codeId)
      const docCategoryList = dataDetail.docCategoryList.map((m) => m.codeId)
      form.setFieldValue('goodsDataNm', dataDetail.goodsDataNm)
      form.setFieldValue('goodsDataExpn', dataDetail.goodsDataExpn)
      form.setFieldValue('goodsDataSummaryCntt', dataDetail.goodsDataSummaryCntt)
      form.setFieldValue('langCategoryList', langCategoryList)
      form.setFieldValue('docCategoryList', docCategoryList)
      const fileTypes = []
      if (dataDetail.structuredDataList.length) fileTypes.push('structured')
      if (dataDetail.unstructuredDataList.length) fileTypes.push('unstructured')
      form.setFieldValue('fileTypes', fileTypes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataDetail, editDataNo])

  useEffect(() => {
    setCustomComponent(
      <AdminDataProvidersListPageHeader
        disabled={!formCanSubmit || isSubmitting}
        onRegister={onRegister}
        onCancel={() => {
          setOpenCancelConfirmation(true)
        }}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent, formCanSubmit, onRegister, isSubmitting])

  useEffect(() => {
    if (dataNo) setEditDataNo(Number(dataNo))
  }, [dataNo])

  useEffect(() => {
    setCustomTitle(
      <Box display="flex" alignItems="center" columnGap={'10px'}>
        <Typography color="gray.90" variant="heading2">
          {goodsNm ? `${goodsNm}${t('의 데이터 등록')}` : ''}
        </Typography>
      </Box>,
    )

    return () => {
      setCustomTitle(null)
    }
  }, [setCustomTitle, goodsNm])

  // POST 데이터 등록
  const { mutate: postGoodsData } = useMutation({
    mutationFn: (body: IProviderGoodsDataRegisterRequest) => dataProviderService.postGoodsData(Number(providerNo), Number(goodsNo), body),
    onSuccess: () => showSnackbar('저장되었습니다.', { variant: 'success' }),
    onError: () => showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' }),
    onSettled: () => {
      setIsSubmitting(false)
      setOpenRegisterSuccessFileAlert(false)
      navigate(`/admin/data-providers/providers/product-detail/${providerNo}/${goodsNo}`)
    },
  })

  // PATCH 기존 데이터 수정등록
  const { mutate: patchGoodsData } = useMutation({
    mutationFn: (body: IProviderGoodsDataRegisterRequest) =>
      dataProviderService.patchGoodsData(Number(providerNo), Number(goodsNo), Number(dataNo), body),
    onSuccess: () => {
      showSnackbar('저장되었습니다.', { variant: 'success' })
      refetchDataDetail()
    },
    onError: () => showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' }),
    onSettled: () => {
      setIsSubmitting(false)
      setOpenRegisterSuccessFileAlert(false)
      navigate(`/admin/data-providers/providers/product-detail/${providerNo}/${goodsNo}`)
    },
  })

  /** 데이터 등록 */
  const onRegisterGoodsData = () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    const { langCategoryList, docCategoryList, fileTypes, ...rest } = form.state.values
    const getConfirmedUnstructuredFiles = () => {
      const combinedFiles = [...filesUnstructured, ...(dataDetail?.unstructuredDataList ?? [])]
      return combinedFiles.filter((f) => !deletedUnstructeredFiles.includes(f.fileNo))
    }
    const requestBody = {
      ...rest,
      langCategoryList: langCategoryList.map((m) => ({
        codeId: m,
      })),

      docCategoryList: docCategoryList.map((m) => ({
        codeId: m,
      })),
      structuredDataList: filesStructured.map(({ componentTypeId, fileNo }) => ({ componentTypeId, fileNo })),
      unstructuredDataList: getConfirmedUnstructuredFiles().map(({ criteriaDt, fileNo }) => ({
        criteriaDt,
        fileNo,
      })),
    }
    if (isEdit) patchGoodsData(requestBody)
    else postGoodsData(requestBody)
  }

  const onChangeCheckbox = (checkType: string, checked: boolean, updateFn: () => void) => {
    if (checked) {
      updateFn()
      return
    }
    if (checkType === 'structured') {
      updateFn()
      setFilesStructured([])
      return
    }
    const remaining = dataDetail?.unstructuredDataList.filter((f) => !deletedUnstructeredFiles.includes(f.fileNo))
    if (remaining?.length) {
      setOpenUnstructuredConfirm(true)
    } else {
      setFilesUnstructured([])
      form.resetField('docCategoryList')
      form.resetField('langCategoryList')
      updateFn()
    }
  }

  /** 비정형 데이터 파일 초기화 */
  const clearUnstructedSavedFiles = () => {
    setOpenUnstructuredConfirm(false)
    form.resetField('docCategoryList')
    form.resetField('langCategoryList')
    setDeletedUnstructeredFiles(dataDetail?.unstructuredDataList.map((m) => m.fileNo) ?? [])
    setFilesUnstructured([])
    form.setFieldValue('fileTypes', (prev) => prev.filter((f) => f !== 'unstructured'))
  }

  /** InputText Component */
  const renderInputField = (
    field: { state: { value: string }; handleChange: (param: string) => void },
    label: string,
    subText: string,
    multiline?: boolean,
    required?: boolean,
    disabled?: boolean,
  ) => (
    <MIField labelSize="lg" label={label} subText={subText} required={required}>
      <MIInput
        placeholder="내용을 입력하세요"
        fullWidth
        disabled={disabled}
        multiline={multiline}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
    </MIField>
  )

  return (
    <form>
      <Box display={'flex'} flexDirection={'column'} rowGap={'30px'} maxWidth={'700px'} marginBottom={10}>
        <MIField labelSize="lg" label="상품명">
          <Typography color="gray.70" variant="body4">
            {goodsNm}
          </Typography>
        </MIField>
        {!dataNo && (
          <MIField labelSize="lg" label="등록 방식">
            <RadioGroup row value={isEdit} defaultValue={-1} onChange={(e) => setIsEdit(e.target.value === 'true')}>
              <FormControlLabel value={false} control={<Radio />} label="신규 등록" />
              <FormControlLabel value={true} control={<Radio />} label="기존 데이터 업데이트" />
            </RadioGroup>
          </MIField>
        )}
        {!isEdit && (
          <form.Field name="goodsDataNm">
            {(field) => renderInputField(field, '데이터명', '데이터의 이름을 입력해주세요.', false, true)}
          </form.Field>
        )}
        {isEdit && (
          <MIField labelSize="lg" label={'데이터명'} subText={'데이터의 이름을 입력해주세요.'} required>
            <MISelect
              value={editDataNo ?? ''}
              onChange={(e) => setEditDataNo(Number(e.target.value))}
              placeholder="선택하세요"
              disabled={!!dataNo}
              sizeSelect={'h34'}
              fullWidth
              useAllOption={false}
              options={getDataList}
            />
          </MIField>
        )}
        <form.Field name="goodsDataExpn">
          {(field) => renderInputField(field, 'Description', '데이터에 대한 설명을 입력해주세요.', true, false, isEdit && !editDataNo)}
        </form.Field>
        <form.Field name="goodsDataSummaryCntt">
          {(field) => renderInputField(field, 'Summary', '데이터에 대한 요약 정보를 입력해주세요.', true, true, isEdit && !editDataNo)}
        </form.Field>
        <MIField labelSize="lg" label="데이터 카테고리" subText="대분류, 중분류를 선택하여 추가하세요. 중복 등록이 가능합니다.">
          <Flex direction="row" gap={8}>
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
              <Grid size={6}>
                <MISelect
                  value={majorOccupation}
                  disabled={isEdit && !editDataNo}
                  onChange={(e) => {
                    setMajorOccupation(e.target.value as string)
                    setMediumOccupation('')
                  }}
                  placeholder="대분류"
                  sizeSelect={'h34'}
                  fullWidth
                  options={[]}
                ></MISelect>
              </Grid>
              <Grid size={6}>
                <MISelect
                  sizeSelect={'h34'}
                  disabled={isEdit && !editDataNo}
                  value={mediumOccupation}
                  onChange={(e) => setMediumOccupation(e.target.value as string)}
                  placeholder="중분류"
                  fullWidth
                  options={[]}
                ></MISelect>
              </Grid>
            </Grid>
            <Box width={34}>
              <MIButton
                disabled={!majorOccupation || !mediumOccupation}
                onClick={(e) => {
                  e.preventDefault()
                  setCategories((prev) => [`${majorOccupation}/${mediumOccupation}`, ...prev])
                }}
                startIcon={<AddIcon sx={{ color: '#868E96' }} fontSize="small" />}
                contentType={'icon'}
                type="outlined"
                color="gray"
              />
            </Box>
          </Flex>
          <Grid
            style={{ marginTop: 8 }}
            minHeight={92}
            size={12}
            wrap="wrap"
            borderRadius={2}
            bgcolor="gray.5"
            gap={2}
            padding={3.5}
            container
          >
            {Array.isArray(categories) &&
              categories.map((item: string, index: number) => (
                <Chip
                  size="small"
                  sx={{
                    height: '28px',
                    color: 'gray.70',
                    fontSize: '14px',
                    fontWeight: 400,
                    backgroundColor: '#fff',
                    borderColor: 'gray.30',
                    padding: '0 5px',
                  }}
                  variant="outlined"
                  key={item}
                  label={item}
                  deleteIcon={<CancelIcon style={{ marginLeft: '3px', color: '#CED4DA' }} />}
                  onDelete={() => {
                    setCategories((prev) => prev.filter((_, i) => i !== index))
                  }}
                />
              ))}
          </Grid>
        </MIField>
        <Divider sx={{ backgroundColor: '#DEE2E6', height: '0px' }} />
        <form.Field name="fileTypes">
          {(field) => (
            <>
              <AdminDataRegiUploadComponent
                fileTypes={field.state.value}
                onChange={(updater: Updater<string[]>, checkType, checked) =>
                  onChangeCheckbox(checkType, checked, () => field.setValue(updater))
                }
                setFilesStructured={setFilesStructured}
                setFilesUnstructured={setFilesUnstructured}
                savedDataInfo={savedDataInfo}
                filesStructured={filesStructured}
                filesUnstructured={filesUnstructured}
                onDeleteUnstructuredData={(fileNo) => setDeletedUnstructeredFiles((prev) => [...prev, fileNo])}
              />
              {field.state.value.includes('unstructured') && (
                <>
                  <form.Field name="docCategoryList">
                    {(subfield) => (
                      <MIField
                        labelSize="lg"
                        label="Document Types"
                        subText="도큐먼트 타입을 선택하세요. 중복 선택이 가능합니다."
                        required
                        sx={{ paddingLeft: '36px' }}
                      >
                        <FormGroup row>
                          {providerDocumentTypeOptions.map((val) => (
                            <FormControlLabel
                              key={val.codeId}
                              style={{ height: '35px' }}
                              control={
                                <AdminCheckbox
                                  checked={subfield.state.value.includes(val.codeId)}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked
                                    const newValue = isChecked
                                      ? [...subfield.state.value, val.codeId]
                                      : subfield.state.value.filter((v) => v !== val.codeId)

                                    subfield.handleChange(newValue)
                                  }}
                                />
                              }
                              value={val.codeId}
                              label={val.codeNm}
                            />
                          ))}
                        </FormGroup>
                      </MIField>
                    )}
                  </form.Field>
                  <form.Field name="langCategoryList">
                    {(subfield) => (
                      <MIField
                        labelSize="lg"
                        label="Languages"
                        subText="도큐먼트의 언어를 선택하세요. 중복 선택이 가능합니다."
                        required
                        sx={{ paddingLeft: '36px' }}
                      >
                        <FormGroup row>
                          {providerLanguageOptions.map((val) => (
                            <FormControlLabel
                              style={{ height: '35px' }}
                              key={val.codeId}
                              control={
                                <AdminCheckbox
                                  checked={subfield.state.value.includes(val.codeId)}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked
                                    const newValue = isChecked
                                      ? [...subfield.state.value, val.codeId]
                                      : subfield.state.value.filter((v) => v !== val.codeId)

                                    subfield.handleChange(newValue)
                                  }}
                                />
                              }
                              value={val.codeId}
                              label={val.codeNm}
                            />
                          ))}
                        </FormGroup>
                      </MIField>
                    )}
                  </form.Field>
                </>
              )}
            </>
          )}
        </form.Field>
      </Box>
      <MIConfirm
        open={openCancelConfirmation}
        title={<>취소하시겠습니까?</>}
        width={450}
        handleClose={() => setOpenCancelConfirmation(false)}
        actions={[
          {
            label: <Typography variant="body2SB14">이어서 작성</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => setOpenCancelConfirmation(false),
          },
          {
            label: <Typography variant="body2SB14">취소 및 이동</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: () => navigate(-1),
          },
        ]}
      >
        취소 및 화면 이동 시 변경 내용은 저장되지 않습니다.
      </MIConfirm>
      <MIConfirm
        open={openRegisterErrorFileAlert}
        title={<>에러 파일이 있습니다.</>}
        width={450}
        handleClose={() => setOpenRegisterErrorFileAlert(false)}
        actions={[
          {
            label: <Typography variant="body2SB14">확인</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: () => setOpenRegisterErrorFileAlert(false),
          },
        ]}
      >
        에러가 발생한 파일을 삭제하거나 확인 후 다시 업로드해주세요.
      </MIConfirm>

      <MIConfirm
        open={openRegisterSuccessFileAlert}
        title={<>등록하시겠습니까?</>}
        width={450}
        handleClose={() => setOpenRegisterSuccessFileAlert(false)}
        actions={[
          {
            label: <Typography variant="body2SB14">취소</Typography>,
            variant: 'outlined',
            color: 'gray',
            disabled: isSubmitting,
            onClick: () => setOpenRegisterSuccessFileAlert(false),
          },
          {
            label: <Typography variant="body2SB14">{isSubmitting ? '등록 중...' : '등록'}</Typography>,
            variant: 'filled',
            color: 'primary',
            disabled: isSubmitting,
            onClick: () => {
              onRegisterGoodsData()
            },
          },
        ]}
      ></MIConfirm>
      <MIConfirm
        open={openUnstructuredConfirm}
        title={<>비정형데이터를 사용안함으로 변경하시겠습니까?</>}
        width={450}
        handleClose={() => setOpenUnstructuredConfirm(false)}
        actions={[
          {
            label: <Typography variant="body2SB14">취소</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => setOpenUnstructuredConfirm(false),
          },
          {
            label: <Typography variant="body2SB14">변경</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: clearUnstructedSavedFiles,
          },
        ]}
      >
        기존에 등록된 데이터가 있는 경우 모두 삭제됩니다.
      </MIConfirm>
    </form>
  )
}

export default AdminDataRegistration
