'use client'
// components/sections/DistortionEffect.tsx
// 基于 distortion-redesigned.html 的 Three.js 网格扭曲效果，适配博客白色简洁风格
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GRID = 15;
const MOUSE = 0.25;
const STRENGTH = 0.12;
const RELAXATION = 0.91;
const DISTORTION_ASPECT = 3.83228;

export default function DistortionEffect() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const el = container

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000)
    camera.position.z = 2

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // ====== 纹理：白色简洁风格 ======
    function createTextTexture() {
      const c = document.createElement('canvas')
      const ctx = c.getContext('2d')!
      const texH = 600
      const texW = Math.round(texH * DISTORTION_ASPECT)
      c.width = texW
      c.height = texH

      // 白色背景
      ctx.fillStyle = '#FAFAF8'
      ctx.fillRect(0, 0, texW, texH)

      // 极细横线装饰
      ctx.strokeStyle = 'rgba(0,0,0,0.035)'
      ctx.lineWidth = 1
      for (let y = 0; y < texH; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(texW, y); ctx.stroke()
      }

      const leftPad = texW * 0.038
      const centerY = texH / 2

      // 上方 label
      ctx.font = `400 ${texH * 0.042}px Inter, -apple-system, sans-serif`
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.textBaseline = 'alphabetic'
      ctx.textAlign = 'left'
      ctx.fillText('Xavier', leftPad, centerY - texH * 0.24)

      // 主标题：Mind（深色）Stack（品牌蓝）
      let fontSize = texH * 0.52
      ctx.font = `800 ${fontSize}px Inter, -apple-system, Arial Black, sans-serif`
      const fullW = ctx.measureText('MindStack').width
      const targetW = texW * 0.58
      fontSize = fontSize * (targetW / fullW)
      ctx.font = `800 ${fontSize}px Inter, -apple-system, Arial Black, sans-serif`

      const wMind = ctx.measureText('Mind').width
      const titleY = centerY + fontSize * 0.22

      ctx.fillStyle = '#1a1a1a'
      ctx.fillText('Mind', leftPad, titleY)
      ctx.fillStyle = '#2563eb'
      ctx.fillText('Stack', leftPad + wMind, titleY)

      // 副标题
      const subSize = texH * 0.058
      ctx.font = `300 ${subSize}px Inter, -apple-system, sans-serif`
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillText('Deep learning · Time series · AI Research', leftPad, titleY + subSize * 1.55)

      // 终端 log 区（浅色卡片风格）
      const termX = texW * 0.658
      const termY = texH * 0.10
      const termW = texW * 0.335
      const termH = texH * 0.82

      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.beginPath(); ctx.roundRect(termX, termY, termW, termH, 6); ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.roundRect(termX, termY, termW, termH, 6); ctx.stroke()

      // 顶部标题栏
      ctx.fillStyle = 'rgba(0,0,0,0.025)'
      ctx.beginPath(); ctx.roundRect(termX, termY, termW, texH * 0.09, [6, 6, 0, 0]); ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.06)'
      ctx.beginPath(); ctx.moveTo(termX, termY + texH * 0.09); ctx.lineTo(termX + termW, termY + texH * 0.09); ctx.stroke()

      // 三个圆点
      const dotY = termY + texH * 0.045
      const dotColors = ['rgba(255,95,86,0.7)', 'rgba(255,189,46,0.7)', 'rgba(39,201,63,0.7)']
      dotColors.forEach((col, i) => {
        ctx.fillStyle = col
        ctx.beginPath(); ctx.arc(termX + texH * 0.038 + i * texH * 0.046, dotY, texH * 0.014, 0, Math.PI * 2); ctx.fill()
      })

      ctx.font = `400 ${texH * 0.038}px 'Courier New', monospace`
      ctx.fillStyle = 'rgba(0,0,0,0.30)'
      ctx.textAlign = 'center'
      ctx.fillText('mindstack — site status', termX + termW / 2, dotY + texH * 0.016)

      // log 内容：网站状态面板
      const monoSize = texH * 0.041
      ctx.font = `400 ${monoSize}px 'Courier New', monospace`
      ctx.textAlign = 'left'
      const lx = termX + texH * 0.032
      const lineH = monoSize * 1.72
      let ly = termY + texH * 0.09 + lineH

      const C = {
        dim: 'rgba(0,0,0,0.20)', muted: 'rgba(0,0,0,0.38)',
        white: 'rgba(0,0,0,0.72)', green: '#059669', cyan: '#0891b2',
        yellow: '#d97706', purple: '#7c3aed',
      }

      function logLine(segments: [string, string][]) {
        let cx = lx
        for (const [text, color] of segments) {
          ctx.fillStyle = color; ctx.fillText(text, cx, ly); cx += ctx.measureText(text).width
        }
        ly += lineH
      }

      logLine([['$ ', C.green], ['mindstack --status', C.white]])
      ly += lineH * 0.3
      logLine([['[INFO]', C.cyan], [' Stack: ', C.muted], ['Next.js 16 · React 19', C.yellow]])
      logLine([['         ', C.dim], ['Tailwind 4 · Supabase · Three.js', C.dim]])
      ly += lineH * 0.3
      logLine([['[INFO]', C.cyan], [' Sections: ', C.muted], ['Blog · Trending · Projects', C.white]])
      logLine([['[INFO]', C.cyan], [' Features: ', C.muted], ['Cursor Pets · Avatar Frames', C.white]])
      ly += lineH * 0.3
      logLine([['  ✓ ', C.green], ['distortion footer deployed', C.muted]])
      logLine([['  ✓ ', C.green], ['trending cache: stale-while-revalidate', C.muted]])
      logLine([['  → ', C.purple], ['more coming soon...', C.muted]])

      // 光标
      ctx.fillStyle = C.green
      ctx.fillRect(lx, ly + monoSize * 0.08, monoSize * 0.55, monoSize * 0.85)

      // 顶部品牌标识
      ctx.font = `500 ${texH * 0.038}px Inter, sans-serif`
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.textAlign = 'left'
      ctx.fillText('MINDSTACK', leftPad, texH * 0.12)

      // 左下角 CTA
      const ctaY = texH * 0.88
      ctx.fillStyle = '#2563eb'
      ctx.beginPath(); ctx.arc(leftPad + texH * 0.014, ctaY - texH * 0.012, texH * 0.012, 0, Math.PI * 2); ctx.fill()
      ctx.font = `400 ${texH * 0.038}px Inter, sans-serif`
      ctx.fillStyle = 'rgba(0,0,0,0.30)'
      ctx.fillText('Zshengzong', leftPad + texH * 0.04, ctaY)

      const texture = new THREE.CanvasTexture(c)
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      return texture
    }

    const textTexture = createTextTexture()

    // ====== DataTexture ======
    const dataSize = GRID * GRID
    const data = new Float32Array(4 * dataSize)
    for (let i = 0; i < dataSize; i++) { data[4 * i] = 0; data[4 * i + 1] = 0 }

    const dataTexture = new THREE.DataTexture(data, GRID, GRID, THREE.RGBAFormat, THREE.FloatType)
    dataTexture.needsUpdate = true

    // ====== Shader ======
    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      uTexture: { value: textTexture },
      uDataTexture: { value: dataTexture },
    }

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms,
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uDataTexture;
        uniform sampler2D uTexture;
        uniform vec4 resolution;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv;
          vec4 offset = texture2D(uDataTexture, vUv);
          gl_FragColor = texture2D(uTexture, uv - 0.02 * offset.rg);
        }
      `,
    })

    const geometry = new THREE.PlaneGeometry(1, 1, GRID - 1, GRID - 1)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // ====== Resize ======
    function resize() {
      const w = el.offsetWidth
      const h = el.offsetHeight
      const aspect = w / h
      renderer.setSize(w, h)
      mesh.scale.set(aspect, 1, 1)
      camera.left = -aspect / 2
      camera.right = aspect / 2
      camera.top = 0.5
      camera.bottom = -0.5
      camera.updateProjectionMatrix()
      uniforms.resolution.value.set(w, h, 1, 1)
    }

    // ====== 鼠标 ======
    const mouseState = { x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5, vX: 0, vY: 0 }

    function onMouseMove(e: MouseEvent) {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = 1 - (e.clientY - rect.top) / rect.height
      mouseState.vX = x - mouseState.prevX
      mouseState.vY = y - mouseState.prevY
      mouseState.x = x
      mouseState.y = y
      mouseState.prevX = x
      mouseState.prevY = y
    }

    function onMouseLeave() { mouseState.vX = 0; mouseState.vY = 0 }

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('resize', resize)

    // ====== 动画 ======
    let rafId: number
    function animate() {
      rafId = requestAnimationFrame(animate)
      uniforms.time.value += 0.05

      const arr = dataTexture.image.data as Float32Array
      for (let i = 0; i < dataSize; i++) {
        arr[4 * i] *= RELAXATION
        arr[4 * i + 1] *= RELAXATION
      }

      const mx = GRID * mouseState.x
      const my = GRID * mouseState.y
      const radius = GRID * MOUSE

      for (let m = 0; m < GRID; m++) {
        for (let v = 0; v < GRID; v++) {
          const dist2 = Math.pow(mx - m, 2) + Math.pow(my - v, 2)
          if (dist2 < radius * radius) {
            const idx = 4 * (m + GRID * v)
            const falloff = Math.min(radius / Math.sqrt(dist2), 10)
            arr[idx] += 100 * STRENGTH * mouseState.vX * falloff
            arr[idx + 1] -= 100 * STRENGTH * mouseState.vY * falloff
          }
        }
      }

      dataTexture.needsUpdate = true
      renderer.render(scene, camera)
    }

    resize()
    animate()

    // ====== Cleanup ======
    return () => {
      cancelAnimationFrame(rafId)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      textTexture.dispose()
      dataTexture.dispose()
    }
  }, [])

  return (
    <footer className="relative w-full bg-[#FAFAF8] overflow-hidden animate-footer-fade">
      <div
        className="relative w-full"
        style={{
          '--distortion-aspect': '3.83228',
          '--padding-y': '20px',
          paddingBottom: 'calc((min(100vw, 1600px) + 2 * 20px) / 3.83228)',
        } as React.CSSProperties}
      >
        <div
          className="w-full absolute bottom-0 left-0 overflow-hidden"
          style={{
            paddingBlock: '20px',
            height: 'calc((min(100vw, 1600px) + 2 * 20px) / 3.83228)',
            paddingInline: '20px',
          }}
        >
          <div ref={containerRef} className="mx-auto w-full max-w-[1600px] h-full relative">
            <canvas ref={canvasRef} className="block w-full h-full" />
          </div>
        </div>
      </div>
    </footer>
  )
}
