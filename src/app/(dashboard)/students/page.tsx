'use client'

import { Student } from '@prisma/client'
import { Archive, Download, Plus, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { createStudentColumns } from '@/components/students/columns'
import { DataTable } from '@/components/students/data-table'
import { ExportStudentDialog } from '@/components/students/export-student-dialog'
import { ImportStudentDialog } from '@/components/students/import-student-dialog'
import { StudentFormDialog } from '@/components/students/student-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudents] = useState<Student[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  // 获取学生列表
  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/students')

      if (!response.ok) {
        throw new Error('获取学生列表失败')
      }

      const result = await response.json()
      setStudents(result.data || [])
    } catch (error) {
      console.error('获取学生列表失败:', error)
      toast.error('获取学生列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // 编辑学生
  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setDialogOpen(true)
  }

  // 删除学生
  const handleDelete = async (student: Student) => {
    if (!confirm(`确定要删除学生 ${student.name} 吗？`)) {
      return
    }

    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除学生失败')
      }

      toast.success('学生已删除')
      fetchStudents()
    } catch (error) {
      console.error('删除学生失败:', error)
      toast.error('删除学生失败')
    }
  }

  // 添加学生
  const handleAdd = () => {
    setEditingStudent(null)
    setDialogOpen(true)
  }

  // 批量归档
  const handleBatchArchive = async () => {
    if (selectedStudents.length === 0) {
      toast.warning('请先选择学生')
      return
    }

    if (!confirm(`确定要归档 ${selectedStudents.length} 个学生吗？`)) {
      return
    }

    try {
      const response = await fetch('/api/students/batch/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedStudents.map(s => s.id),
          isArchived: true,
        }),
      })

      if (!response.ok) {
        throw new Error('批量归档失败')
      }

      toast.success('学生已批量归档')
      fetchStudents()
    } catch (error) {
      console.error('批量归档失败:', error)
      toast.error('批量归档失败')
    }
  }

  // 导出Excel
  const handleExport = () => {
    setExportDialogOpen(true)
  }

  // 导入Excel
  const handleImport = () => {
    setImportDialogOpen(true)
  }

  const columns = createStudentColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  })

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">学生管理</h2>
          <p className="text-muted-foreground">管理班级学生信息，支持批量操作和数据导入导出</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            导入
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            添加学生
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>学生列表</CardTitle>
              <CardDescription>共 {students.length} 名学生</CardDescription>
            </div>
            {selectedStudents.length > 0 && (
              <Button variant="outline" onClick={handleBatchArchive} className="gap-2">
                <Archive className="h-4 w-4" />
                批量归档 ({selectedStudents.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={students}
            searchKey="name"
            searchPlaceholder="搜索学生姓名..."
          />
        </CardContent>
      </Card>

      {/* 学生表单对话框 */}
      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={editingStudent}
        onSuccess={fetchStudents}
      />

      {/* Excel 导入对话框 */}
      <ImportStudentDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchStudents}
      />

      {/* Excel 导出对话框 */}
      <ExportStudentDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        students={students}
        selectedStudents={selectedStudents}
      />
    </div>
  )
}
