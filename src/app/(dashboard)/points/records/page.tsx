'use client'

import {
  pointRecordColumns,
  type PointRecordColumn,
} from '@/components/points/point-record-columns'
import { PointRecordDataTable } from '@/components/points/point-record-data-table'
import { PointRecordStats } from '@/components/points/point-record-stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PointType } from '@prisma/client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface PointRecordStats {
  totalRecords: number
  addRecords: number
  subtractRecords: number
  resetRecords: number
  totalPointsAdded: number
  totalPointsSubtracted: number
  netPointsChange: number
}

interface Student {
  id: string
  name: string
}

export default function PointRecordsPage() {
  const [records, setRecords] = useState<PointRecordColumn[]>([])
  const [stats, setStats] = useState<PointRecordStats | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [initialLoading, setInitialLoading] = useState(true)

  // 分页和过滤状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [pageCount, setPageCount] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<PointType | 'all'>('all')
  const [studentFilter, setStudentFilter] = useState('all')

  // 加载学生列表（排除已归档学生）
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const params = new URLSearchParams({
          isArchived: 'false', // 只加载未归档的学生
        })
        const response = await fetch(`/api/students?${params}`)
        if (!response.ok) throw new Error('加载学生列表失败')

        const data = await response.json()
        setStudents(
          data.data.map((s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          }))
        )
      } catch (error) {
        console.error('Failed to load students:', error)
      }
    }

    loadStudents()
  }, [])

  // 加载记录和统计
  const loadRecords = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })

      if (search) params.append('search', search)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (studentFilter !== 'all') params.append('studentId', studentFilter)

      const [recordsResponse, statsResponse] = await Promise.all([
        fetch(`/api/points/records?${params}`),
        fetch(
          `/api/points/records/stats${studentFilter !== 'all' ? `?studentId=${studentFilter}` : ''}`
        ),
      ])

      if (!recordsResponse.ok || !statsResponse.ok) {
        throw new Error('加载数据失败')
      }

      const recordsData = await recordsResponse.json()
      const statsData = await statsResponse.json()

      setRecords(recordsData.records)
      setPageCount(recordsData.pagination.pageCount)
      setStats(statsData.stats)
    } catch (error) {
      console.error('Failed to load records:', error)
      toast.error('加载数据失败')
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, search, typeFilter, studentFilter])

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">积分记录</h2>
        <p className="text-muted-foreground">查看所有学生的积分变动历史</p>
      </div>

      {/* 统计卡片 */}
      {stats && <PointRecordStats stats={stats} />}

      {/* 记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>积分记录列表</CardTitle>
          <CardDescription>
            {studentFilter !== 'all'
              ? `${students.find(s => s.id === studentFilter)?.name || '学生'} 的积分记录`
              : '全部学生的积分记录'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : (
            <PointRecordDataTable
              columns={pointRecordColumns}
              data={records}
              pageCount={pageCount}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={size => {
                setPageSize(size)
                setCurrentPage(1)
              }}
              onSearch={value => {
                setSearch(value)
                setCurrentPage(1)
              }}
              onTypeFilter={type => {
                setTypeFilter(type)
                setCurrentPage(1)
              }}
              onStudentFilter={studentId => {
                setStudentFilter(studentId)
                setCurrentPage(1)
              }}
              students={students}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
