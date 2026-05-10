'use client'

import { useEffect, useState } from 'react'

interface WeatherData {
  temp: number
  weatherCode: number
  windspeed: number
  city: string
}

// WMO 天气代码 → emoji + 描述
function getWeatherInfo(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: '晴朗' }
  if (code <= 2) return { emoji: '⛅', label: '多云' }
  if (code <= 3) return { emoji: '☁️', label: '阴天' }
  if (code <= 49) return { emoji: '🌫️', label: '雾' }
  if (code <= 59) return { emoji: '🌦️', label: '毛毛雨' }
  if (code <= 69) return { emoji: '🌧️', label: '小雨' }
  if (code <= 79) return { emoji: '❄️', label: '下雪' }
  if (code <= 82) return { emoji: '🌧️', label: '阵雨' }
  if (code <= 86) return { emoji: '🌨️', label: '阵雪' }
  if (code <= 99) return { emoji: '⛈️', label: '雷暴' }
  return { emoji: '🌡️', label: '未知' }
}

async function fetchWeather(lat: number, lon: number, city: string): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
  const res = await fetch(url, { next: { revalidate: 1800 } })
  if (!res.ok) throw new Error('weather fetch failed')
  const data = await res.json()
  return {
    temp: Math.round(data.current_weather.temperature),
    weatherCode: data.current_weather.weathercode,
    windspeed: Math.round(data.current_weather.windspeed),
    city,
  }
}

interface WeatherCardProps {
  myCity: string
  myLat: number
  myLon: number
  partnerCity: string
  partnerLat: number
  partnerLon: number
  myName: string
  partnerName: string
}

interface SingleWeatherProps {
  data: WeatherData | null
  loading: boolean
  name: string
  isMe?: boolean
}

function SingleWeather({ data, loading, name, isMe }: SingleWeatherProps) {
  const wi = data ? getWeatherInfo(data.weatherCode) : null

  return (
    <div style={{
      flex: 1,
      padding: '20px 22px',
      borderRadius: 16,
      background: isMe
        ? 'linear-gradient(135deg, rgba(196,120,90,0.08), rgba(196,120,90,0.04))'
        : 'linear-gradient(135deg, rgba(232,132,156,0.08), rgba(232,132,156,0.04))',
      border: `1px solid ${isMe ? 'rgba(196,120,90,0.12)' : 'rgba(232,132,156,0.12)'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10, letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: isMe ? 'rgba(196,120,90,0.6)' : 'rgba(232,132,156,0.7)',
            margin: '0 0 4px',
          }}>
            {name}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, color: 'rgba(61,35,24,0.5)',
            margin: 0,
          }}>
            {loading ? '—' : data?.city ?? '—'}
          </p>
        </div>
        <span style={{ fontSize: 28, lineHeight: 1 }}>
          {loading ? '…' : wi?.emoji ?? '—'}
        </span>
      </div>

      <div style={{ marginTop: 16 }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 42, fontWeight: 400,
          color: '#3D2318', lineHeight: 1,
        }}>
          {loading ? '—' : `${data?.temp}°`}
        </span>
      </div>

      <p style={{
        marginTop: 6, fontSize: 11,
        color: 'rgba(61,35,24,0.4)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {loading ? '' : wi?.label}
        {!loading && data?.windspeed ? ` · 风速 ${data.windspeed}km/h` : ''}
      </p>
    </div>
  )
}

export default function WeatherCard({
  myCity, myLat, myLon,
  partnerCity, partnerLat, partnerLon,
  myName, partnerName,
}: WeatherCardProps) {
  const [myWeather, setMyWeather] = useState<WeatherData | null>(null)
  const [partnerWeather, setPartnerWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      fetchWeather(myLat, myLon, myCity),
      fetchWeather(partnerLat, partnerLon, partnerCity),
    ]).then(([my, partner]) => {
      if (my.status === 'fulfilled') setMyWeather(my.value)
      if (partner.status === 'fulfilled') setPartnerWeather(partner.value)
      setLoading(false)
    })
  }, [myLat, myLon, partnerLat, partnerLon, myCity, partnerCity])

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: '1px solid rgba(196,120,90,0.1)',
      padding: '24px 28px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 11, letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(196,120,90,0.7)',
          margin: 0,
        }}>
          双城天气
        </p>
        <span style={{ fontSize: 11, color: 'rgba(61,35,24,0.3)', fontFamily: "'DM Sans', sans-serif" }}>
          {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <SingleWeather data={myWeather} loading={loading} name={myName} isMe />
        {/* 连接符 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, paddingTop: 28,
        }}>
          <div style={{
            width: 1, height: 40,
            background: 'linear-gradient(to bottom, transparent, rgba(196,120,90,0.3), rgba(232,132,156,0.3), transparent)',
          }} />
        </div>
        <SingleWeather data={partnerWeather} loading={loading} name={partnerName} />
      </div>
    </div>
  )
}
