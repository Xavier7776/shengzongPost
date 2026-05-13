'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useIsMobile } from '@/lib/hooks'
import DaysCounter from '@/components/onlyus/dashboard/DaysCounter'
import WeatherCard from '@/components/onlyus/dashboard/WeatherCard'
import HeartLineConnect from '@/components/onlyus/dashboard/HeartLineConnect'
import PingButton from '@/components/onlyus/dashboard/PingButton'
import GoodnightCard from '@/components/onlyus/dashboard/GoodnightCard'
import MorningCard from '@/components/onlyus/dashboard/MorningCard'
import MoodSummaryCard from '@/components/onlyus/dashboard/MoodSummaryCard'
import CountdownWidget from '@/components/onlyus/dashboard/CountdownWidget'
import CareMessageToast from '@/components/onlyus/weather/CareMessageToast'

// 默认城市坐标（fallback）
const DEFAULT_COORDS = { lat: 39.9042, lon: 116.4074, city: '北京' }

export default function OnlyUsHomePage() {
  const { profile, partner, coupleInfo } = useOnlyUsAuthStore()
  const isMobile = useIsMobile()

  const myLat   = profile?.latitude  ?? DEFAULT_COORDS.lat
  const myLon   = profile?.longitude ?? DEFAULT_COORDS.lon
  const myCity  = profile?.city      ?? DEFAULT_COORDS.city
  const ptLat   = partner?.latitude  ?? (myLat + 0.5)
  const ptLon   = partner?.longitude ?? (myLon + 0.5)
  const ptCity  = partner?.city      ?? '异地'

  const myName      = profile?.nickname ?? 'Me'
  const partnerName = partner?.nickname ?? 'Ta'
  const anniversary = coupleInfo?.anniversary_date

  // 问候语
  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 6  ? '深夜了，注意休息' :
    hour < 11 ? '早上好' :
    hour < 14 ? '午安' :
    hour < 18 ? '下午好' :
    hour < 22 ? '傍晚好' : '夜深了'
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  if (isMobile) {
    return (
      <>
        {profile && partner && <CareMessageToast userId={profile.id} senderName={partner.nickname} />}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
          @keyframes card-rise {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .onlyus-card {
            animation: card-rise 0.55s cubic-bezier(0.16,1,0.3,1) both;
          }
        `}</style>

        <div style={{
          minHeight: '100%',
          padding: '20px 16px 80px',
          maxWidth: 960,
          margin: '0 auto',
        }}>
          {/* 顶部问候 */}
          <div className="onlyus-card" style={{ animationDelay: '0ms', marginBottom: 24 }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 11, letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(196,120,90,0.6)',
              margin: '0 0 6px',
            }}>
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(24px, 6vw, 32px)',
              fontWeight: 400,
              color: '#3D2318',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {greeting}，{myName}
              <span style={{ color: '#E8849C', marginLeft: 8 }}>·</span>
            </h1>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 12, color: 'rgba(196,120,90,0.5)',
              margin: '4px 0 0', letterSpacing: '0.08em',
            }}>
              {timeStr}
            </p>
          </div>

          {/* 单栏卡片 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="onlyus-card" style={{ animationDelay: '80ms' }}>
              <DaysCounter anniversaryDate={anniversary} />
            </div>
            <div className="onlyus-card" style={{ animationDelay: '100ms' }}>
              <CountdownWidget
                meetupDate={coupleInfo?.proposed_meetup_date}
                anniversaryDate={anniversary}
                coupleId={coupleInfo?.id}
              />
            </div>
            <div className="onlyus-card" style={{ animationDelay: '120ms' }}>
              <MoodSummaryCard />
            </div>
            <div className="onlyus-card" style={{ animationDelay: '150ms' }}>
              <MorningCard />
            </div>
            <div className="onlyus-card" style={{ animationDelay: '180ms' }}>
              <WeatherCard
                myCity={myCity} myLat={myLat} myLon={myLon}
                partnerCity={ptCity} partnerLat={ptLat} partnerLon={ptLon}
                myName={myName} partnerName={partnerName}
                myUserId={profile?.id}
                partnerUserId={partner?.id}
              />
            </div>
            <div className="onlyus-card" style={{ animationDelay: '220ms' }}>
              <PingButton />
            </div>
            <div className="onlyus-card" style={{ animationDelay: '280ms' }}>
              <HeartLineConnect
                myName={myName} partnerName={partnerName}
                myAvatarUrl={profile?.avatar_url}
                partnerAvatarUrl={partner?.avatar_url}
              />
            </div>
            <div className="onlyus-card" style={{ animationDelay: '320ms' }}>
              <GoodnightCard />
            </div>
            <div className="onlyus-card" style={{
              animationDelay: '380ms',
              textAlign: 'center', padding: '16px 0 0',
            }}>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontSize: 12,
                color: 'rgba(61,35,24,0.28)',
                letterSpacing: '0.06em',
                margin: 0,
              }}>
                &ldquo;In all the world, there is no heart for me like yours.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {profile && partner && <CareMessageToast userId={profile.id} senderName={partner.nickname} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

        @keyframes card-rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .onlyus-card {
          animation: card-rise 0.55s cubic-bezier(0.16,1,0.3,1) both;
        }
      `}</style>

      <div style={{
        minHeight: '100%',
        padding: '40px 40px 60px',
        maxWidth: 960,
        margin: '0 auto',
      }}>

        {/* 顶部问候 */}
        <div className="onlyus-card" style={{ animationDelay: '0ms', marginBottom: 36 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 12, letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'rgba(196,120,90,0.6)',
            margin: '0 0 6px',
          }}>
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(26px, 3vw, 34px)',
            fontWeight: 400,
            color: '#3D2318',
            margin: 0,
            lineHeight: 1.2,
          }}>
            {greeting}，{myName}
            <span style={{ color: '#E8849C', marginLeft: 8 }}>·</span>
          </h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 12, color: 'rgba(196,120,90,0.5)',
            margin: '4px 0 0', letterSpacing: '0.08em',
          }}>
            {timeStr}
          </p>
        </div>

        {/* 主网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 16,
        }}>

          {/* 在一起天数 — 占 5 列 */}
          <div className="onlyus-card" style={{ gridColumn: 'span 5', animationDelay: '80ms' }}>
            <DaysCounter anniversaryDate={anniversary} />
          </div>

          {/* 心情速览 — 占 7 列 */}
          <div className="onlyus-card" style={{ gridColumn: 'span 7', animationDelay: '120ms' }}>
            <MoodSummaryCard />
          </div>

          {/* 早安打卡 — 占 5 列 */}
          <div className="onlyus-card" style={{ gridColumn: 'span 5', animationDelay: '150ms' }}>
            <MorningCard />
          </div>

          {/* 倒数日 — 占 7 列 */}
          <div className="onlyus-card" style={{ gridColumn: 'span 7', animationDelay: '170ms' }}>
            <CountdownWidget
              meetupDate={coupleInfo?.proposed_meetup_date}
              anniversaryDate={anniversary}
              coupleId={coupleInfo?.id}
            />
          </div>

          {/* 双城天气 — 占 7 列 */}
          <div className="onlyus-card" style={{ gridColumn: 'span 7', animationDelay: '180ms' }}>
            <WeatherCard
              myCity={myCity} myLat={myLat} myLon={myLon}
              partnerCity={ptCity} partnerLat={ptLat} partnerLon={ptLon}
              myName={myName} partnerName={partnerName}
            />
          </div>

          {/* 戳一戳 — 占 5 列 */}
          <div className="onlyus-card" style={{ gridColumn: 'span 5', animationDelay: '220ms' }}>
            <PingButton />
          </div>

          {/* 心跳连线 — 占 7 列 */}
          <div className="onlyus-card" style={{ gridColumn: 'span 7', animationDelay: '280ms' }}>
            <HeartLineConnect
              myName={myName} partnerName={partnerName}
              myAvatarUrl={profile?.avatar_url}
              partnerAvatarUrl={partner?.avatar_url}
            />
          </div>

          {/* 晚安打卡 — 占 5 列 */}
          <div className="onlyus-card" style={{ gridColumn: 'span 5', animationDelay: '320ms' }}>
            <GoodnightCard />
          </div>

          {/* 底部装饰引用 */}
          <div className="onlyus-card" style={{
            gridColumn: 'span 12', animationDelay: '380ms',
            textAlign: 'center', padding: '20px 0 0',
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 13,
              color: 'rgba(61,35,24,0.28)',
              letterSpacing: '0.06em',
              margin: 0,
            }}>
              &ldquo;In all the world, there is no heart for me like yours.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
