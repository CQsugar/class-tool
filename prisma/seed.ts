import { Gender, ItemType, PointType, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始数据库种子数据初始化...')

  // 清理现有数据（仅用于开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 清理现有数据...')
    await prisma.pointRecord.deleteMany()
    await prisma.redemption.deleteMany()
    await prisma.callHistory.deleteMany()
    await prisma.pKParticipant.deleteMany()
    await prisma.pKSession.deleteMany()
    await prisma.studentGroupMember.deleteMany()
    await prisma.studentTagRelation.deleteMany()
    await prisma.studentTag.deleteMany()
    await prisma.studentGroup.deleteMany()
    await prisma.storeItem.deleteMany()
    await prisma.pointRule.deleteMany()
    await prisma.student.deleteMany()
    await prisma.archive.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
  }

  // 1. 创建示例用户
  console.log('👤 创建示例用户...')
  const demoUser = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      name: '张老师',
      emailVerified: true,
      accounts: {
        create: {
          accountId: 'demo-account',
          providerId: 'credential',
          password: '$2a$10$XYZ...', // 实际使用时需要正确的哈希密码
        },
      },
    },
  })
  console.log(`✅ 创建用户: ${demoUser.name}`)

  // 2. 创建学生分组
  console.log('👥 创建学生分组...')
  const group1 = await prisma.studentGroup.create({
    data: {
      name: '第一小组',
      description: '班级第一学习小组',
      color: '#3b82f6',
      userId: demoUser.id,
    },
  })

  const group2 = await prisma.studentGroup.create({
    data: {
      name: '第二小组',
      description: '班级第二学习小组',
      color: '#10b981',
      userId: demoUser.id,
    },
  })

  const group3 = await prisma.studentGroup.create({
    data: {
      name: '第三小组',
      description: '班级第三学习小组',
      color: '#f59e0b',
      userId: demoUser.id,
    },
  })

  console.log(`✅ 创建 3 个学生分组`)

  // 3. 创建学生标签
  console.log('🏷️  创建学生标签...')
  const tagClass = await prisma.studentTag.create({
    data: {
      name: '班委',
      color: '#ef4444',
      userId: demoUser.id,
    },
  })

  const tagGood = await prisma.studentTag.create({
    data: {
      name: '三好学生',
      color: '#f59e0b',
      userId: demoUser.id,
    },
  })

  const tagActive = await prisma.studentTag.create({
    data: {
      name: '活跃',
      color: '#10b981',
      userId: demoUser.id,
    },
  })

  console.log(`✅ 创建 3 个学生标签`)

  // 4. 创建示例学生
  console.log('👨‍🎓 创建示例学生...')
  const students = [
    {
      name: '张三',
      studentNo: '2024001',
      gender: Gender.MALE,
      points: 100,
      groupId: group1.id,
      tags: [tagClass.id, tagActive.id],
    },
    {
      name: '李四',
      studentNo: '2024002',
      gender: Gender.MALE,
      points: 85,
      groupId: group1.id,
      tags: [tagActive.id],
    },
    {
      name: '王五',
      studentNo: '2024003',
      gender: Gender.FEMALE,
      points: 95,
      groupId: group1.id,
      tags: [tagGood.id],
    },
    {
      name: '赵六',
      studentNo: '2024004',
      gender: Gender.MALE,
      points: 78,
      groupId: group2.id,
      tags: [],
    },
    {
      name: '孙七',
      studentNo: '2024005',
      gender: Gender.FEMALE,
      points: 92,
      groupId: group2.id,
      tags: [tagActive.id],
    },
    {
      name: '周八',
      studentNo: '2024006',
      gender: Gender.MALE,
      points: 88,
      groupId: group2.id,
      tags: [tagGood.id],
    },
    {
      name: '吴九',
      studentNo: '2024007',
      gender: Gender.FEMALE,
      points: 80,
      groupId: group3.id,
      tags: [],
    },
    {
      name: '郑十',
      studentNo: '2024008',
      gender: Gender.MALE,
      points: 75,
      groupId: group3.id,
      tags: [],
    },
    {
      name: '钱一',
      studentNo: '2024009',
      gender: Gender.FEMALE,
      points: 90,
      groupId: group3.id,
      tags: [tagActive.id],
    },
    {
      name: '陈二',
      studentNo: '2024010',
      gender: Gender.MALE,
      points: 83,
      groupId: group1.id,
      tags: [],
    },
  ]

  for (const studentData of students) {
    const { tags, groupId, ...data } = studentData
    const student = await prisma.student.create({
      data: {
        ...data,
        userId: demoUser.id,
        parentPhone: `138${Math.floor(Math.random() * 100000000)
          .toString()
          .padStart(8, '0')}`,
      },
    })

    // 添加到分组
    await prisma.studentGroupMember.create({
      data: {
        studentId: student.id,
        groupId: groupId,
      },
    })

    // 添加标签
    for (const tagId of tags) {
      await prisma.studentTagRelation.create({
        data: {
          studentId: student.id,
          tagId: tagId,
        },
      })
    }
  }

  console.log(`✅ 创建 ${students.length} 个示例学生`)

  // 5. 创建积分规则
  console.log('📋 创建积分规则...')
  const pointRules = [
    // 加分规则
    {
      name: '作业优秀',
      points: 5,
      type: PointType.ADD,
      category: '学习',
      description: '作业完成质量优秀',
    },
    {
      name: '课堂发言',
      points: 3,
      type: PointType.ADD,
      category: '课堂',
      description: '积极举手发言',
    },
    {
      name: '帮助同学',
      points: 2,
      type: PointType.ADD,
      category: '品德',
      description: '主动帮助同学',
    },
    {
      name: '值日认真',
      points: 3,
      type: PointType.ADD,
      category: '卫生',
      description: '值日工作认真负责',
    },
    {
      name: '考试进步',
      points: 10,
      type: PointType.ADD,
      category: '学习',
      description: '考试成绩有明显进步',
    },

    // 减分规则
    {
      name: '作业未交',
      points: -5,
      type: PointType.SUBTRACT,
      category: '学习',
      description: '未按时完成作业',
    },
    {
      name: '迟到',
      points: -3,
      type: PointType.SUBTRACT,
      category: '纪律',
      description: '上课迟到',
    },
    {
      name: '课堂纪律',
      points: -2,
      type: PointType.SUBTRACT,
      category: '纪律',
      description: '违反课堂纪律',
    },
    {
      name: '卫生不合格',
      points: -3,
      type: PointType.SUBTRACT,
      category: '卫生',
      description: '个人卫生或值日不合格',
    },
  ]

  for (const rule of pointRules) {
    await prisma.pointRule.create({
      data: {
        ...rule,
        userId: demoUser.id,
      },
    })
  }

  console.log(`✅ 创建 ${pointRules.length} 条积分规则`)

  // 6. 创建积分商城商品
  console.log('🏪 创建积分商城商品...')
  const storeItems = [
    {
      name: '免作业卡',
      description: '可免除一次作业',
      cost: 50,
      type: ItemType.PRIVILEGE,
      stock: null,
      sortOrder: 1,
    },
    {
      name: '优先选座权',
      description: '可优先选择座位一周',
      cost: 30,
      type: ItemType.PRIVILEGE,
      stock: null,
      sortOrder: 2,
    },
    {
      name: '小红花',
      description: '表扬奖励小红花一朵',
      cost: 10,
      type: ItemType.VIRTUAL,
      stock: null,
      sortOrder: 3,
    },
    {
      name: '笔记本',
      description: '精美笔记本一本',
      cost: 40,
      type: ItemType.PHYSICAL,
      stock: 20,
      sortOrder: 4,
    },
    {
      name: '钢笔',
      description: '学生专用钢笔',
      cost: 60,
      type: ItemType.PHYSICAL,
      stock: 10,
      sortOrder: 5,
    },
    {
      name: '课外书籍',
      description: '精选课外阅读书籍',
      cost: 80,
      type: ItemType.PHYSICAL,
      stock: 15,
      sortOrder: 6,
    },
  ]

  for (const item of storeItems) {
    await prisma.storeItem.create({
      data: {
        ...item,
        userId: demoUser.id,
      },
    })
  }

  console.log(`✅ 创建 ${storeItems.length} 个商城商品`)

  console.log('✨ 数据库种子数据初始化完成！')
  console.log('\n📊 数据统计:')
  console.log(`  - 用户: 1`)
  console.log(`  - 学生: ${students.length}`)
  console.log(`  - 分组: 3`)
  console.log(`  - 标签: 3`)
  console.log(`  - 积分规则: ${pointRules.length}`)
  console.log(`  - 商城商品: ${storeItems.length}`)
  console.log('\n💡 提示: 使用以下命令运行种子数据:')
  console.log('   pnpm db:seed')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error('❌ 种子数据初始化失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
