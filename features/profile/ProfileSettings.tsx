'use client'

import { signOut } from 'next-auth/react'
import { Loader2, Check, User, ShieldCheck, Settings, Save, LogOut, Palette, Menu } from 'lucide-react'
import { useProfileSettings } from './useProfileSettings'
import ProfileForm from './components/ProfileForm'
import ProfileSecurity from './components/ProfileSecurity'
import ProfilePreferences from './components/ProfilePreferences'
import ProfileDisplay from './components/ProfileDisplay'
import ProfileFollowModal from './components/ProfileFollowModal'

const MENU_ITEMS = [
  { id: 'profile',     label: '个人资料', icon: User },
  { id: 'security',    label: '账户安全', icon: ShieldCheck },
  { id: 'preferences', label: '功能偏好', icon: Settings },
  { id: 'display',     label: '外观显示', icon: Palette },
]
export default function ProfileSettings() {
  const settings = useProfileSettings()
  const { status, loading, activeTab, setActiveTab, handleSave, saving, saved } = settings
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    )
  }

  // ── 各 Tab 内容 ──
  const renderContent = () => {
    switch (activeTab) {

      // ── 个人资料 ──
      case 'profile': return (
        <ProfileForm {...settings} />
      )

      // ── 账户安全 ──
      case 'security': return (
        <ProfileSecurity {...settings} />
      )

      // ── 功能偏好 ──
      case 'preferences': return (
        <ProfilePreferences {...settings} />
      )

      // ── 外观显示 ──
      case 'display': return (
        <ProfileDisplay {...settings} />
      )

      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-0 md:px-8 font-sans antialiased text-slate-900">
      <div className="w-full max-w-5xl mx-auto bg-white md:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-0 md:border border-white flex flex-col md:flex-row overflow-hidden md:min-h-[700px]">

        {/* 移动端顶栏 */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <Settings className="text-white w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">设置</span>
          </div>
          <button className="p-2 text-slate-400"><Menu className="w-5 h-5" /></button>
        </div>

        {/* 桌面侧边栏 */}
        <aside className="hidden md:flex w-60 bg-slate-50/50 border-r border-slate-100 flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <Settings className="text-white w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">控制台</span>
          </div>

          <nav className="flex-1 space-y-1.5">
            {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  activeTab === id
                    ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${activeTab === id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="font-semibold text-sm">{label}</span>
                {activeTab === id && <div className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
              </button>
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold text-sm">退出登录</span>
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto bg-white p-6 md:p-10 pb-28 md:pb-10">

          {/* 页头 */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                {MENU_ITEMS.find(i => i.id === activeTab)?.label}
              </h2>
              <p className="text-slate-400 mt-1 text-sm">管理你的账户信息与使用偏好</p>
            </div>
            {(activeTab === 'profile') && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-60"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" />保存中…</>
                  : saved
                  ? <><Check className="w-4 h-4" />已保存</>
                  : <><Save className="w-4 h-4" />保存更改</>
                }
              </button>
            )}
          </header>

          {renderContent()}
        </main>

        {/* 移动端底部导航 */}
        <nav className="md:hidden flex bg-white border-t border-slate-100 px-2 py-3 fixed bottom-0 left-0 right-0 z-30 justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors ${activeTab === id ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          ))}
        </nav>

      </div>

      {/* 粉丝 / 关注 悬浮弹窗 */}
      <ProfileFollowModal {...settings} />
    </div>
  )
}
