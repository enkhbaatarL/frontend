import { Box, FormGroup, Grid2 as Grid, ListItem, Typography } from '@mui/material'
import FormControlLabel from '@mui/material/FormControlLabel'
import { Updater } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'

import AdminCheckbox from '@/components/admin/AdminCheckbox.tsx'
import AdminItemUpload, { FileType } from '@/components/admin/AdminItemUpload/AdminItemUpload'
import AdminUpload from '@/components/admin/AdminUpload'
import MIAccordion from '@/components/common/accordion/MIAccordion.tsx'
import MIButton from '@/components/common/button/MIButton'
import MIDatePicker from '@/components/common/datepicker/MIDatePicker'
import Flex from '@/components/common/display/Flex'
import MIField from '@/components/common/input/MIField.tsx'
import MISelect from '@/components/common/select/MISelect'
import useSnackbar from '@/hooks/useSnackbar'
import axios from '@/lib/axios'
import dataProviderService, { IProviderGoodsDataDetailResponse } from '@/service/admin/dataProvider'
import { formatSize } from '@/utils/dataUtil'

export type AdminDataUploadFileInfo = {
  fileNo: number
  componentTypeId?: string // 정형 only
  criteriaDt?: string // 비정형 only
  fileNm: string
  fileSize: number
  type: FileType
  fileKey: string | null
  status: 'uploading' | 'checking' | 'fail' | 'pass'
}

interface AdminDataRegiUploadComponentProps {
  fileTypes: string[]
  selectedTypes: string[]
  onChange: (updater: Updater<string[]>) => void
  filesStructured: AdminDataUploadFileInfo[]
  setFilesStructured: Dispatch<SetStateAction<AdminDataUploadFileInfo[]>>
  filesUnstructured: AdminDataUploadFileInfo[]
  setFilesUnstructured: Dispatch<SetStateAction<AdminDataUploadFileInfo[]>>
  savedstructuredData: IProviderGoodsDataDetailResponse['structuredDataList']
  savedunstructuredData: IProviderGoodsDataDetailResponse['unstructuredDataList']
}

const documentFileType = ['application/pdf', 'text/csv', 'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint']

