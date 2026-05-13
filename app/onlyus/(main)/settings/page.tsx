'use client'

import { useState, useEffect } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useIsMobile } from '@/lib/hooks'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import MedalGrid from '@/components/onlyus/medals/MedalGrid'
import { usePushStore } from '@/stores/onlyus/pushStore'

const INPUT_STYLE = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid rgba(196,120,90,0.2)',
  background: 'rgba(255,255,255,0.6)',
  color: '#3D2318',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  transition: 'border-color 0.15s',
}

const LABEL_STYLE = {
  fontSize: 11,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: 'rgba(196,120,90,0.65)',
  fontFamily: "'DM Sans', sans-serif",
  marginBottom: 6,
  display: 'block',
}

function GlassCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: '1px solid rgba(196,120,90,0.1)',
      padding: '28px 32px',
      marginBottom: 16,
    }}>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 11, letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'rgba(196,120,90,0.7)',
        margin: '0 0 22px',
      }}>
        {title}
      </p>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { profile, partner, coupleInfo, updateProfile, updateCoupleInfo } = useOnlyUsAuthStore()
  const { isSupported, isSubscribed, isLoading: pushLoading, checkStatus, subscribe, unsubscribe } = usePushStore()
  const isMobile = useIsMobile()
  const router = useRouter()

  useEffect(() => { checkStatus() }, [checkStatus])

  const [nickname, setNickname] = useState('')
  const [city, setCity] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [anniversary, setAnniversary] = useState('')
  const [nextMeetup, setNextMeetup] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname ?? '')
      setCity(profile.city ?? '')
      setLat(String(profile.latitude ?? ''))
      setLon(String(profile.longitude ?? ''))
    }
    if (coupleInfo) {
      setAnniversary(coupleInfo.anniversary_date ?? '')
      setNextMeetup(coupleInfo.next_meetup_date ?? '')
    }
  }, [profile, coupleInfo])

  const handleSave = async () => {
    setSaving(true)
    await updateProfile({
      nickname: nickname.trim(),
      city: city.trim(),
      latitude: parseFloat(lat) || 0,
      longitude: parseFloat(lon) || 0,
    })
    if (anniversary) {
      await updateCoupleInfo({
        anniversary_date: anniversary,
        next_meetup_date: nextMeetup || null,
      })
    }
    setSaving(false)
    setSavedAt(Date.now())
    setTimeout(() => setSavedAt(null), 2500)
  }

  // 在一起天数预览
  const daysPreview = anniversary
    ? dayjs().diff(dayjs(anniversary), 'day')
    : null

  const handleSignOut = async () => {
    const s = getSupabaseClient()
    await s.auth.signOut()
    router.push('/onlyus')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        input:focus { border-color: rgba(196,120,90,0.5) !important; box-shadow: 0 0 0 3px rgba(196,120,90,0.08); }
        @keyframes saved-pop { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ minHeight: '100%', padding: isMobile ? '20px 16px 80px' : '40px 40px 60px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'rgba(196,120,90,0.6)', margin: '0 0 6px',
          }}>设置</p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28, fontWeight: 400, color: '#3D2318', margin: 0,
          }}>个人与关系</h1>
        </div>

        {/* 个人资料 */}
        <GlassCard title="我的信息">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <label style={LABEL_STYLE}>昵称</label>
              <input
                style={INPUT_STYLE}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="你的名字"
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>城市</label>
              <input
                style={INPUT_STYLE}
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="所在城市"
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>纬度 (for 天气)</label>
              <input
                style={INPUT_STYLE}
                value={lat}
                onChange={e => setLat(e.target.value)}
                placeholder="39.9042"
                type="number"
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>经度 (for 天气)</label>
              <input
                style={INPUT_STYLE}
                value={lon}
                onChange={e => setLon(e.target.value)}
                placeholder="116.4074"
                type="number"
              />
            </div>
          </div>
        </GlassCard>

        {/* 对方信息（只读） */}
        {partner && (
          <GlassCard title="Ta 的信息">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: partner.avatar_url ? 'transparent' : 'rgba(232,132,156,0.15)',
                border: '2px solid rgba(232,132,156,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#E8849C', fontSize: 18, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                overflow: 'hidden',
              }}>
                {partner.avatar_url
                  ? <img src={partner.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : partner.nickname?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#3D2318', fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>
                  {partner.nickname}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(61,35,24,0.4)', fontFamily: "'DM Sans', sans-serif" }}>
                  {partner.city || '未设置城市'}
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* 关系设置 */}
        <GlassCard title="我们的关系">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <label style={LABEL_STYLE}>在一起纪念日</label>
              <input
                style={INPUT_STYLE}
                type="date"
                value={anniversary}
                onChange={e => setAnniversary(e.target.value)}
              />
              {daysPreview !== null && (
                <p style={{
                  marginTop: 6, fontSize: 11,
                  color: 'rgba(196,120,90,0.7)',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                }}>
                  已在一起 {daysPreview} 天 ✨
                </p>
              )}
            </div>
            <div>
              <label style={LABEL_STYLE}>下次见面</label>
              <input
                style={INPUT_STYLE}
                type="date"
                value={nextMeetup}
                onChange={e => setNextMeetup(e.target.value)}
              />
              {nextMeetup && (
                <p style={{
                  marginTop: 6, fontSize: 11,
                  color: 'rgba(196,120,90,0.7)',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                }}>
                  还有 {dayjs(nextMeetup).diff(dayjs(), 'day')} 天 🗓️
                </p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* 保存按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 32px',
              borderRadius: 12, border: 'none',
              background: saving
                ? 'rgba(196,120,90,0.3)'
                : 'linear-gradient(135deg, #C4785A, #E8849C)',
              color: '#fff',
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
            }}
          >
            {saving ? '保存中…' : '保存'}
          </button>

          {savedAt && (
            <span style={{
              fontSize: 13,
              color: '#C4785A',
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              animation: 'saved-pop 0.3s ease',
            }}>
              已保存 ✓
            </span>
          )}
        </div>

        {/* 勋章与成就 */}
        <GlassCard title="勋章与成就">
          {coupleInfo?.id ? (
            <MedalGrid coupleId={coupleInfo.id} />
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(61,35,24,0.3)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>
              请先设置在一起纪念日
            </p>
          )}
        </GlassCard>

        {/* 消息推送 */}
        <GlassCard title="消息推送">
          {!isSupported ? (
            <p style={{ fontSize: 12, color: 'rgba(61,35,24,0.3)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', margin: 0 }}>
              你的浏览器不支持推送通知
            </p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 500, color: '#3D2318', fontFamily: "'DM Sans', sans-serif" }}>
                  早安/晚安提醒
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(61,35,24,0.4)', fontFamily: "'DM Sans', sans-serif" }}>
                  {isSubscribed ? '已开启推送通知' : '开启后接收早安、晚安及关怀消息推送'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!profile?.id) return
                  isSubscribed ? unsubscribe(profile.id) : subscribe(profile.id)
                }}
                disabled={pushLoading}
                style={{
                  padding: '8px 20px', borderRadius: 10,
                  border: isSubscribed ? '1px solid rgba(220,80,80,0.2)' : '1px solid rgba(107,197,160,0.3)',
                  background: isSubscribed ? 'rgba(220,80,80,0.05)' : 'rgba(107,197,160,0.08)',
                  color: isSubscribed ? 'rgba(220,80,80,0.7)' : '#6BC5A0',
                  fontSize: 12, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: pushLoading ? 0.5 : 1,
                }}
              >
                {pushLoading ? '处理中...' : isSubscribed ? '关闭推送' : '开启推送'}
              </button>
            </div>
          )}
        </GlassCard>

        {/* 手机端退出按钮 */}
        {isMobile && (
          <button
            onClick={handleSignOut}
            style={{
              marginTop: 32, width: '100%', padding: '12px 0',
              borderRadius: 12, border: '1px solid rgba(196,120,90,0.2)',
              background: 'rgba(255,255,255,0.5)',
              color: 'rgba(61,35,24,0.5)', fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
            }}
          >
            切换用户
          </button>
        )}

        {/* 底部签名 */}
        <div style={{ marginTop: isMobile ? 24 : 60, textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic', fontSize: 12,
            color: 'rgba(61,35,24,0.2)', letterSpacing: '0.06em',
          }}>
            Only Us · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  )
}
