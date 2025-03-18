import { Button, MenuItem, Select } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Flex from '@/components/common/display/Flex'

const TempLoginPassPage = () => {
  const navigate = useNavigate()
  const [customerCompany, setCustomerCompany] = useState('실트론')

  return (
    <Flex direction="column" gap={20} className="full-height" justify="center" align="center">
      <Flex gap={52}>
        <Flex gap={10}>
          <Select
            labelId="customer-company-select-label"
            size="small"
            value={customerCompany}
            onChange={(e) => {
              setCustomerCompany(e.target.value)
            }}
            sx={{
              width: '140px',
            }}
          >
            <MenuItem value="실트론">실트론</MenuItem>
            <MenuItem value="하이닉스">하이닉스</MenuItem>
            <MenuItem value="온">온</MenuItem>
            <MenuItem value="이노베이션">이노베이션</MenuItem>
            <MenuItem value="에너지">에너지</MenuItem>
            <MenuItem value="E&S">E&S</MenuItem>
            <MenuItem value="gas">gas</MenuItem>
          </Select>
          <Button
            variant="contained"
            onClick={() => {
              navigate('user/')
            }}
          >
            사용자 로그인
          </Button>
        </Flex>
        <Button
          variant="contained"
          onClick={() => {
            navigate('admin')
          }}
        >
          관리자 로그인
        </Button>
      </Flex>
      <Button
        onClick={() => {
          navigate('/component-test')
        }}
      >
        Component Test
      </Button>
    </Flex>
  )
}

export default TempLoginPassPage
