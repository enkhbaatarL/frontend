import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import { Box, Chip, FormGroup, Grid2 as Grid, Typography } from '@mui/material'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { useForm, useStore } from '@tanstack/react-form'
import { t } from 'i18next'
import { useEffect, useRef, useState } from 'react'

import AdminCheckbox from '@/components/admin/AdminCheckbox.tsx'
import AdminConfirm from '@/components/admin/AdminConfirm'
import AdminItemUpload from '@/components/admin/AdminItemUpload.tsx'
import AdminUpload, { UploadFieldRef } from '@/components/admin/AdminUpload'
import MIAccordion from '@/components/common/accordion/MIAccordion.tsx'
import MIButton from '@/components/common/button/MIButton'
import MIDatePicker from '@/components/common/datepicker/MIDatePicker'
import Flex from '@/components/common/display/Flex'
import UploadIcon from '@/components/common/icons/UploadIcon.tsx'
import MIField from '@/components/common/input/MIField.tsx'
import MIInput from '@/components/common/input/MIInput.tsx'
import MISelect from '@/components/common/select/MISelect'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import { getRandomItem } from '@/utils/mock-data'

export interface FileInfo {
  id?: string
  name: string
  size: number
  type: string
  url: string
}
interface FileItem {
  file?: File
  info: FileInfo
  preview: string
  starred?: boolean
  default?: boolean
}

