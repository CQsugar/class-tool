'use client'

import { Student } from '@prisma/client'
import { Download, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { exportStudentsToExcel } from '@/lib/excel-export'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: Student[]
  selectedStudents?: Student[]
}

type ExportType = 'all' | 'selected' | 'filtered'

export function ExportStudentDialog({
  open,
  onOpenChange,
  students,
  selectedStudents = [],
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('all')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)

      let dataToExport: Student[] = []
      let filename = ''
      const date = new Date().toISOString().split('T')[0]

      switch (exportType) {
        case 'all':
          dataToExport = students
          filename = `学生信息_全部_${date}.xlsx`
          break
        case 'selected':
          if (selectedStudents.length === 0) {
            toast.error('没有选中的学生')
            return
          }
          dataToExport = selectedStudents
          filename = `学生信息_已选_${date}.xlsx`
          break
        case 'filtered':
          dataToExport = students
          filename = `学生信息_筛选_${date}.xlsx`
          break
      }

      const success = exportStudentsToExcel(dataToExport, filename)

      if (success) {
        toast.success(`成功导出 ${dataToExport.length} 名学生信息`)
        onOpenChange(false)
      } else {
        toast.error('导出失败')
      }
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            导出学生信息
          </DialogTitle>
          <DialogDescription>
            选择要导出的数据范围，然后点击导出按钮下载 Excel 文件。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup
            value={exportType}
            onValueChange={(value: string) => setExportType(value as ExportType)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">导出全部学生</div>
                  <div className="text-muted-foreground text-sm">共 {students.length} 名学生</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="selected"
                id="selected"
                disabled={selectedStudents.length === 0}
              />
              <Label
                htmlFor="selected"
                className={`flex-1 ${selectedStudents.length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <div>
                  <div className="font-medium">导出选中学生</div>
                  <div className="text-muted-foreground text-sm">
                    {selectedStudents.length === 0
                      ? '未选中任何学生'
                      : `已选中 ${selectedStudents.length} 名学生`}
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="filtered" id="filtered" />
              <Label htmlFor="filtered" className="flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">导出当前筛选结果</div>
                  <div className="text-muted-foreground text-sm">导出当前页面显示的数据</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="bg-muted rounded-md p-4">
            <h4 className="mb-2 text-sm font-medium">导出字段说明</h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>• 姓名、学号、性别</li>
              <li>• 手机号、家长手机号</li>
              <li>• 当前积分</li>
              <li>• 备注、创建时间</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            <Download className="h-4 w-4" />
            {exporting ? '导出中...' : '导出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
