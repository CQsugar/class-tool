import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // 检查用户认证状态
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">班主任管理仪表板</h1>
      <div className="mb-4">
        <p className="text-gray-600">欢迎回来，{session.user.name}！</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">学生管理</h2>
          <p className="text-gray-600">管理班级学生信息、导入导出数据</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">积分系统</h2>
          <p className="text-gray-600">学生积分管理、规则设置</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">随机点名</h2>
          <p className="text-gray-600">随机点名工具，避重功能</p>
        </div>
      </div>
    </div>
  )
}
