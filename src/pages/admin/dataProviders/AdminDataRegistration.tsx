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
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import AdminCheckbox from '@/components/admin/AdminCheckbox.tsx'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminItemUpload, { FileType } from '@/components/admin/AdminItemUpload/AdminItemUpload'
import AdminUpload from '@/components/admin/AdminUpload'
import MIAccordion from '@/components/common/accordion/MIAccordion.tsx'
import MIButton from '@/components/common/button/MIButton'
import MIDatePicker from '@/components/common/datepicker/MIDatePicker'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField.tsx'
import MIInput from '@/components/common/input/MIInput.tsx'
import MISelect from '@/components/common/select/MISelect'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import axios from '@/lib/axios'
import dataProviderService, { IProviderGoodsDataRegisterRequest } from '@/service/admin/dataProvider'
import { getRandomItem } from '@/utils/mock-data'

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
  const { providerNo, goodsNo } = useParams()
  const [categories, setCategories] = useState<string[]>([])
  /** 대분류 */
  const [majorOccupation, setMajorOccupation] = useState('')
  /** 중분류 */
  const [mediumOccupation, setMediumOccupation] = useState('')
  /** 이동 시 confirm 다이어로그 trigger */
  const [openCancelConfirmation, setCancelConfirmation] = useState(false)
  /** 파일 업로드 실패 다이어로그 trigger */
  const [openRegisterErrorFileAlert, setOpenRegisterErrorFileAlert] = useState(false)
  /** 등록 버튼 클릭 시 confirm 다이어로그 trigger */
  const [openRegisterSuccessFileAlert, setOpenRegisterSuccessFileAlert] = useState(false)
  /** 선택된 정형화 데이터 카테고리 */
  const [structuredComponentType, setStructuredComponentType] = useState('')

  /** 선택된 비정형화 데이터 카테고리 */
  const [unstructuredDate, setUnstructuredDate] = useState('')

  /** 정형화 업로드 파일 목록 */
  const [filesStructured, setFilesStructured] = useState<
    {
      fileNo: number
      componentTypeId: string
      fileNm: string
      fileSize: number
      type: FileType
      fileKey: string | null
      status: 'uploading' | 'checking' | 'fail' | 'pass'
    }[]
  >([])
  /** 비정형화 업로드 파일 목록 */
  const [filesUnstructured, _setFilesUnstructured] = useState<
    { fileNo: number; componentTypeId: string; fileNm: string; fileSize: number }[]
  >([])

  const form = useForm({
    defaultValues: {
      goodsDataNm: '',
      goodsDataExpn: '',
      goodsDataSummaryCntt: '',
      docCategoryList: [] as string[],
      langCategoryList: [] as string[],
      fileTypes: [] as string[],
      structuredDataList: [] as {
        componentTypeId: string
        fileNo: number
      }[],
      unstructuredDataList: [] as {
        criteriaDt: string
        fileNo: number
      }[],
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
            goodsDataNm: isEmpty(value.goodsDataNm) || undefined,
            goodsDataExpn: isEmpty(value.goodsDataExpn) || undefined,
            goodsDataSummaryCntt: isEmpty(value.goodsDataSummaryCntt) || undefined,
            docCategoryList: isEmpty(value.docCategoryList) || undefined,
            langCategoryList: isEmpty(value.langCategoryList) || undefined,
          },
        }
      },
    },
  })

  /** 필수 값 등 제출 가능 한 상태 여부 */
  const formCanSubmit = useStore(form.store, (state) => state.canSubmit)

  /** 업로드 진행률 상태 추적 state */
  const [uploadProgressMap, setUploadProgressMap] = useState<Record<string, number>>({})
  const updateUploadProgress = useCallback((key: string, percent: number) => {
    setUploadProgressMap((prev) => ({
      ...prev,
      [key]: percent,
    }))
  }, [])

  const clearUploadProgress = useCallback((key: string) => {
    setUploadProgressMap((prev) => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
  }, [])

  const handleRemoveFile = (index: number) => {
    setFilesStructured((prev) => prev.filter((_f, idx) => idx !== index))
  }

  const onUploadAction = useCallback(
    async (file: File) => {
      /** 업로드 진행동안 추적할 uniqKey */
      const fileKey = `${Date.now()}-${file.name}`
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        'data',
        JSON.stringify({
          componentTypeId: structuredComponentType,
        }),
      )

      const { name, type, size } = file
      setFilesStructured((prev) => [
        ...prev,
        {
          fileNo: -1,
          componentTypeId: structuredComponentType,
          fileNm: name,
          fileSize: size,
          fileKey,
          type: type as FileType,
          status: 'uploading',
        },
      ])
      try {
        const response = await axios.post('/admin/provider-management/goods-datas/upload-file/structured-data', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            const percent = Math.round((event.loaded * 100) / (event.total || 1))
            updateUploadProgress(fileKey, percent)
          },
        })
        const { fileNo } = response.data.data
        setFilesStructured((prev) => prev.map((f) => (f.fileKey === fileKey ? { ...f, fileNo, fileKey: null, status: 'pass' } : f)))
        setTimeout(() => clearUploadProgress(fileKey), 1000)
      } catch {
        setOpenRegisterErrorFileAlert(true)
        setFilesStructured((prev) => prev.map((f) => (f.fileKey === fileKey ? { ...f, fileKey: null, status: 'fail' } : f)))
        clearUploadProgress(fileKey)
      }
      setStructuredComponentType('')
    },
    [clearUploadProgress, structuredComponentType, updateUploadProgress],
  )

  // GET 정형 데이타 타입 목록
  const { data: structuredDataTypeOptions = [] } = useQuery({
    queryKey: ['getStructuredDataType'],
    queryFn: async () => await dataProviderService.getStructuredDataType(),
    select: (res) =>
      res.map(({ componentTypeId, componentTypeNm }) => ({
        label: componentTypeNm,
        value: componentTypeId,
      })),
  })

  /** 정형데이터 옵션에서 사용한 옵션을 제외한 나머지 리스트
   *  데이터 소스 1개당 정형데이터 파일은 유일한 1개만 매칭
   */
  const availableDataTypeOptions = useMemo(() => {
    const usedComponentTypeIds = filesStructured.map((file) => file.componentTypeId)
    return structuredDataTypeOptions.filter((option) => !usedComponentTypeIds.includes(option.value))
  }, [structuredDataTypeOptions, filesStructured])

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

  useEffect(() => {
    if (goodsNm) form.setFieldValue('goodsDataNm', goodsNm)
  }, [goodsNm])

  const accordionItems = useMemo(
    () => [
      {
        key: 'structured',
        title: '정형 데이터 업로드',
        isRequired: true,
        tooltip: '데이터 소스 선택 후 파일을 업로드하세요.',
        content: (
          <Box>
            <Typography variant="labelText" color="gray.70" component="div" marginBottom={1.5}>
              파일 추가
            </Typography>
            <Flex direction="row" align="start" gap={8}>
              <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid size={6}>
                  <MISelect
                    onChange={(e) => {
                      setStructuredComponentType(String(e.target.value))
                    }}
                    value={structuredComponentType}
                    sizeSelect={'h34'}
                    placeholder="데이터 소스를 선택하세요."
                    options={availableDataTypeOptions}
                  ></MISelect>
                </Grid>
                <Grid size={6}>
                  <AdminUpload
                    disabled={!structuredComponentType}
                    onUploadAction={onUploadAction}
                    acceptedTypes={['text/csv']}
                    maxSize={24}
                  />
                </Grid>
              </Grid>
            </Flex>
            {filesStructured.length > 0 && (
              <Box mt={2}>
                {filesStructured.map((fileItem, index) => (
                  <AdminItemUpload
                    checkFile={fileItem.status}
                    key={index}
                    progressValue={uploadProgressMap[fileItem.fileKey ?? '']}
                    fileItem={fileItem}
                    onDelete={() => handleRemoveFile(index)}
                  />
                ))}
              </Box>
            )}
          </Box>
        ),
      },
      // TODO
      {
        key: 'unstructured',
        title: '비정형 데이터 업로드',
        isRequired: true,
        tooltip: '기준일자 선택 후 파일을 업로드하세요.',
        content: (
          <Box>
            <Typography variant="labelText" color="gray.70" component="div" marginBottom={1.5}>
              파일 추가
            </Typography>
            <Flex direction="row" align="start" gap={8}>
              <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid size={6}>
                  <MIDatePicker
                    onChange={(value) => {
                      setUnstructuredDate(String(value))
                    }}
                    size="h34"
                  />
                </Grid>
                <Grid size={6}>
                  <AdminUpload disabled={!unstructuredDate} onUploadAction={onUploadAction} acceptedTypes={['text/csv']} maxSize={1124} />
                </Grid>
              </Grid>
              {/* <Box width={34}>
              <MIButton
                disabled={!unstructuredFileName}
                onClick={(e) => {
                  e.preventDefault()
                  // handleClickAddDate()
                  setUnstructuredFileName('')
                }}
                startIcon={<UploadIcon style={{ color: !unstructuredFileName ? '#CED4DA' : '#868E96' }} fontSize="small" />}
                contentType={'icon'}
                type="outlined"
              />
            </Box> */}
            </Flex>
            {filesUnstructured.length > 0 && (
              <Box mt={2}>
                {/* {filesUnstructured.map((fileItem, index) => (
                <AdminItemUpload checkFile="pass" key={index} file={fileItem.info} onDelete={() => handleRemoveFileDate(index)} />
              ))} */}
              </Box>
            )}
          </Box>
        ),
      },
    ],
    [
      filesStructured,
      filesUnstructured.length,
      onUploadAction,
      structuredComponentType,
      structuredDataTypeOptions,
      unstructuredDate,
      uploadProgressMap,
    ],
  )

  useEffect(() => {
    setCustomComponent(
      <AdminDataProvidersListPageHeader
        disabled={!formCanSubmit}
        onRegister={() => {
          const state = getRandomItem(['success', 'error'])

          if (state === 'error') {
            setOpenRegisterErrorFileAlert(true)
          } else {
            setOpenRegisterSuccessFileAlert(true)
          }
        }}
        onCancel={() => {
          setCancelConfirmation(true)
        }}
      />,
    )

    setCustomTitle(
      <Box display="flex" alignItems="center" columnGap={'10px'}>
        <Typography color="gray.90" variant="heading2">
          {`${goodsNm}${t('의 데이터 등록')}`}
        </Typography>
      </Box>,
    )

    return () => {
      setCustomComponent(null)
      setCustomTitle(null)
    }
  }, [setCustomComponent, formCanSubmit, setCustomTitle, goodsNm])

  const majorOccupationOptions = [
    { label: t('Major Occupations 1'), value: 'major1' },
    { label: t('Major Occupations 2'), value: 'major2' },
    { label: t('Major Occupations 3'), value: 'major3' },
  ]

  const mediumOccupationOptions = [
    { label: t('Medium Occupations 1'), value: 'medium1' },
    { label: t('Medium Occupations 2'), value: 'medium2' },
    { label: t('Medium Occupations 3'), value: 'medium3' },
  ]

  const postGoodsDataErrorCallback = () => {
    showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' })
  }

  // GET 정형 데이타 타입 목록
  const { mutate: postGoodsData } = useMutation({
    mutationFn: (body: IProviderGoodsDataRegisterRequest) => dataProviderService.postGoodsData(Number(providerNo), Number(goodsNo), body),
    onSuccess: () => {
      showSnackbar('저장되었습니다.', { variant: 'success' })
    },
    onError: postGoodsDataErrorCallback,
    onSettled: () => {
      setOpenRegisterSuccessFileAlert(false)
    },
  })

  /** 데이터 등록 */
  const onRegisterGoodsData = () => {
    const { langCategoryList, docCategoryList, ...rest } = form.state.values

    const requestBody = {
      ...rest,
      langCategoryList: langCategoryList.map((m) => ({
        CodeId: m,
      })),
      docCategoryList: docCategoryList.map((m) => ({
        CodeId: m,
      })),
    }
    postGoodsData(requestBody)
  }

  return (
    <form>
      <Box display={'flex'} flexDirection={'column'} rowGap={'30px'} maxWidth={'700px'} marginBottom={10}>
        <MIField labelSize="lg" label="상품명">
          <Typography color="gray.70" variant="body4">
            {goodsNm}
          </Typography>
        </MIField>

        <MIField labelSize="lg" label="등록 방식">
          <RadioGroup row value={'newRegistration'} sx={{ pointerEvents: 'none' }}>
            <FormControlLabel value="newRegistration" control={<Radio />} label="신규 등록" />
            <FormControlLabel value="updateExistingData" control={<Radio />} label="기존 데이터 업데이트" />
          </RadioGroup>
        </MIField>

        <form.Field name="goodsDataNm">
          {(field) => (
            <MIField labelSize="lg" label="데이터명" required subText="데이터의 이름을 입력해주세요.">
              <MIInput placeholder="입력하세요" fullWidth value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
            </MIField>
          )}
        </form.Field>

        <form.Field name="goodsDataExpn">
          {(field) => (
            <MIField labelSize="lg" label="Description" subText="데이터에 대한 설명을 입력해주세요.">
              <MIInput
                placeholder="내용을 입력하세요"
                fullWidth
                multiline
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </MIField>
          )}
        </form.Field>

        <form.Field name="goodsDataSummaryCntt">
          {(field) => (
            <MIField labelSize="lg" label="Summary" subText="데이터에 대한 요약 정보를 입력해주세요.">
              <MIInput
                placeholder="내용을 입력하세요"
                fullWidth
                multiline
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </MIField>
          )}
        </form.Field>

        <MIField labelSize="lg" label="데이터 카테고리" subText="대분류, 중분류를 선택하여 추가하세요. 중복 등록이 가능합니다.">
          <Flex direction="row" gap={8}>
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
              <Grid size={6}>
                <MISelect
                  value={majorOccupation}
                  onChange={(e) => {
                    setMajorOccupation(e.target.value as string)
                    setMediumOccupation('')
                  }}
                  placeholder="대분류"
                  sizeSelect={'h34'}
                  fullWidth
                  options={majorOccupationOptions}
                ></MISelect>
              </Grid>
              <Grid size={6}>
                <MISelect
                  sizeSelect={'h34'}
                  value={mediumOccupation}
                  onChange={(e) => setMediumOccupation(e.target.value as string)}
                  placeholder="중분류"
                  disabled={!majorOccupation}
                  fullWidth
                  options={mediumOccupationOptions}
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
            <MIField labelSize="lg" label="데이터 분류" required>
              <FormGroup row>
                {['structured', 'unstructured'].map((val) => (
                  <FormControlLabel
                    key={val}
                    control={
                      <AdminCheckbox
                        checked={field.state.value.includes(val)}
                        onChange={(e) => {
                          const isChecked = e.target.checked
                          const newValue = isChecked ? [...field.state.value, val] : field.state.value.filter((v) => v !== val)

                          field.handleChange(newValue)
                        }}
                      />
                    }
                    value={val}
                    label={val === 'structured' ? '정형 데이터' : '비정형 데이터'}
                  />
                ))}
              </FormGroup>
              <Box marginTop={7.5}>
                <MIAccordion
                  visibleKeys={form.state.values.fileTypes}
                  defaultExpandedKeys={['structured', 'unstructured']}
                  items={accordionItems}
                />
              </Box>
            </MIField>
          )}
        </form.Field>
      </Box>
      <AdminConfirm
        open={openCancelConfirmation}
        title={<>취소하시겠습니까?</>}
        width={450}
        handleClose={() => setCancelConfirmation(false)}
        actions={[
          {
            label: <Typography variant="body2SB14">이어서 작성</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => setCancelConfirmation(false),
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
      </AdminConfirm>

      <AdminConfirm
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
      </AdminConfirm>

      <AdminConfirm
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
      ></AdminConfirm>
    </form>
  )
}

export default AdminDataRegistration
