'use client'

import { Gender } from '@prisma/client'
import { AlertCircle, Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { read, utils, WorkSheet } from 'xlsx'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ImportStudentData {
  name: string
  studentNo: string
  gender: Gender
  phone?: string
  parentPhone?: string
  notes?: string
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ImportStudentDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [students, setStudents] = useState<ImportStudentData[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 下载模板
  const handleDownloadTemplate = () => {
    // 创建模板数据
    const template = [
      {
        姓名: '张三',
        学号: 'S001',
        性别: '男',
        手机号: '13800138000',
        家长手机号: '13900139000',
        备注: '示例备注',
      },
      {
        姓名: '李四',
        学号: 'S002',
        性别: '女',
        手机号: '',
        家长手机号: '13900139001',
        备注: '',
      },
    ]

    // 创建工作簿
    const ws = utils.json_to_sheet(template)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, '学生信息')

    // 设置列宽
    ws['!cols'] = [
      { wch: 10 }, // 姓名
      { wch: 15 }, // 学号
      { wch: 8 }, // 性别
      { wch: 15 }, // 手机号
      { wch: 15 }, // 家长手机号
      { wch: 30 }, // 备注
    ]

    // 下载文件
    import('xlsx').then(XLSX => {
      XLSX.writeFile(wb, '学生信息导入模板.xlsx')
    })

    toast.success('模板已下载')
  }

  // 处理文件上传
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet: WorkSheet = workbook.Sheets[sheetName]

      // 将工作表转换为 JSON
      const jsonData = utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: '',
      })

      // 验证和转换数据
      const validationErrors: string[] = []
      const validStudents: ImportStudentData[] = []

      jsonData.forEach((row, index: number) => {
        const rowNum = index + 2 // Excel 行号（从2开始，因为第1行是表头）

        // 验证必填字段
        if (!row['姓名']) {
          validationErrors.push(`第${rowNum}行：姓名不能为空`)
          return
        }
        if (!row['学号']) {
          validationErrors.push(`第${rowNum}行：学号不能为空`)
          return
        }
        if (!row['性别']) {
          validationErrors.push(`第${rowNum}行：性别不能为空`)
          return
        }

        // 转换性别
        let gender: Gender
        const genderText = String(row['性别']).trim()
        if (genderText === '男' || genderText === 'MALE') {
          gender = Gender.MALE
        } else if (genderText === '女' || genderText === 'FEMALE') {
          gender = Gender.FEMALE
        } else {
          validationErrors.push(`第${rowNum}行：性别只能是"男"或"女"`)
          return
        }

        // 验证学号格式
        const studentNo = String(row['学号']).trim()
        if (!/^[a-zA-Z0-9]+$/.test(studentNo)) {
          validationErrors.push(`第${rowNum}行：学号只能包含字母和数字`)
          return
        }

        // 验证手机号格式（如果提供）
        const phone = row['手机号'] ? String(row['手机号']).trim() : ''
        if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
          validationErrors.push(`第${rowNum}行：手机号格式不正确`)
          return
        }

        // 验证家长手机号格式（如果提供）
        const parentPhone = row['家长手机号'] ? String(row['家长手机号']).trim() : ''
        if (parentPhone && !/^1[3-9]\d{9}$/.test(parentPhone)) {
          validationErrors.push(`第${rowNum}行：家长手机号格式不正确`)
          return
        }

        // 添加到有效数据
        validStudents.push({
          name: String(row['姓名']).trim(),
          studentNo,
          gender,
          phone: phone || undefined,
          parentPhone: parentPhone || undefined,
          notes: row['备注'] ? String(row['备注']).trim() : undefined,
        })
      })

      setStudents(validStudents)
      setErrors(validationErrors)

      if (validationErrors.length > 0) {
        toast.error(`发现 ${validationErrors.length} 个错误`)
      } else if (validStudents.length === 0) {
        toast.error('文件中没有有效数据')
      } else {
        toast.success(`成功读取 ${validStudents.length} 条学生信息`)
      }
    } catch (error) {
      console.error('读取文件失败:', error)
      toast.error('读取文件失败，请检查文件格式')
      setStudents([])
      setErrors([])
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 执行导入
  const handleImport = async () => {
    if (students.length === 0) {
      toast.error('没有可导入的数据')
      return
    }

    if (errors.length > 0) {
      toast.error('请先修正所有错误')
      return
    }

    try {
      setImporting(true)

      const response = await fetch('/api/students/batch/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.duplicates) {
          throw new Error(`以下学号已存在：${error.duplicates.join('、')}`)
        }
        throw new Error(error.error || '导入失败')
      }

      const result = await response.json()
      toast.success(`成功导入 ${result.count} 名学生`)
      setStudents([])
      setErrors([])
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('导入失败:', error)
      toast.error(error instanceof Error ? error.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批量导入学生</DialogTitle>
          <DialogDescription>
            使用 Excel 文件批量导入学生信息。请先下载模板，按照模板格式填写数据。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              下载模板
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              选择文件
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* 错误提示 */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>发现 {errors.length} 个错误</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                  {errors.length > 5 && (
                    <li className="text-sm">还有 {errors.length - 5} 个错误...</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 预览数据 */}
          {students.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">预览数据 (共 {students.length} 条)</h3>
                <Badge variant="secondary">{students.length} 名学生</Badge>
              </div>
              <div className="overflow-hidden rounded-md border">
                <div className="max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead>
                        <TableHead>学号</TableHead>
                        <TableHead>性别</TableHead>
                        <TableHead>手机号</TableHead>
                        <TableHead>家长手机号</TableHead>
                        <TableHead>备注</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.studentNo}</TableCell>
                          <TableCell>
                            <Badge
                              variant={student.gender === Gender.MALE ? 'default' : 'secondary'}
                            >
                              {student.gender === Gender.MALE ? '男' : '女'}
                            </Badge>
                          </TableCell>
                          <TableCell>{student.phone || '-'}</TableCell>
                          <TableCell>{student.parentPhone || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {student.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setStudents([])
              setErrors([])
              onOpenChange(false)
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={students.length === 0 || errors.length > 0 || importing}
          >
            {importing ? '导入中...' : `导入 ${students.length} 名学生`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
