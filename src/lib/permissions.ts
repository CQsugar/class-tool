/**
 * 用户类型定义 - 兼容 Better Auth session 返回的用户对象
 */
type UserLike =
  | {
      role?: string | null
    }
  | null
  | undefined

/**
 * 检查用户是否是管理员
 */
export function isAdmin(user: UserLike): boolean {
  if (!user) return false
  return user.role === 'admin'
}

/**
 * 检查用户是否有访问权限
 */
export function hasPermission(user: UserLike, requiredRole?: 'admin'): boolean {
  if (!user) return false
  if (!requiredRole) return true
  return isAdmin(user)
}

/**
 * 过滤导航项基于用户权限
 */
export function filterNavByPermission<T extends { requiresAdmin?: boolean }>(
  items: T[],
  user: UserLike
): T[] {
  return items.filter(item => {
    if (item.requiresAdmin) {
      return isAdmin(user)
    }
    return true
  })
}
