---
applyTo: "src/components/ui/**/*.tsx,src/components/**/*.tsx"
description: "shadcn/ui组件开发最佳实践"
---

# shadcn/ui 开发指令

## 组件使用
- 使用`npx shadcn@latest add [component]`添加组件
- 组件放在`src/components/ui/`目录
- 自定义组件继承shadcn/ui样式
- 使用cn()函数合并className

## 主题配置
- 在`tailwind.config.ts`中配置主题变量
- 使用CSS变量支持深色模式
- 颜色使用HSL格式定义
- 响应式设计优先

## 表单处理
- 使用react-hook-form + zod验证
- Form组件包装表单元素
- 统一错误处理和显示
- 支持无障碍访问

## 常用组件模式
- Button variants: default, destructive, outline, ghost
- 数据表格使用DataTable + TanStack Table
- 对话框使用Dialog + Sheet组合
- 表单使用Form + Input + Label组合

## 示例代码：

```typescript
// 表单组件
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  name: z.string().min(2, "姓名至少2个字符"),
})

export function StudentForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>学生姓名</FormLabel>
              <FormControl>
                <Input placeholder="请输入姓名" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">提交</Button>
      </form>
    </Form>
  )
}
```

## 样式指导
- 使用Tailwind CSS类名
- 组件间距使用space-y-*, gap-*
- 颜色使用语义化类名：primary, secondary, destructive
- 动画使用transition-*类名
- 布局使用Grid和Flexbox