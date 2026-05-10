'use client'

import { useEffect } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useIsMobile } from '@/lib/hooks'
import { useGomokuStore, type Stone } from '@/stores/onlyus/gameStores'

const BOARD_SIZE = 15

export default function GomokuPage() {
  const { profile, partner, coupleInfo } = useOnlyUsAuthStore()
  const isMobile = useIsMobile()
  const { game, myColor, isLoading, loadOrCreateGame, makeMove, restartGame, subscribeToGame, unsubscribe } = useGomokuStore()

  useEffect(() => {
    if (!coupleInfo?.id || !profile?.id || !partner?.id) return
    loadOrCreateGame(coupleInfo.id, profile.id, partner.id).then(() => {
      subscribeToGame()
    })
    return () => unsubscribe()
  }, [coupleInfo?.id, profile?.id, partner?.id, loadOrCreateGame, subscribeToGame, unsubscribe])

  if (isLoading || !game) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', color: 'rgba(61,35,24,0.4)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16 }}>
        {isLoading ? '连接中…' : '等待对方加入…'}
      </div>
    )
  }

  const isMyTurn = game.current_turn === myColor && game.status === 'playing'
  const myName = profile?.nickname ?? 'Me'
  const partnerName = partner?.nickname ?? 'Ta'

  const blackName = game.black_player === profile?.id ? myName : partnerName
  const whiteName = game.white_player === profile?.id ? myName : partnerName

  const winSet = new Set((game.win_line ?? []).map(([r, c]) => `${r}-${c}`))

  const cellSize = isMobile ? 22 : 36

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes stone-drop { from { transform: scale(0) translateY(-8px); opacity:0; } to { transform: scale(1) translateY(0); opacity:1; } }
        @keyframes win-glow { 0%,100% { box-shadow: 0 0 6px 2px rgba(196,120,90,0.5); } 50% { box-shadow: 0 0 14px 4px rgba(232,132,156,0.7); } }
      `}</style>

      <div style={{ minHeight: '100%', padding: isMobile ? '20px 16px 80px' : '32px 40px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* 标题 */}
        <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 600, marginBottom: 24 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>
            联机对战
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 400, color: '#3D2318', margin: 0 }}>
            五子棋
          </h1>
        </div>

        {/* 状态栏 */}
        <div style={{
          width: '100%', maxWidth: isMobile ? '100%' : 600, marginBottom: 20,
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)',
          borderRadius: 14, border: '1px solid rgba(196,120,90,0.1)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* 黑棋信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: game.current_turn === 1 && game.status === 'playing' ? 1 : 0.5, transition: 'opacity 0.2s' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1A1A1A', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
            <span style={{ fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{blackName}</span>
            {game.current_turn === 1 && game.status === 'playing' && (
              <span style={{ fontSize: 10, color: '#C4785A', fontFamily: "'DM Sans', sans-serif" }}>thinking…</span>
            )}
          </div>

          {/* 中间状态 */}
          <div style={{ textAlign: 'center' }}>
            {game.status === 'finished' ? (
              <p style={{ margin: 0, fontSize: 14, fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#C4785A' }}>
                {game.winner === myColor ? '🎉 你赢了！' : `${game.winner === 1 ? blackName : whiteName} 赢了`}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(61,35,24,0.4)', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.1em' }}>
                {isMyTurn ? '你的回合' : '等待对方'}
              </p>
            )}
          </div>

          {/* 白棋信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: game.current_turn === 2 && game.status === 'playing' ? 1 : 0.5, transition: 'opacity 0.2s', flexDirection: 'row-reverse' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#F8F6F3', border: '2px solid rgba(61,35,24,0.2)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
            <span style={{ fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{whiteName}</span>
          </div>
        </div>

        {/* 棋盘 */}
        <div style={{
          background: 'linear-gradient(135deg, #F5E6C8, #EDD9A3)',
          borderRadius: 16, padding: 20,
          boxShadow: '0 8px 32px rgba(196,120,90,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
          border: '2px solid rgba(196,120,90,0.2)',
          position: 'relative',
        }}>
          {/* 棋盘线 */}
          <div style={{
            position: 'relative',
            width: (BOARD_SIZE - 1) * cellSize + 2,
            height: (BOARD_SIZE - 1) * cellSize + 2,
          }}>
            {/* 横线 */}
            {Array.from({ length: BOARD_SIZE }).map((_, r) => (
              <div key={`h${r}`} style={{
                position: 'absolute',
                left: 0, right: 0,
                top: r * cellSize + 1,
                height: 1,
                background: 'rgba(61,35,24,0.2)',
              }} />
            ))}
            {/* 竖线 */}
            {Array.from({ length: BOARD_SIZE }).map((_, c) => (
              <div key={`v${c}`} style={{
                position: 'absolute',
                top: 0, bottom: 0,
                left: c * cellSize + 1,
                width: 1,
                background: 'rgba(61,35,24,0.2)',
              }} />
            ))}

            {/* 星位（天元 + 四星） */}
            {[[7,7],[3,3],[3,11],[11,3],[11,11]].map(([r,c]) => (
              <div key={`star${r}${c}`} style={{
                position: 'absolute',
                left: c * cellSize + 1 - 3, top: r * cellSize + 1 - 3,
                width: 6, height: 6, borderRadius: '50%',
                background: 'rgba(61,35,24,0.3)',
              }} />
            ))}

            {/* 落子点（可点击区域） */}
            {Array.from({ length: BOARD_SIZE }).map((_, r) =>
              Array.from({ length: BOARD_SIZE }).map((_, c) => {
                const stone: Stone = game.board[r]?.[c] ?? 0
                const isWin = winSet.has(`${r}-${c}`)
                const canClick = isMyTurn && stone === 0

                return (
                  <div
                    key={`cell${r}${c}`}
                    onClick={() => canClick && makeMove(r, c)}
                    style={{
                      position: 'absolute',
                      left: c * cellSize + 1 - cellSize / 2,
                      top: r * cellSize + 1 - cellSize / 2,
                      width: cellSize, height: cellSize,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: canClick ? 'pointer' : 'default',
                      zIndex: stone !== 0 ? 2 : 1,
                    }}
                  >
                    {stone !== 0 && (
                      <div style={{
                        width: cellSize - 6, height: cellSize - 6, borderRadius: '50%',
                        background: stone === 1
                          ? 'radial-gradient(circle at 35% 35%, #555, #1A1A1A)'
                          : 'radial-gradient(circle at 35% 35%, #fff, #E8E0D8)',
                        boxShadow: stone === 1
                          ? '0 2px 6px rgba(0,0,0,0.5)'
                          : '0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
                        animation: 'stone-drop 0.2s cubic-bezier(0.16,1,0.3,1)',
                        ...(isWin ? { animation: 'win-glow 0.8s ease infinite' } : {}),
                      }} />
                    )}
                    {stone === 0 && canClick && (
                      <div style={{
                        width: cellSize - 10, height: cellSize - 10, borderRadius: '50%',
                        background: myColor === 1 ? 'rgba(26,26,26,0.15)' : 'rgba(255,255,255,0.4)',
                        opacity: 0,
                        transition: 'opacity 0.1s',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0' }}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 重新开始 */}
        {game.status === 'finished' && (
          <button
            onClick={restartGame}
            style={{
              marginTop: 20, padding: '11px 28px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #C4785A, #E8849C)',
              color: '#fff', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(196,120,90,0.3)',
            }}
          >
            再来一局 ↺
          </button>
        )}

        <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(61,35,24,0.25)', fontFamily: "'DM Sans', sans-serif" }}>
          你执{myColor === 1 ? '黑' : '白'}棋 · 先手为黑
        </p>
      </div>
    </>
  )
}
