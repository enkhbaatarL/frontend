import clsx from 'clsx'

import style from '@/components/admin/AdminUserInfo.module.scss'
import { IUserInfo } from '@/service/admin/members'

interface Props {
  info?: Partial<IUserInfo>
}

const AdminUserInfo = ({ info }: Props) => (
  <div className={clsx(style.boxTable)}>
    <table>
      <tbody>
        <tr>
          <th scope="row">회사명</th>
          <td>{info?.customerCompanyNm}</td>
        </tr>
        <tr>
          <th scope="row">소속</th>
          <td>{info?.departmentNm}</td>
        </tr>
        <tr>
          <th scope="row">직위</th>
          <td>{info?.onDutyNm}</td>
        </tr>
        <tr>
          <th scope="row">이름</th>
          <td>{info?.userNm}</td>
        </tr>
        <tr>
          <th scope="row">이메일</th>
          <td>{info?.userLoginId}</td>
        </tr>
      </tbody>
    </table>
  </div>
)

export default AdminUserInfo