// interface AdminDataRegistrationRequestBody {
//   goodsDataNm: string
//   goodsDataExpn: string
//   goodsDataSummaryCntt: string
//   docCategoryList: [
//     {
//       CodeId: string
//     },
//   ]
//   langCategoryList: [
//     {
//       CodeId: string
//     },
//   ]
//   structuredDataList: [
//     {
//       componentTypeId: string
//       fileNo: number
//     },
//   ]
//   unstructuredDataList: [
//     {
//       criteriaDt: string
//       fileNo: number
//     },
//   ]
// }

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
  // const { getPath } = useAdminMenuItems()

  const { showSnackbar } = useSnackbar()
  const { setCustomComponent, setCustomTitle } = useAdminHeader()
  const [categories, setCategories] = useState<string[]>([])
  const [majorOccupation, setMajorOccupation] = useState('')
  const [mediumOccupation, setMediumOccupation] = useState('')
  const [openCancelConfirmation, setCancelConfirmation] = useState(false)
  const [openRegisterErrorFileAlert, setOpenRegisterErrorFileAlert] = useState(false)
  const [openRegisterSuccessFileAlert, setOpenRegisterSuccessFileAlert] = useState(false)
  const [structuredFile, setStructuredFile] = useState('')
  const [unstructuredFileName, setUnstructuredFileName] = useState('')
  const [structuredFileName, setStructuredFileName] = useState('')

  const form = useForm({
    defaultValues: {
      dataName: '',
      description: '',
      summary: '',
      fileTypes: [] as string[],
    },
    validators: {
      onChange: ({ value }) => {
        const isRequire = (v: string) => (v.length === 0 ? true : undefined)

        return {
          fields: {
            dataName: isRequire(value.dataName),
          },
        }
      },
    },
  })

  const formCanSubmit = useStore(form.store, (state) => state.isDirty && state.canSubmit)

  const uploadRef = useRef<UploadFieldRef>(null)
  const uploadRefDate = useRef<UploadFieldRef>(null)
  const [files, setFiles] = useState<FileItem[]>([])

  const [filesUnstructured, setFilesUnstructured] = useState<FileItem[]>([])
  const handleClickAdd = () => {
    uploadRef.current?.addPendingFile()
  }
  const handleClickAddDate = () => {
    uploadRefDate.current?.addPendingFile()
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles]

      const fileToRemove = newFiles[index]

      if (fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }

      newFiles.splice(index, 1)
      uploadRef.current?.handleChange?.(newFiles)

      return newFiles
    })
  }

  const handleRemoveFileDate = (index: number) => {
    setFilesUnstructured((prevFiles) => {
      const newFiles = [...prevFiles]

      const fileToRemove = newFiles[index]

      if (fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }

      newFiles.splice(index, 1)
      uploadRefDate.current?.handleChange?.(newFiles)

      return newFiles
    })
  }

  const accordionItems = [
    {
      key: 'structured',
      title: '정형 데이터 업로드',
      isRequired: true,
      tooltip: '데이터 타입 선택 후 파일을 업로드하세요.',
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
                    setStructuredFile(String(e.target.value))
                  }}
                  value={structuredFile}
                  sizeSelect={'h34'}
                  placeholder="데이터 소스를 선택하세요."
                  fullWidth
                  options={[
                    { label: t('Data source 1'), value: 'datasource1' },
                    { label: t('Data source 2'), value: 'datasource2' },
                    { label: t('Data source 3'), value: 'datasource3' },
                  ]}
                ></MISelect>
              </Grid>
              <Grid size={6}>
                <AdminUpload
                  multiple
                  disabled={!structuredFile}
                  isInput
                  ref={uploadRef}
                  onChange={(updatedFiles: FileItem[]) => {
                    setFiles(updatedFiles)
                  }}
                  onChangeName={(value) => {
                    setStructuredFileName(value)
                  }}
                  onRemoveName={() => {
                    setStructuredFileName('')
                  }}
                />
              </Grid>
            </Grid>
            <Box width={34}>
              <MIButton
                disabled={!structuredFileName}
                onClick={(e) => {
                  e.preventDefault()
                  setCategories((prev) => ['국가 • 두바이', ...prev])
                  handleClickAdd()
                  setStructuredFileName('')
                }}
                startIcon={<UploadIcon style={{ color: !structuredFileName ? '#CED4DA' : '#868E96' }} fontSize="small" />}
                contentType={'icon'}
                type="outlined"
              />
            </Box>
          </Flex>
          {files.length > 0 && (
            <Box mt={2}>
              {files.map((fileItem, index) => (
                <AdminItemUpload checkFile="pass" key={index} file={fileItem.info} onDelete={() => handleRemoveFile(index)} />
              ))}
            </Box>
          )}
        </Box>
      ),
    },
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
                  onChange={(_value) => {
                    // setUnstructuredDate(String(value))
                  }}
                  size="h34"
                />
              </Grid>
              <Grid size={6}>
                <AdminUpload
                  multiple
                  isInput
                  ref={uploadRefDate}
                  onChange={(updatedFiles: FileItem[]) => {
                    setFilesUnstructured(updatedFiles)
                  }}
                  onChangeName={(value) => {
                    setUnstructuredFileName(value)
                  }}
                  onRemoveName={() => {
                    setUnstructuredFileName('')
                  }}
                />
              </Grid>
            </Grid>
            <Box width={34}>
              <MIButton
                disabled={!unstructuredFileName}
                onClick={(e) => {
                  e.preventDefault()
                  handleClickAddDate()
                  setUnstructuredFileName('')
                }}
                startIcon={<UploadIcon style={{ color: !unstructuredFileName ? '#CED4DA' : '#868E96' }} fontSize="small" />}
                contentType={'icon'}
                type="outlined"
              />
            </Box>
          </Flex>
          {filesUnstructured.length > 0 && (
            <Box mt={2}>
              {filesUnstructured.map((fileItem, index) => (
                <AdminItemUpload checkFile="pass" key={index} file={fileItem.info} onDelete={() => handleRemoveFileDate(index)} />
              ))}
            </Box>
          )}
        </Box>
      ),
    },
  ]

  const CustomPageTitle = () => (
    <Box display="flex" alignItems="center" columnGap={'10px'}>
      <Typography color="gray.90" variant="heading2">
        {t('데이터 등록')}
      </Typography>
    </Box>
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

    setCustomTitle(<CustomPageTitle />)

    return () => {
      setCustomComponent(null)
      setCustomTitle(null)
    }
  }, [setCustomComponent, formCanSubmit, setCustomTitle])

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

  return (
    <form>
      <Box display={'flex'} flexDirection={'column'} rowGap={'30px'} maxWidth={'700px'}>
        <MIField labelSize="lg" label="상품명">
          <Typography color="gray.70" variant="body4">
            제조사별 DRAM 생산량dddd
          </Typography>
        </MIField>

        <MIField labelSize="lg" label="등록 방식">
          <RadioGroup row value={'newRegistration'} sx={{ pointerEvents: 'none' }}>
            <FormControlLabel value="newRegistration" control={<Radio />} label="신규 등록" />
            <FormControlLabel value="updateExistingData" control={<Radio />} label="기존 데이터 업데이트" />
          </RadioGroup>
        </MIField>

        <form.Field name="dataName">
          {(field) => (
            <MIField labelSize="lg" label="데이터명" required subText="데이터의 이름을 입력해주세요.">
              <MIInput placeholder="입력하세요" fullWidth value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
            </MIField>
          )}
        </form.Field>

        <form.Field name="description">
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

        <form.Field name="summary">
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
                  setCategories((prev) => ['국가 • 두바이', ...prev])
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
        handleClose={() => {
          setCancelConfirmation(false)
        }}
        actions={[
          {
            label: <Typography variant="body2SB14">이어서 작성</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setCancelConfirmation(false)
            },
          },
          {
            label: <Typography variant="body2SB14">취소 및 이동</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setCancelConfirmation(false)
              /** TODO */
              // navigate(getPath('data-provider-product-detail'))
            },
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
        handleClose={() => {
          setOpenRegisterSuccessFileAlert(false)
        }}
        actions={[
          {
            label: <Typography variant="body2SB14">취소</Typography>,
            variant: 'outlined',
            color: 'gray',
            onClick: () => {
              setOpenRegisterSuccessFileAlert(false)
            },
          },
          {
            label: <Typography variant="body2SB14">등록</Typography>,
            variant: 'filled',
            color: 'primary',
            onClick: () => {
              setOpenRegisterSuccessFileAlert(false)
              // Simulate error and success states
              const state = getRandomItem(['success', 'error'])

              if (state === 'success') {
                showSnackbar('저장되었습니다.', { variant: 'success' })
                /** TODO */
                // navigate(getPath('data-provider-product-detail'))
              }

              if (state === 'error') {
                showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' })
              }
            },
          },
        ]}
      ></AdminConfirm>
    </form>
  )
}

export default AdminDataRegistration
