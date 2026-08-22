// app/template.tsx
// 全局页面转场：路由切换时子树重新挂载，统一淡入上移动效
import './template.css'

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>
}
