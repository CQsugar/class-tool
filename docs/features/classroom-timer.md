# 课堂计时器 - 功能说明

## 功能概述

课堂计时器是课堂工具的重要组件,支持倒计时和正计时两种模式,帮助教师精确控制课堂活动时间,提升教学效率。

## 主要特性

### 1. 双模式计时

#### 倒计时模式 (Countdown)

- **时间设置**:
  - 分钟输入框 (0-59)
  - 秒数输入框 (0-59)
  - 8个快捷时间按钮
- **快捷设置**: 1/3/5/10/15/30/45分钟、1小时
- **进度显示**: 实时进度条可视化
- **结束提醒**: 自动停止 + 声音提示 + Toast 通知
- **危险警告**: 最后10秒红色闪烁提醒
- **使用场景**: 考试、限时演讲、小组讨论

#### 正计时模式 (Stopwatch)

- **从零开始**: 00:00 起始计时
- **无限制**: 没有时间上限
- **记录用时**: 适合需要统计时长的场景
- **使用场景**: 活动计时、任务用时记录

### 2. 完整控制功能

#### 基础控制

- **开始**: 启动计时器
- **暂停**: 临时停止计时
- **继续**: 从暂停处恢复
- **重置**: 清零并返回设置界面

#### 高级功能

- **全屏模式**:
  - 一键进入全屏
  - ESC 退出全屏
  - 巨型时间显示(16rem)
  - 适合投影展示
- **声音控制**:
  - 开启/关闭提示音
  - 倒计时结束自动播放
  - HTML5 Audio API

### 3. 视觉设计

#### 时间显示

- **等宽字体**: font-mono 确保数字不跳动
- **超大字号**:
  - 普通模式: text-9xl (8rem)
  - 全屏模式: text-[16rem]
- **表格数字**: tabular-nums 对齐
- **颜色状态**:
  - 未运行: text-muted-foreground
  - 运行中: text-foreground
  - 危险期: text-destructive + animate-pulse

#### 进度条(倒计时)

- **实时更新**: 每秒刷新
- **渐变填充**: bg-primary 填充
- **平滑过渡**: transition-all duration-1000
- **已用时间**: 显示已经过的时间

#### 动画效果

- **模式标识**: 淡入 + 上移 (initial: y: -20)
- **时间数字**: 缩放入场 (initial: scale: 0.8)
- **控制按钮**: 延迟淡入 (delay: 0.2s)
- **暂停遮罩**: 半透明背景 + 提示文字

### 4. 交互体验

#### Toast 提示

- 开始计时: "倒计时开始" / "正计时开始"
- 暂停: "已暂停"
- 继续: "继续计时"
- 重置: "已重置"
- 结束: "倒计时结束!" (duration: 5000ms)
- 错误: "请设置有效的倒计时时间"

#### 状态反馈

- 按钮禁用状态
- 加载动画效果
- 暂停半透明遮罩
- 全屏状态切换

## 技术实现

### 前端组件

#### TimerPage 组件

路径: `src/app/(dashboard)/timer/page.tsx`

**主要状态:**

```typescript
const [mode, setMode] = useState<TimerMode>('countdown')
const [isRunning, setIsRunning] = useState(false)
const [isPaused, setIsPaused] = useState(false)
const [isFullscreen, setIsFullscreen] = useState(false)
const [soundEnabled, setSoundEnabled] = useState(true)
const [countdownMinutes, setCountdownMinutes] = useState('5')
const [countdownSeconds, setCountdownSeconds] = useState('0')
const [remainingTime, setRemainingTime] = useState(0)
const [elapsedTime, setElapsedTime] = useState(0)
```

**核心方法:**

- `startCountdown()`: 开始倒计时
- `startStopwatch()`: 开始正计时
- `togglePause()`: 暂停/继续
- `reset()`: 重置计时器
- `toggleFullscreen()`: 切换全屏
- `formatTime()`: 格式化时间显示
- `playSound()`: 播放提示音

### 计时逻辑

#### useEffect 计时器

```typescript
useEffect(() => {
  if (isRunning && !isPaused) {
    intervalRef.current = setInterval(() => {
      if (mode === 'countdown') {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // 倒计时结束
            setIsRunning(false)
            playSound()
            toast.success('倒计时结束!')
            return 0
          }
          return prev - 1
        })
      } else {
        setElapsedTime(prev => prev + 1)
      }
    }, 1000)
  }

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }
}, [isRunning, isPaused, mode])
```

#### 时间格式化

```typescript
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
```

### 全屏功能

#### 切换全屏

```typescript
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      setIsFullscreen(true)
    })
  } else {
    document.exitFullscreen().then(() => {
      setIsFullscreen(false)
    })
  }
}
```

#### 监听全屏变化

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

### 音频系统

#### 初始化音频

```typescript
useEffect(() => {
  // Base64 编码的 WAV 音频数据
  audioRef.current = new Audio('data:audio/wav;base64,...')
}, [])
```

#### 播放提示音

```typescript
const playSound = () => {
  if (soundEnabled && audioRef.current) {
    audioRef.current.play().catch(err => console.error('Failed to play sound:', err))
  }
}
```

