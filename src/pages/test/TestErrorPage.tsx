import { Button } from '@mui/material'
import { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Flex from '@/components/common/display/Flex'
import ErrorRoutes from '@/routes/ErrorRoutes'

const TestPage = () => {
  const navigate = useNavigate()

  return (
    <Flex direction="column" gap={20} className="full-height p-10">
      {ErrorRoutes.children
        ?.filter((child) => {
          const element = child.element as JSX.Element
          return !child.index && element?.type?.name !== 'Navigate'
        })
        .map((route) => (
          <Button key={route.path} variant="contained" onClick={() => navigate(`/error/${route.path}`)}>
            {route.path === '' ? 'common' : route.path}
          </Button>
        ))}
    </Flex>
  )
}

export default TestPage
