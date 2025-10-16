import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '仪表板 - 班级管理平台',
  description: '班级管理平台仪表板概览',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
        <p className="text-gray-600">欢迎回来！查看您的班级管理概况</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-2">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">学生总数</p>
              <p className="text-2xl font-bold text-gray-900">42</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-2">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总积分</p>
              <p className="text-2xl font-bold text-gray-900">1,250</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-yellow-100 p-2">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707.707A1 1 0 002 7v10a1 1 0 00.293.707l.707.707A3 3 0 005.5 19H18a1 1 0 001-1V8a1 1 0 00-.293-.707l-.707-.707A3 3 0 0015.5 6H12V5h3.5a4 4 0 012.828 1.172"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日点名</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-100 p-2">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">活跃度</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-gray-900">快速操作</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <button className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-blue-300 hover:bg-blue-50">
            <div className="mx-auto mb-2 h-8 w-8 text-blue-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-900">添加学生</span>
          </button>

          <button className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-green-300 hover:bg-green-50">
            <div className="mx-auto mb-2 h-8 w-8 text-green-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-900">记录积分</span>
          </button>

          <button className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-yellow-300 hover:bg-yellow-50">
            <div className="mx-auto mb-2 h-8 w-8 text-yellow-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v2m0 0v2a1 1 0 01-1 1H8a1 1 0 01-1-1V4"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-900">随机点名</span>
          </button>

          <button className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-purple-300 hover:bg-purple-50">
            <div className="mx-auto mb-2 h-8 w-8 text-purple-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-900">开始PK</span>
          </button>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-gray-900">最近活动</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">李小明获得了5积分 - 课堂发言积极</span>
            <span className="text-xs text-gray-400">2分钟前</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600">王小红兑换了笔记本</span>
            <span className="text-xs text-gray-400">15分钟前</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-600">随机点名：张小强</span>
            <span className="text-xs text-gray-400">30分钟前</span>
          </div>
        </div>
      </div>
    </div>
  )
}
