import { Metadata } from 'next'
import { UsersManagementClient } from './users-management-client'

export const metadata: Metadata = {
  title: '用户管理',
  description: '管理系统用户、角色和权限',
}

export default function UsersManagementPage() {
  return <UsersManagementClient />
}
