import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '认证 - 工具平台',
  description: '工具平台用户认证',
}

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  // 从环境变量读取配置
  const showDecorationArea = process.env.NEXT_PUBLIC_SHOW_AUTH_DECORATION !== 'false'
  const icpNumber = process.env.NEXT_PUBLIC_ICP_NUMBER
  const policeNumber = process.env.NEXT_PUBLIC_POLICE_NUMBER
  const policeNumberLink = process.env.NEXT_PUBLIC_POLICE_NUMBER_LINK

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* 左侧装饰区域 */}
        {showDecorationArea && (
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
            {/* 动态背景图案 */}
            <div className="absolute inset-0">
              {/* 主渐变层 */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-700/90 to-indigo-800/90" />

              {/* 几何装饰元素 */}
              <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-cyan-400/20 blur-2xl" />
              <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-pink-400/15 blur-3xl" />

              {/* 网格图案 */}
              <div className="absolute inset-0 opacity-20">
                <div className="grid h-full w-full grid-cols-8 grid-rows-8 gap-1">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-sm border border-white/10"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        animation: 'pulse 4s ease-in-out infinite',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 浮动装饰元素 */}
              <div
                className="absolute top-1/4 left-1/4 h-4 w-4 animate-bounce rounded-full bg-white/30"
                style={{ animationDelay: '0s' }}
              />
              <div
                className="absolute top-3/4 left-3/4 h-3 w-3 animate-bounce rounded-full bg-cyan-300/40"
                style={{ animationDelay: '1s' }}
              />
              <div
                className="absolute top-1/2 left-1/6 h-2 w-2 animate-bounce rounded-full bg-pink-300/50"
                style={{ animationDelay: '2s' }}
              />
            </div>

            {/* 内容区域 */}
            <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
              {/* 主标题区域 */}
              <div className="mb-8 text-center">
                <div className="mb-4 inline-flex items-center justify-center rounded-full bg-white/10 p-4 backdrop-blur-sm">
                  <svg
                    className="h-12 w-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h1 className="mb-4 text-5xl font-bold tracking-tight">班级管理平台</h1>
                <p className="text-xl font-medium text-white/90">智能化班主任管理工具</p>
                <p className="mt-2 text-lg text-white/70">提升教学效率，关爱每一位学生</p>
              </div>

              {/* 功能特色卡片 */}
              <div className="w-full max-w-sm space-y-4">
                <div className="group rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/15">
                  <div className="flex items-center justify-center space-x-3 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/30">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-center font-semibold">学生信息管理</h3>
                      <p className="text-center text-sm text-white/70">一站式学生档案管理</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/15">
                  <div className="flex items-center justify-center space-x-3 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/30">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-center font-semibold">积分激励系统</h3>
                      <p className="text-center text-sm text-white/70">科学化行为管理评价</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/15">
                  <div className="flex items-center justify-center space-x-3 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/30">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-center font-semibold">智能点名系统</h3>
                      <p className="text-center text-sm text-white/70">公平随机，避重机制</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/15">
                  <div className="flex items-center justify-center space-x-3 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/30">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-center font-semibold">PK竞赛系统</h3>
                      <p className="text-center text-sm text-white/70">激发学习热情动力</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部装饰 */}
              <div className="mt-8 text-center">
                <div className="flex items-center justify-center space-x-2 text-white/60">
                  <div className="h-1 w-8 rounded-full bg-white/40"></div>
                  <span className="text-sm">让教育更智能，让管理更简单</span>
                  <div className="h-1 w-8 rounded-full bg-white/40"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 右侧认证表单区域 */}
        <div
          className={`flex w-full items-center justify-center p-4 ${showDecorationArea ? 'lg:w-1/2' : ''}`}
        >
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* 页脚备案信息 */}
      {(icpNumber || policeNumber) && (
        <footer className="border-t py-6">
          <div className="text-muted-foreground container mx-auto flex flex-col items-center justify-center gap-2 px-4 text-center text-sm">
            {icpNumber && (
              <p>
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {icpNumber}
                </a>
              </p>
            )}
            {policeNumber && (
              <p className="flex items-center gap-2">
                {policeNumberLink ? (
                  <a
                    href={policeNumberLink}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground flex items-center gap-2 transition-colors"
                  >
                    <img src="/assets/image/police-badge.png" alt="公安备案" className="h-5 w-5" />
                    {policeNumber}
                  </a>
                ) : (
                  <>
                    <img src="/assets/image/police-badge.png" alt="公安备案" className="h-5 w-5" />
                    {policeNumber}
                  </>
                )}
              </p>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}
