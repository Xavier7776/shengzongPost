'use client'

import Link from 'next/link'

export default function OnlyUsEntryCard() {
  return (
    <Link
      href="/onlyus"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'white', border: '0.5px solid #EDD8CE', borderRadius: 32, textDecoration: 'none', transition: 'all 0.2s ease' }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#FAF0EB'; el.style.borderColor = '#C4785A' }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'white'; el.style.borderColor = '#EDD8CE' }}
    >
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FAF0EB', border: '0.5px solid #EDD8CE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤍</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#C4785A', lineHeight: 1.2 }}>OnlyUs</div>
        <div style={{ fontSize: 11, color: '#AAAAAA', lineHeight: 1.2 }}>A private space for two</div>
      </div>
      <span style={{ fontSize: 13, color: '#C4785A', marginLeft: 4 }}>→</span>
    </Link>
  )
}
