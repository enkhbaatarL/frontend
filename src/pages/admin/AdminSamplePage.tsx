import { Button } from '@mui/material'
import { useEffect } from 'react'

import Flex from '@/components/common/display/Flex'
import SampleChart from '@/components/user/chart/SampleChart'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'

const TestButtons = () => {
  return (
    <Flex gap={4}>
      <Button variant="contained" color="secondary" size="small">
        취소
      </Button>
      <Button variant="contained" color="primary" size="small">
        등록
      </Button>
    </Flex>
  )
}

const AdminSamplePage = () => {
  const { setCustomComponent } = useAdminHeader()

  useEffect(() => {
    setCustomComponent(<TestButtons />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return (
    <div className="p-14">
      Chart.js Test
      <SampleChart />
    </div>
  )
}

export default AdminSamplePage
