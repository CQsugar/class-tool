import { redirect } from 'next/navigation'

export default function Home() {
  // 重定向到仪表板页面
  redirect('/dashboard')
}