const AdminDataRegiUploadComponent = ({
  fileTypes,
  selectedTypes,
  filesStructured,
  filesUnstructured,
  setFilesStructured,
  setFilesUnstructured,
  onChange,
  savedstructuredData,
  savedunstructuredData,
}: AdminDataRegiUploadComponentProps) => {
  const { showSnackbar } = useSnackbar()
  /** 선택된 정형화 데이터 카테고리 */
  const [structuredComponentType, setStructuredComponentType] = useState('')

  /** 선택된 비정형화 데이터 카테고리 */
  const [unstructuredDate, setUnstructuredDate] = useState<Dayjs | null>(dayjs())

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

  const onUploadAction = useCallback(
    async (file: File, uploadType: 'structured' | 'unstructured') => {
      const setAction = uploadType === 'structured' ? setFilesStructured : setFilesUnstructured

      /** 업로드 진행동안 추적할 uniqKey */
      const fileKey = `${Date.now()}-${file.name}`
      const formData = new FormData()
      formData.append('file', file)

      const { name, type, size } = file
      const newFileInfo = {
        fileNo: -1,
        fileNm: name,
        fileSize: size,
        fileKey,
        type: type as FileType,
        status: 'uploading' as AdminDataUploadFileInfo['status'],
        ...(uploadType === 'structured' ? { componentTypeId: structuredComponentType } : {}),
        ...(uploadType === 'unstructured' ? { criteriaDt: dayjs(unstructuredDate).format('YYYYMMDD') } : {}),
      }

      if (uploadType === 'structured') {
        formData.append(
          'data',
          JSON.stringify({
            componentTypeId: structuredComponentType,
          }),
        )
        setStructuredComponentType('')
      }
      setAction((prev) => [...prev, newFileInfo])
      try {
        const response = await axios.post(`/admin/provider-management/goods-datas/upload-file/${uploadType}-data`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            const percent = Math.round((event.loaded * 100) / (event.total || 1))
            updateUploadProgress(fileKey, percent)
          },
        })
        const { fileNo } = response.data.data
        setAction((prev) => prev.map((f) => (f.fileKey === fileKey ? { ...f, fileNo, fileKey: null, status: 'pass' } : f)))
        setTimeout(() => clearUploadProgress(fileKey), 1000)
      } catch {
        setAction((prev) => prev.map((f) => (f.fileKey === fileKey ? { ...f, fileKey: null, status: 'fail' } : f)))
        clearUploadProgress(fileKey)
      }
    },
    [clearUploadProgress, setFilesStructured, setFilesUnstructured, structuredComponentType, unstructuredDate, updateUploadProgress],
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

  const originFileTypes: string[] = useMemo(() => {
    const originTypesArr = []
    if (savedstructuredData.length > 0) originTypesArr.push('structured')
    if (savedunstructuredData.length > 0) originTypesArr.push('unstructured')
    return originTypesArr
  }, [savedstructuredData.length, savedunstructuredData.length])

  // POST 비정형 데이터 다운로드
  const { mutate: postDownloadUnstructuredData } = useMutation({
    mutationFn: (body: { fileNo: number; fileNm: string }) => dataProviderService.postDownloadUnstructuredData(Number(body.fileNo), body),
    onSuccess: (response, body) => {
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = body.fileNm
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    },
    onError: () => showSnackbar('문제가 발생했습니다.', { variant: 'error', body: '나중에 다시 시도해 주세요.' }),
  })

  const onDeleteUnstructuredData = (fileNo: number) => {
    console.log('TODO', fileNo)
  }

  return (
    <MIField labelSize="lg" label="데이터 분류" required>
      <FormGroup row>
        {['structured', 'unstructured'].map((val) => (
          <FormControlLabel
            key={val}
            control={
              <AdminCheckbox
                checked={[...selectedTypes, ...originFileTypes].includes(val)}
                disabled={originFileTypes.includes(val)}
                onChange={(e) => {
                  const isChecked = e.target.checked
                  const newValue = isChecked ? [...selectedTypes, val] : selectedTypes.filter((v) => v !== val)
                  onChange(newValue)
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
          visibleKeys={[...fileTypes, ...originFileTypes]}
          defaultExpandedKeys={['structured', 'unstructured']}
          items={[
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
                          useAllOption={false}
                          options={availableDataTypeOptions}
                        ></MISelect>
                      </Grid>
                      <Grid size={6}>
                        <AdminUpload
                          disabled={!structuredComponentType}
                          onUploadAction={(file) => onUploadAction(file, 'structured')}
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
                          showChecking
                          progressValue={uploadProgressMap[fileItem.fileKey ?? '']}
                          fileItem={fileItem}
                          onDelete={() => setFilesStructured((prev) => prev.filter((_f, idx) => idx !== index))}
                        />
                      ))}
                    </Box>
                  )}
                  {savedstructuredData.length !== 0 && (
                    <Box>
                      <Typography variant="labelText" color="gray.70" component="div" marginBottom={1.5}>
                        기존 등록 파일
                      </Typography>
                      <Box className="boxScroll">
                        <ul>
                          {savedstructuredData.map((originFile, index) => (
                            <li key={index}>
                              <Flex style={{ padding: '6px 0' }} gap={8}>
                                <Typography variant="body3M12" color="gray.60">
                                  {index + 1}
                                </Typography>
                                <Typography variant="body3R12" color="gray.70">
                                  {originFile.componentTypeNm}
                                </Typography>
                                <Typography variant="body3R12" color="gray.60">
                                  {originFile.createDt}
                                </Typography>
                              </Flex>
                            </li>
                          ))}
                        </ul>
                      </Box>
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
                        <MIDatePicker onChange={setUnstructuredDate} value={unstructuredDate} size="h34" />
                      </Grid>
                      <Grid size={6}>
                        <AdminUpload
                          disabled={!unstructuredDate}
                          onUploadAction={(file) => onUploadAction(file, 'unstructured')}
                          acceptedTypes={documentFileType}
                          maxSize={24}
                        />
                      </Grid>
                    </Grid>
                  </Flex>
                  {filesUnstructured.length > 0 && (
                    <Box mt={2}>
                      {filesUnstructured.map((fileItem, index) => (
                        <AdminItemUpload
                          checkFile={fileItem.status}
                          key={index}
                          progressValue={uploadProgressMap[fileItem.fileKey ?? '']}
                          fileItem={fileItem}
                          onDelete={() => setFilesUnstructured((prev) => prev.filter((_f, idx) => idx !== index))}
                        />
                      ))}
                    </Box>
                  )}

                  {savedunstructuredData.length !== 0 && (
                    <Box>
                      <Typography variant="labelText" color="gray.70" component="div" marginBottom={1.5}>
                        기존 등록 파일
                      </Typography>
                      <Box className="boxScroll">
                        {savedunstructuredData.map((originFile, index) => (
                          <ListItem disablePadding key={index} dense>
                            <Typography variant="body3M12" color="gray.60" mr={2}>
                              {index + 1}
                            </Typography>
                            <Typography variant="body3R12" color="gray.60" mr={2}>
                              {dayjs(originFile.criteriaDt).format('YY-MM-  DD')}
                            </Typography>
                            <Typography variant="body3SB12" color="gray.70" mr={2}>
                              {originFile.fileNm}
                            </Typography>
                            <Typography variant="body3R12" color="gray.60" mr={2}>
                              {formatSize(originFile.fileSize, 'mb')}
                            </Typography>
                            <MIButton
                              contentType="link"
                              size="h28"
                              type="ghost"
                              onClick={(e) => {
                                e.preventDefault()
                                const { fileNm, fileNo } = originFile
                                postDownloadUnstructuredData({ fileNm, fileNo })
                              }}
                            >
                              다운로드
                            </MIButton>
                            <MIButton
                              contentType="link"
                              size="h28"
                              type="ghost"
                              onClick={(e) => {
                                e.preventDefault()
                                onDeleteUnstructuredData(originFile.fileNo)
                              }}
                            >
                              삭제
                            </MIButton>
                          </ListItem>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              ),
            },
          ]}
        />
      </Box>
    </MIField>
  )
}

export default AdminDataRegiUploadComponent