## 使用流程

### 倒计时使用

1. **设置时间**
   - 输入分钟和秒数
   - 或点击快捷时间按钮

2. **开始计时**
   - 点击"开始计时"按钮
   - 自动验证时间有效性
   - 进入计时界面

3. **控制过程**
   - 需要暂停时点击暂停按钮
   - 继续计时点击继续按钮
   - 查看进度条和已用时间

4. **等待结束**
   - 最后10秒红色闪烁
   - 倒计时归零自动停止
   - 播放提示音并显示通知

### 正计时使用

1. **开始计时**
   - 选择"正计时"标签
   - 点击"开始计时"按钮

2. **控制过程**
   - 随时暂停/继续
   - 查看累积时间

3. **结束计时**
   - 手动点击重置按钮
   - 记录最终时间

### 全屏模式

1. **进入全屏**
   - 点击最大化按钮
   - 或按 F11 键(浏览器快捷键)

2. **全屏控制**
   - 所有按钮仍可用
   - 时间显示更大
   - 适合投影展示

3. **退出全屏**
   - 点击最小化按钮
   - 或按 ESC 键

## UI 组件层次

```
TimerPage
├─ (未运行) 设置界面
│  ├─ Card
│  │  ├─ CardHeader
│  │  └─ CardContent
│  │     ├─ Tabs (模式选择)
│  │     │  ├─ TabsList
│  │     │  ├─ TabsContent (倒计时)
│  │     │  │  ├─ Input (分钟)
│  │     │  │  ├─ Input (秒数)
│  │     │  │  └─ Button[] (快捷时间)
│  │     │  └─ TabsContent (正计时)
│  │     └─ Button (开始)
│
└─ (运行中) 计时界面
   ├─ Badge (模式标识)
   ├─ motion.div (时间显示)
   ├─ motion.div (进度条)
   ├─ motion.div (控制按钮)
   │  ├─ Button (暂停/继续)
   │  ├─ Button (重置)
   │  ├─ Button (全屏)
   │  └─ Button (声音)
   └─ AnimatePresence
      └─ motion.div (暂停提示)
```

## 性能优化

### 内存管理

- **useRef 存储 interval**: 避免闭包陷阱
- **useEffect cleanup**: 组件卸载时清理定时器
- **条件渲染**: 未运行时不渲染计时界面

### 渲染优化

- **状态分离**: 计时状态与UI状态分离
- **memo 优化**: 子组件使用 React.memo
- **懒加载**: 音频资源按需加载

### 用户体验

- **防抖**: 避免快速点击造成状态混乱
- **加载状态**: 全屏切换时的过渡动画
- **容错处理**: 音频播放失败不影响功能

## 扩展功能建议

### 高级功能

- [ ] 自定义提示音上传
- [ ] 多个计时器同时运行
- [ ] 计时历史记录
- [ ] 预设模板管理
- [ ] 快捷键自定义
- [ ] 背景音乐播放
- [ ] 时间节点标记

### 集成功能

- [ ] 与PK功能集成(自动计时)
- [ ] 与点名工具集成(答题计时)
- [ ] 与积分系统集成(超时扣分)
- [ ] 导出计时报告

### 增强体验

- [ ] 深色/浅色主题切换
- [ ] 自定义颜色方案
- [ ] 移动端横屏优化
- [ ] 语音播报时间
- [ ] 多语言支持

## 使用场景

### 课堂教学

1. **限时考试**: 严格控制考试时长,公平公正
2. **演讲训练**: 培养学生时间把控能力
3. **小组讨论**: 确保讨论时间分配合理
4. **答题抢答**: 增加紧张感和竞争性
5. **课堂活动**: 各类限时活动组织

### 教学策略

- **时间管理**: 培养学生时间观念
- **效率提升**: 适度压力激发潜能
- **公平竞争**: 统一标准确保公平
- **专注训练**: 限时任务提高专注力

## 测试建议

### 功能测试

- [ ] 倒计时正常倒数
- [ ] 正计时正常累加
- [ ] 暂停继续准确
- [ ] 重置完全清零
- [ ] 全屏正常切换
- [ ] 声音正常播放
- [ ] 结束自动停止

### 边界测试

- [ ] 0分0秒提示错误
- [ ] 超大数值限制
- [ ] 快速切换模式
- [ ] 并发操作处理
- [ ] 浏览器兼容性

### 性能测试

- [ ] 长时间运行稳定性
- [ ] 内存泄漏检测
- [ ] CPU 占用率
- [ ] 动画流畅度

### UI/UX 测试

- [ ] 响应式布局
- [ ] 全屏显示效果
- [ ] 动画流畅性
- [ ] Toast 提示及时性
- [ ] 按钮反馈明确

## 相关任务

- Task 6.6: 课堂计时器工具 ✅
- Task 6.5: PK功能(可集成计时器)
- Task 6.8: 工具最大化显示(已支持全屏)
- Task 6.9: 性能优化(计时器性能优化)

## 更新历史

- 2024-10-18: 初始实现,支持倒计时和正计时两种模式
