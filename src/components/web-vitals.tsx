'use client'

import { reportWebVitals } from '@/lib/web-vitals'
import { useEffect } from 'react'
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

export function WebVitals() {
  useEffect(() => {
    // 注册所有Web Vitals监听器
    // INP (Interaction to Next Paint) 替代了 FID
    onCLS(reportWebVitals)
    onINP(reportWebVitals)
    onLCP(reportWebVitals)
    onFCP(reportWebVitals)
    onTTFB(reportWebVitals)
  }, [])

  return null
}
