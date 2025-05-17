import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import { Box, Chip, FormGroup, Grid2 as Grid, Typography } from '@mui/material'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { useForm, useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminDataRegiUploadComponent, { AdminDataUploadFileInfo } from './components/AdminDataRegiUploadComponent'

import AdminCheckbox from '@/components/admin/AdminCheckbox.tsx'
import MIButton from '@/components/common/button/MIButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField.tsx'
import MIInput from '@/components/common/input/MIInput.tsx'
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

// const documentFileType = ['application/pdf', 'text/csv', 'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint']

const AdminDataRegistration = () => {
  const { showSnackbar } = useSnackbar()
  const { setCustomComponent, setCustomTitle } = useAdminHeader()
  const navigate = useNavigate()
  const { providerNo, goodsNo, dataNo } = useParams()
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

  /** 정형화 업로드 파일 목록 */
  const [filesStructured, setFilesStructured] = useState<AdminDataUploadFileInfo[]>([])
  /** 비정형화 업로드 파일 목록 */
  const [filesUnstructured, setFilesUnstructured] = useState<AdminDataUploadFileInfo[]>([])

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
        return {
          fields: {
            goodsDataNm: isEmpty(value.goodsDataNm),
            goodsDataSummaryCntt: isEmpty(value.goodsDataSummaryCntt),
            docCategoryList: isEmpty(value.docCategoryList),
            langCategoryList: isEmpty(value.langCategoryList),
            fileTypes: isEmpty(value.fileTypes),
          },
        }
      },
    },
  })

  /** 필수 값 등 제출 가능 한 상태 여부 */
  const formCanSubmit = useStore(form.store, (state) => {
    const valid = state.isValid
    const hasFile = [...filesStructured, ...filesUnstructured].length > 0
    return valid && hasFile
  })

  const onRegister = useCallback(() => {
    if (isEdit) {
      showSnackbar('TODO.', { variant: 'error', body: 'TODO' })
      return
    }

    const checkFilesStatusClean = () => [...filesStructured, ...filesUnstructured].every((m) => m.status === 'pass')

    if (!checkFilesStatusClean()) setOpenRegisterErrorFileAlert(true)
    else setOpenRegisterSuccessFileAlert(true)
  }, [filesStructured, filesUnstructured])

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
    queryKey: ['productDetailData'],
    queryFn: async () => await dataProviderService.getProviderGoodsDetail(Number(providerNo), Number(goodsNo)),
    select: (res) => res.goodsNm,
    enabled: !!providerNo && !!goodsNo,
  })

  /** GET 신규 등록 데이터 상품 명 조회 */
  const { data: dataDetail } = useQuery({
    queryKey: ['getGoodsDataDetail'],
    queryFn: async () => await dataProviderService.getGoodsDataDetail(Number(providerNo), Number(goodsNo), Number(dataNo)),
    select: (res) => res,
    enabled: !!providerNo && !!goodsNo && !!dataNo,
  })

  /** 기존 등록된 데이터 수정 */
  useEffect(() => {
    if (dataNo && dataDetail) {
      const langCategoryList = dataDetail.langCategoryList.map((m) => m.codeId)
      const docCategoryList = dataDetail.docCategoryList.map((m) => m.codeId)
      form.setFieldValue('goodsDataNm', dataDetail.goodsDataNm)
      form.setFieldValue('goodsDataExpn', dataDetail.goodsDataExpn)
      form.setFieldValue('goodsDataSummaryCntt', dataDetail.goodsDataSummaryCntt)
      form.setFieldValue('langCategoryList', langCategoryList)
      form.setFieldValue('docCategoryList', docCategoryList)
    }
  }, [dataDetail, dataNo, form])

  useEffect(() => {
    setCustomComponent(
      <AdminDataProvidersListPageHeader
        disabled={!formCanSubmit}
        onRegister={onRegister}
        onCancel={() => {
          setOpenCancelConfirmation(true)
        }}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent, formCanSubmit, onRegister])

  useEffect(() => {
    if (dataNo) setEditDataNo(Number(dataNo))
  }, [dataNo])

  useEffect(() => {
    setCustomTitle(
      <Box display="flex" alignItems="center" columnGap={'10px'}>
        <Typography color="gray.90" variant="heading2">
          {`${goodsNm}${t('의 데이터 등록')}`}
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
      setOpenRegisterSuccessFileAlert(false)
      navigate(`/admin/data-providers/providers/product-detail/${providerNo}/${goodsNo}`)
    },
  })

  /** 데이터 등록 */
  const onRegisterGoodsData = () => {
    const { langCategoryList, docCategoryList, fileTypes, ...rest } = form.state.values

    const requestBody = {
      ...rest,
      langCategoryList: langCategoryList.map((m) => ({
        CodeId: m,
      })),
      docCategoryList: docCategoryList.map((m) => ({
        CodeId: m,
      })),
      structuredDataList: filesStructured.map(({ componentTypeId, fileNo }) => ({ componentTypeId, fileNo })),
      unstructuredDataList: filesUnstructured.map(({ criteriaDt, fileNo }) => ({ criteriaDt, fileNo })),
    }
    postGoodsData(requestBody)
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
        <form.Field name="docCategoryList">
          {(field) => (
            <MIField labelSize="lg" label="Document Types" subText="도큐먼트 타입을 선택하세요. 중복 선택이 가능합니다." required>
              <FormGroup row>
                {providerDocumentTypeOptions.map((val) => (
                  <FormControlLabel
                    key={val.codeId}
                    control={
                      <AdminCheckbox
                        checked={field.state.value.includes(val.codeId)}
                        onChange={(e) => {
                          const isChecked = e.target.checked
                          const newValue = isChecked
                            ? [...field.state.value, val.codeId]
                            : field.state.value.filter((v) => v !== val.codeId)

                          field.handleChange(newValue)
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
          {(field) => (
            <MIField labelSize="lg" label="Languages" subText="도큐먼트의 언어를 선택하세요. 중복 선택이 가능합니다." required>
              <FormGroup row>
                {providerLanguageOptions.map((val) => (
                  <FormControlLabel
                    key={val.codeId}
                    control={
                      <AdminCheckbox
                        checked={field.state.value.includes(val.codeId)}
                        onChange={(e) => {
                          const isChecked = e.target.checked
                          const newValue = isChecked
                            ? [...field.state.value, val.codeId]
                            : field.state.value.filter((v) => v !== val.codeId)

                          field.handleChange(newValue)
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
        <Divider sx={{ backgroundColor: '#DEE2E6', height: '0px' }} />
        <form.Field name="fileTypes">
          {(field) => (
            <AdminDataRegiUploadComponent
              fileTypes={form.state.values.fileTypes}
              selectedTypes={field.state.value}
              onChange={field.handleChange}
              setFilesStructured={setFilesStructured}
              setFilesUnstructured={setFilesUnstructured}
              savedstructuredData={dataDetail?.structuredDataList ?? []}
              savedunstructuredData={dataDetail?.unstructuredDataList ?? []}
              filesStructured={filesStructured}
              filesUnstructured={filesUnstructured}
            />
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
        handleClose={() => {
          setOpenRegisterErrorFileAlert(false)
        }}
        actions={[
          {
            label: <Typography variant="body2SB14">확인</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setOpenRegisterErrorFileAlert(false)
            },
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
            onClick: () => setOpenRegisterSuccessFileAlert(false),
          },
          {
            label: <Typography variant="body2SB14">등록</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              onRegisterGoodsData()
            },
          },
        ]}
      ></MIConfirm>
    </form>
  )
}

export default AdminDataRegistration
