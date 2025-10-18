import useSWR, { SWRConfiguration } from 'swr'

// 通用fetcher函数
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('数据获取失败')
    throw error
  }
  return res.json()
}

// 默认SWR配置
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false, // 窗口获得焦点时不重新验证
  revalidateOnReconnect: true, // 网络恢复时重新验证
  dedupingInterval: 2000, // 2秒内的重复请求将被去重
}

// 学生列表hook
export function useStudents(params?: Record<string, string>) {
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
  const { data, error, isLoading, mutate } = useSWR(`/api/students${queryString}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000, // 学生列表5秒内不重复请求
  })

  return {
    students: data?.students,
    total: data?.total,
    isLoading,
    isError: error,
    mutate,
  }
}

// 学生详情hook
export function useStudent(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/students/${id}` : null, fetcher)

  return {
    student: data,
    isLoading,
    isError: error,
    mutate,
  }
}

// 积分排行榜hook
export function useLeaderboard(limit = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/dashboard/leaderboard?limit=${limit}`,
    fetcher,
    {
      refreshInterval: 30000, // 每30秒自动刷新
      revalidateOnFocus: true, // 排行榜在获得焦点时刷新
    }
  )

  return {
    leaderboard: data,
    isLoading,
    isError: error,
    mutate,
  }
}

// 班级数据概览hook
export function useOverviewStats() {
  const { data, error, isLoading, mutate } = useSWR('/api/dashboard/overview', fetcher, {
    refreshInterval: 60000, // 每分钟刷新一次
  })

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  }
}

// 积分规则列表hook
export function usePointRules(params?: Record<string, string>) {
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
  const { data, error, isLoading, mutate } = useSWR(`/api/points/rules${queryString}`, fetcher, {
    dedupingInterval: 5000,
  })

  return {
    rules: data?.rules,
    total: data?.total,
    pageCount: data?.pageCount,
    categories: data?.categories,
    isLoading,
    isError: error,
    mutate,
  }
}

// 商城商品列表hook
export function useStoreItems(params?: Record<string, string>) {
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
  const { data, error, isLoading, mutate } = useSWR(`/api/store/items${queryString}`, fetcher, {
    dedupingInterval: 5000,
  })

  return {
    items: data?.items,
    total: data?.total,
    pageCount: data?.pageCount,
    isLoading,
    isError: error,
    mutate,
  }
}
