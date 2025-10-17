import { Student } from '@prisma/client'
import { utils, writeFile } from 'xlsx'

/**
 * 导出学生数据到 Excel 文件
 */
export function exportStudentsToExcel(students: Student[], filename?: string) {
  try {
    // 转换数据格式
    const exportData = students.map(student => ({
      姓名: student.name,
      学号: student.studentNo,
      性别: student.gender === 'MALE' ? '男' : '女',
      手机号: student.phone || '',
      家长手机号: student.parentPhone || '',
      积分: student.points,
      备注: student.notes || '',
      创建时间: new Date(student.createdAt).toLocaleString('zh-CN'),
    }))

    // 创建工作簿
    const ws = utils.json_to_sheet(exportData)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, '学生信息')

    // 设置列宽
    ws['!cols'] = [
      { wch: 10 }, // 姓名
      { wch: 15 }, // 学号
      { wch: 8 }, // 性别
      { wch: 15 }, // 手机号
      { wch: 15 }, // 家长手机号
      { wch: 10 }, // 积分
      { wch: 30 }, // 备注
      { wch: 20 }, // 创建时间
    ]

    // 生成文件名
    const date = new Date().toISOString().split('T')[0]
    const defaultFilename = `学生信息_${date}.xlsx`

    // 下载文件
    writeFile(wb, filename || defaultFilename)

    return true
  } catch (error) {
    console.error('导出失败:', error)
    return false
  }
}

/**
 * 导出学生模板（不包含数据）
 */
export function exportStudentTemplate(filename?: string) {
  try {
    // 创建模板数据（只有表头，没有数据行）
    const template = [
      {
        姓名: '',
        学号: '',
        性别: '',
        手机号: '',
        家长手机号: '',
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
    writeFile(wb, filename || '学生信息导入模板.xlsx')

    return true
  } catch (error) {
    console.error('导出模板失败:', error)
    return false
  }
}

/**
 * 导出选中的学生数据
 */
export function exportSelectedStudents(
  students: Student[],
  selectedIds: string[],
  filename?: string
) {
  const selectedStudents = students.filter(s => selectedIds.includes(s.id))
  return exportStudentsToExcel(selectedStudents, filename)
}
