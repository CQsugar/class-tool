/**
 * Web Vitals 性能监控
 * 记录和上报核心性能指标: LCP, FID, CLS, FCP, TTFB
 */

import { Metric } from 'web-vitals'

// 在开发环境中输出到控制台,生产环境可以发送到分析服务
export function reportWebVitals(metric: Metric) {
  // 格式化性能数据
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  }

  if (process.env.NODE_ENV === 'development') {
    // 开发环境: 输出到控制台
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: `${Math.round(metric.value)}ms`,
      rating: metric.rating,
      delta: `${Math.round(metric.delta)}ms`,
    })
  } else {
    // 生产环境: 可以发送到分析服务
    // 例如: Google Analytics, Vercel Analytics, 自定义端点

    // 示例: 发送到自定义端点
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(body),
    // }).catch(console.error)

    // 示例: 使用 navigator.sendBeacon (更可靠)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify(body))
    }
  }
}

/**
 * 性能指标说明:
 *
 * - LCP (Largest Contentful Paint): 最大内容绘制时间
 *   - Good: < 2500ms
 *   - Needs Improvement: 2500-4000ms
 *   - Poor: > 4000ms
 *
 * - FID (First Input Delay): 首次输入延迟
 *   - Good: < 100ms
 *   - Needs Improvement: 100-300ms
 *   - Poor: > 300ms
 *
 * - CLS (Cumulative Layout Shift): 累积布局偏移
 *   - Good: < 0.1
 *   - Needs Improvement: 0.1-0.25
 *   - Poor: > 0.25
 *
 * - FCP (First Contentful Paint): 首次内容绘制
 *   - Good: < 1800ms
 *   - Needs Improvement: 1800-3000ms
 *   - Poor: > 3000ms
 *
 * - TTFB (Time to First Byte): 首字节时间
 *   - Good: < 800ms
 *   - Needs Improvement: 800-1800ms
 *   - Poor: > 1800ms
 */
