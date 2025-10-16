import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 优雅关闭处理
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

// ====================== 查询助手函数 ======================

/**
 * 获取用户的所有学生（包含积分和标签信息）
 */
export async function getStudentsWithDetails(userId: string) {
  return await prisma.student.findMany({
    where: {
      userId,
      isArchived: false,
    },
    include: {
      pointRecords: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          rule: true,
        },
      },
      groupMembers: {
        include: {
          group: true,
        },
      },
      tagRelations: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { points: 'desc' },
  })
}

/**
 * 为学生添加积分（事务处理）
 */
export async function addPointsToStudent(
  studentId: string,
  points: number,
  reason: string,
  userId: string,
  ruleId?: string
) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 更新学生积分
    const updatedStudent = await tx.student.update({
      where: { id: studentId },
      data: {
        points: { increment: points },
      },
    })

    // 记录积分变动
    const pointRecord = await tx.pointRecord.create({
      data: {
        studentId,
        points,
        reason,
        type: points > 0 ? 'ADD' : points < 0 ? 'SUBTRACT' : 'RESET',
        userId,
        ruleId,
      },
    })

    return { student: updatedStudent, record: pointRecord }
  })
}

/**
 * 获取学生的积分历史
 */
export async function getStudentPointHistory(
  studentId: string,
  limit: number = 20,
  offset: number = 0
) {
  return await prisma.pointRecord.findMany({
    where: { studentId },
    include: {
      rule: true,
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

/**
 * 获取可兑换的商店物品
 */
export async function getActiveStoreItems(userId: string) {
  return await prisma.storeItem.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { cost: 'asc' },
  })
}

/**
 * 学生兑换商品（事务处理）
 */
export async function redeemStoreItem(studentId: string, itemId: string, userId: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 获取学生和商品信息
    const student = await tx.student.findUnique({
      where: { id: studentId },
    })

    const item = await tx.storeItem.findUnique({
      where: { id: itemId },
    })

    if (!student) throw new Error('学生不存在')
    if (!item) throw new Error('商品不存在')
    if (!item.isActive) throw new Error('商品已下架')
    if (student.points < item.cost) throw new Error('积分不足')

    // 扣除积分
    await tx.student.update({
      where: { id: studentId },
      data: {
        points: { decrement: item.cost },
      },
    })

    // 记录积分扣除
    await tx.pointRecord.create({
      data: {
        studentId,
        points: -item.cost,
        reason: `兑换商品: ${item.name}`,
        type: 'SUBTRACT',
        userId,
      },
    })

    // 记录兑换记录
    const redemption = await tx.redemption.create({
      data: {
        studentId,
        itemId,
        userId,
        cost: item.cost,
        status: 'PENDING',
      },
    })

    return redemption
  })
}

/**
 * 获取24小时内被点名的学生ID列表
 */
export async function getRecentCalledStudents(userId: string) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const recentCalls = await prisma.callHistory.findMany({
    where: {
      userId,
      calledAt: {
        gte: twentyFourHoursAgo,
      },
      studentId: {
        not: null,
      },
    },
    select: {
      studentId: true,
    },
  })

  return recentCalls
    .map((call: { studentId: string | null }) => call.studentId)
    .filter(Boolean) as string[]
}

/**
 * 记录点名历史
 */
export async function recordCallHistory(
  userId: string,
  mode: 'INDIVIDUAL' | 'GROUP' | 'RANDOM',
  studentId?: string
) {
  return await prisma.callHistory.create({
    data: {
      userId,
      mode,
      studentId,
    },
  })
}
