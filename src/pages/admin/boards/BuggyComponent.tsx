import React, { useState, useEffect } from 'react'

export const BuggyComponent = () => {
  const [triggerError, setTriggerError] = useState(false)

  if (triggerError) {
    // 여기서 런타임 에러 발생 (의도적)
    throw new Error('컴포넌트 내부에서 에러 발생!')
  }

  return (
    <div>
      <button
        onClick={() => {
          setTriggerError(true)
        }}
      ></button>
      정상적으로 렌더링 중...
    </div>
  )
}
