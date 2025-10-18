# 工具全屏显示功能

## 功能概述

为课堂工具添加了统一的全屏显示功能,使教师在课堂投影时能够更清晰地展示内容。

## 支持的工具

### 1. 课堂计时器 (`/timer`)

**全屏特性:**

- 16rem 超大显示计时数字
- 隐藏模式选择和控制按钮
- 保留暂停/继续、重置等核心控制
- 全屏下仍支持声音提示

**适用场景:**

- 考试计时
- 课堂活动限时
- 休息倒计时

### 2. 随机点名工具 (`/call`)

**全屏特性:**

- 隐藏页面标题和设置面板
- 隐藏历史记录
- 学生头像放大至 192px (48)
- 姓名文字放大至 text-7xl
- 显示区域高度增加至 600px
- 保留核心操作按钮(点名、重新点名、全屏切换)

**适用场景:**

- 全班观看点名过程
- 课堂投影展示
- 增强互动性和公平性

### 3. PK对战工具 (`/pk`)

**全屏特性:**

- 隐藏页面标题和设置面板
- VS标志放大至 128px (32)
- 参与者头像放大至 128px (32)
- 参与者姓名放大至 text-4xl
- 奖杯图标放大至 32px (8)
- 保留核心操作按钮(开始新PK、全屏切换)

**适用场景:**

- 个人/分组PK展示
- 课堂竞赛展示
- 激励学生积极参与

## 技术实现

### 状态管理

```typescript
const [isFullscreen, setIsFullscreen] = useState(false)
```

### 全屏切换

```typescript
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
```

### 监听全屏状态变化

```typescript
useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement)
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }
}, [])
```

### 条件渲染和样式

```tsx
{
  /* 容器添加全屏样式 */
}
;<div className={isFullscreen ? 'bg-background fixed inset-0 z-50 p-8' : ''}>
  {/* 隐藏辅助UI */}
  {!isFullscreen && <PageTitle />}
  {!isFullscreen && <SettingsPanel />}

  {/* 动态调整尺寸 */}
  <div className={isFullscreen ? 'h-48 w-48 text-7xl' : 'h-32 w-32 text-4xl'}>{/* 主要内容 */}</div>

  {/* 全屏切换按钮 */}
  <Button onClick={toggleFullscreen}>
    {isFullscreen ? (
      <>
        <Minimize2 className="mr-2 h-5 w-5" />
        退出全屏
      </>
    ) : (
      <>
        <Maximize2 className="mr-2 h-5 w-5" />
        全屏显示
      </>
    )}
  </Button>
</div>
```

## 使用说明

### 进入全屏

1. 点击页面上的"全屏显示"按钮
2. 或使用浏览器快捷键 F11 (仅部分浏览器支持)

### 退出全屏

1. 点击"退出全屏"按钮
2. 按 ESC 键
3. 使用浏览器快捷键 F11

### 全屏下的操作

- **计时器**: 支持暂停/继续、重置、声音开关
- **随机点名**: 支持点名、重新点名
- **PK对战**: 支持设置胜者、开始新PK

## 浏览器兼容性

| 浏览器  | 版本要求 | 支持情况    |
| ------- | -------- | ----------- |
| Chrome  | 71+      | ✅ 完全支持 |
| Firefox | 64+      | ✅ 完全支持 |
| Safari  | 16.4+    | ✅ 完全支持 |
| Edge    | 79+      | ✅ 完全支持 |

## 注意事项

1. **安全限制**: 全屏API需要用户手势触发,不能自动进入全屏
2. **移动设备**: 部分移动浏览器可能有不同的全屏行为
3. **退出方式**: ESC键是标准退出方式,建议向用户说明
4. **内容适配**: 全屏下确保内容完整显示,避免溢出

## 设计原则

1. **简洁优先**: 全屏模式下隐藏非必要UI元素
2. **放大关键信息**: 主要内容增大至适合投影的尺寸
3. **保留核心功能**: 确保基本操作仍可执行
4. **统一体验**: 各工具使用一致的全屏交互模式

## 未来优化

- [ ] 添加键盘快捷键支持 (Space暂停, Enter确认等)
- [ ] 支持自定义全屏布局选项
- [ ] 添加全屏使用提示/引导
- [ ] 优化移动设备全屏体验
