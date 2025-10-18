/**
 * Framer Motion 懒加载配置
 * 使用 LazyMotion 和 domAnimation 功能集来减少 bundle 大小
 * 只加载实际使用的动画功能
 */

import { domAnimation } from 'framer-motion'

export { domAnimation }

/**
 * 使用方式:
 *
 * import { LazyMotion, m } from 'framer-motion'
 * import { domAnimation } from '@/lib/motion'
 *
 * <LazyMotion features={domAnimation} strict>
 *   <m.div animate={{ x: 100 }} />
 * </LazyMotion>
 *
 * 注意: 使用 m 代替 motion 以减少体积
 */

// 常用动画变体
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}
