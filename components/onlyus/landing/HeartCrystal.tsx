'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

interface HeartCrystalProps {
  burst?: boolean
  onBurstComplete?: () => void
  mouseX?: number
  mouseY?: number
}

// ─────────────────────────────────────────────────────────────
// 入场动画时间轴（单位：秒）
//   Phase 0 – 粒子随机散布，淡入等待        0.0 ~ 0.15s
//   Phase 1 – lerp 飞向心形轮廓目标点       0.15 ~ 1.5s
//   Phase 2 – 粒子消融，实体心形淡入        1.5 ~ 2.1s
//   Phase 3 – idle 状态
// ─────────────────────────────────────────────────────────────
const PHASE1_START = 0.15
const PHASE1_END   = 1.5
const PHASE2_END   = 2.1

// 与页面调性完全一致的暖棕-玫瑰色板
const PALETTE_COLORS = [
  '#C4785A',
  '#D4886A',
  '#E8849C',
  '#F2B5C0',
  '#FFDDD5',
  '#FFE8E0',
  '#ffffff',
  '#E8849C',
  '#C4785A',
]

export default function HeartCrystal({
  burst = false,
  onBurstComplete,
  mouseX = 0,
  mouseY = 0,
}: HeartCrystalProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    heartGroup: THREE.Group
    burstParticles: THREE.Points | null
    animFrame: number
    isBursting: boolean
    burstStartTime: number
    mouseX: number
    mouseY: number
    lights: THREE.PointLight[]
    sparks: THREE.Points
    introParticles: THREE.Points | null
    introStartTime: number
    introPhase: 0 | 1 | 2 | 3
    rippleT: number
    rippleActive: boolean
  } | null>(null)

  const heartPoint = useCallback((t: number, scale: number): [number, number] => {
    const x = scale * 16 * Math.pow(Math.sin(t), 3)
    const y = scale * (
      13 * Math.cos(t) -
      5  * Math.cos(2 * t) -
      2  * Math.cos(3 * t) -
          Math.cos(4 * t)
    )
    return [x, y]
  }, [])

  const buildHeartShape = useCallback((scale: number) => {
    const shape = new THREE.Shape()
    const N = 256
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2
      const [x, y] = heartPoint(t, scale)
      i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)
    }
    return shape
  }, [heartPoint])

  const buildHeartGeo = useCallback((scale: number) => {
    const geo = new THREE.ExtrudeGeometry(buildHeartShape(scale), {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.06,
      bevelSegments: 20,
      curveSegments: 96,
    })
    geo.center()
    return geo
  }, [buildHeartShape])

  const createBurstParticles = useCallback(() => {
    const count = 1200
    const positions  = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const colors     = new Float32Array(count * 3)
    const palette = PALETTE_COLORS.map(c => new THREE.Color(c))

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 0.15 + Math.random() * 0.7
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i*3+2] = r * Math.cos(phi)

      const speed = 0.010 + Math.random() * 0.050
      velocities[i*3]   = (Math.random() - 0.5) * speed * 3.5
      velocities[i*3+1] = (Math.random() * 0.7 + 0.15) * speed * 3
      velocities[i*3+2] = (Math.random() - 0.5) * speed * 3

      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3))
    geo.userData.velocities = velocities

    const mat = new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return new THREE.Points(geo, mat)
  }, [])

  const createIntroParticles = useCallback((heartScale: number) => {
    const OUTLINE_COUNT = 700
    const FILL_COUNT    = 500
    const count = OUTLINE_COUNT + FILL_COUNT

    const positions = new Float32Array(count * 3)
    const targets   = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const delays    = new Float32Array(count)

    const palette = PALETTE_COLORS.map(c => new THREE.Color(c))
    const spreadR = 4.0

    for (let i = 0; i < OUTLINE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = spreadR * (0.55 + Math.random() * 0.45)
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i*3+2] = r * Math.cos(phi) * 0.4

      const t = (i / OUTLINE_COUNT) * Math.PI * 2
      const [hx, hy] = heartPoint(t, heartScale)
      targets[i*3]   = hx
      targets[i*3+1] = hy
      targets[i*3+2] = (Math.random() - 0.5) * 0.12

      delays[i] = Math.random() * 0.25

      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b
    }

    let filled = 0
    let attempt = 0
    const maxAttempts = FILL_COUNT * 30
    while (filled < FILL_COUNT && attempt < maxAttempts) {
      attempt++
      const tx = (Math.random() * 2 - 1) * heartScale * 16
      const ty = (Math.random() * 2 - 1) * heartScale * 16
      const nx = tx / (heartScale * 16)
      const ny = ty / (heartScale * 13)
      const inside = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny <= 0.02
      if (!inside) continue

      const idx = OUTLINE_COUNT + filled
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = spreadR * (0.45 + Math.random() * 0.55)
      positions[idx*3]   = r * Math.sin(phi) * Math.cos(theta)
      positions[idx*3+1] = r * Math.sin(phi) * Math.sin(theta)
      positions[idx*3+2] = r * Math.cos(phi) * 0.4

      targets[idx*3]   = tx
      targets[idx*3+1] = ty
      targets[idx*3+2] = (Math.random() - 0.5) * 0.18

      delays[idx] = Math.random() * 0.35

      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[idx*3] = c.r; colors[idx*3+1] = c.g; colors[idx*3+2] = c.b
      filled++
    }

    const total = OUTLINE_COUNT + filled
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, total * 3), 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(colors.slice(0, total * 3), 3))
    geo.userData.targets = targets
    geo.userData.origins = positions.slice()
    geo.userData.delays  = delays

    const mat = new THREE.PointsMaterial({
      size: 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    return new THREE.Points(geo, mat)
  }, [heartPoint])

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

  const easeOutExpo = (t: number) =>
    t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth
    const h = mount.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    mount.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 100)
    camera.position.z = 5.2

    scene.add(new THREE.AmbientLight(0xfff5ee, 0.8))

    const key = new THREE.DirectionalLight(0xfff0e8, 2.8)
    key.position.set(4, 7, 5)
    scene.add(key)

    const rim = new THREE.DirectionalLight(0xffb0c8, 2.0)
    rim.position.set(-5, -1, -3)
    scene.add(rim)

    const fill = new THREE.DirectionalLight(0xffeedd, 1.0)
    fill.position.set(0, -4, 6)
    scene.add(fill)

    const pt1 = new THREE.PointLight(0xff8899, 4.5, 14)
    pt1.position.set(-2, 1.5, 3.5)
    scene.add(pt1)

    const pt2 = new THREE.PointLight(0xffaa66, 3.5, 12)
    pt2.position.set(2.5, -1, 3)
    scene.add(pt2)

    const pt3 = new THREE.PointLight(0xffffff, 5.0, 10)
    pt3.position.set(0, 3, 2)
    scene.add(pt3)

    const pt4 = new THREE.PointLight(0xffccaa, 2.0, 10)
    pt4.position.set(-3, -2, 1)
    scene.add(pt4)

    const heartGroup = new THREE.Group()
    heartGroup.rotation.z = 0
    heartGroup.position.y = 0.1
    heartGroup.visible = false
    scene.add(heartGroup)

    const HEART_SCALE = 0.065

    const outerMat = new THREE.MeshStandardMaterial({
      color:     new THREE.Color('#CC2255'),
      emissive:  new THREE.Color('#7A1228'),
      emissiveIntensity: 0.55,
      metalness: 0.15,
      roughness: 0.22,
      transparent: true,
      opacity: 0,
    })
    heartGroup.add(new THREE.Mesh(buildHeartGeo(HEART_SCALE), outerMat))

    const innerMat = new THREE.MeshStandardMaterial({
      color:     new THREE.Color('#FF8FAA'),
      emissive:  new THREE.Color('#CC2255'),
      emissiveIntensity: 0.65,
      metalness: 0.05,
      roughness: 0.35,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
    })
    heartGroup.add(new THREE.Mesh(buildHeartGeo(0.058), innerMat))

    const coreMat = new THREE.MeshStandardMaterial({
      color:     new THREE.Color('#FFB0C8'),
      emissive:  new THREE.Color('#FF3366'),
      emissiveIntensity: 0.9,
      metalness: 0,
      roughness: 0.5,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
    })
    heartGroup.add(new THREE.Mesh(buildHeartGeo(0.048), coreMat))

    const specMat = new THREE.MeshStandardMaterial({
      color:     new THREE.Color('#ffffff'),
      emissive:  new THREE.Color('#000000'),
      metalness: 0.9,
      roughness: 0.05,
      transparent: true,
      opacity: 0,
    })
    heartGroup.add(new THREE.Mesh(buildHeartGeo(0.0655), specMat))

    const targetOpacities = [1, 0.42, 0.25, 0.08]

    const sparkCount = 120
    const sPos = new Float32Array(sparkCount * 3)
    const sCol = new Float32Array(sparkCount * 3)
    const sparkPalette = [
      new THREE.Color('#FFD6E0'),
      new THREE.Color('#FFC0CB'),
      new THREE.Color('#FFAABB'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#FFDDD5'),
      new THREE.Color('#E8849C'),
    ]
    for (let i = 0; i < sparkCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 1.2 + Math.random() * 1.1
      sPos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      sPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      sPos[i*3+2] = r * Math.cos(phi)
      const c = sparkPalette[Math.floor(Math.random() * sparkPalette.length)]
      sCol[i*3] = c.r; sCol[i*3+1] = c.g; sCol[i*3+2] = c.b
    }
    const sparkGeo = new THREE.BufferGeometry()
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
    sparkGeo.setAttribute('color',    new THREE.BufferAttribute(sCol, 3))
    const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
      size: 0.020,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }))
    scene.add(sparks)

    const introParticles = createIntroParticles(HEART_SCALE)
    scene.add(introParticles)

    sceneRef.current = {
      renderer, scene, camera, heartGroup,
      burstParticles: null, animFrame: 0,
      isBursting: false, burstStartTime: 0,
      mouseX: 0, mouseY: 0,
      lights: [pt1, pt2, pt3, pt4],
      sparks,
      introParticles,
      introStartTime: performance.now() / 1000,
      introPhase: 0,
      rippleT: 0,
      rippleActive: false,
    }

    let time = 0
    let curRotY = 0
    let curRotX = 0

    const animate = () => {
      const ref = sceneRef.current
      if (!ref) return
      ref.animFrame = requestAnimationFrame(animate)
      time += 0.008

      const elapsed = performance.now() / 1000 - ref.introStartTime

      if (ref.introPhase < 3) {
        const ip = ref.introParticles
        if (!ip) { ref.introPhase = 3 }
        else {
          const pos     = ip.geometry.getAttribute('position') as THREE.BufferAttribute
          const targets = ip.geometry.userData.targets as Float32Array
          const origins = ip.geometry.userData.origins as Float32Array
          const delays  = ip.geometry.userData.delays as Float32Array
          const mat     = ip.material as THREE.PointsMaterial
          const count   = pos.count

          if (elapsed < PHASE1_START) {
            const t = elapsed / PHASE1_START
            mat.opacity = easeInOutCubic(t) * 0.85
            ref.introPhase = 0

          } else if (elapsed < PHASE1_END) {
            ref.introPhase = 1
            mat.opacity = 0.85

            const raw = (elapsed - PHASE1_START) / (PHASE1_END - PHASE1_START)

            for (let i = 0; i < count; i++) {
              const delay    = delays[i]
              const localRaw = Math.max(0, (raw - delay) / (1 - delay * 0.6))
              const localT   = Math.min(localRaw, 1)
              const lt       = localT < 0.85
                ? easeOutExpo(localT / 0.85) * 0.92
                : 0.92 + (localT - 0.85) / 0.15 * 0.08

              const ox = origins[i*3], oy = origins[i*3+1], oz = origins[i*3+2]
              const tx = targets[i*3], ty = targets[i*3+1], tz = targets[i*3+2]

              pos.setXYZ(
                i,
                ox + (tx - ox) * lt,
                oy + (ty - oy) * lt,
                oz + (tz - oz) * lt,
              )
            }
            pos.needsUpdate = true

            const globalT = easeOutExpo(raw)
            mat.size = 0.022 + globalT * 0.028

          } else if (elapsed < PHASE2_END) {
            ref.introPhase = 2

            const raw = (elapsed - PHASE1_END) / (PHASE2_END - PHASE1_END)
            const t   = easeInOutCubic(Math.min(raw, 1))

            mat.opacity = 0.85 * (1 - t)

            if (!heartGroup.visible) {
              heartGroup.visible = true
              ref.rippleActive = true
              ref.rippleT = 0
            }

            heartGroup.children.forEach((obj, idx) => {
              const mesh = obj as THREE.Mesh
              const m    = mesh.material as THREE.MeshStandardMaterial
              if (m) m.opacity = targetOpacities[idx] * t
            })

            ;(sparks.material as THREE.PointsMaterial).opacity = 0.65 * t

            const scaleT = t < 0.65
              ? 0.88 + t * 0.185
              : 1.0 + Math.sin((t - 0.65) / 0.35 * Math.PI) * 0.038
            heartGroup.scale.setScalar(scaleT)

          } else {
            if (ref.introPhase !== 3) {
              ref.introPhase = 3
              mat.opacity = 0
              ip.visible = false

              heartGroup.visible = true
              heartGroup.children.forEach((obj, idx) => {
                const mesh = obj as THREE.Mesh
                const m    = mesh.material as THREE.MeshStandardMaterial
                if (m) m.opacity = targetOpacities[idx]
              })
              ;(sparks.material as THREE.PointsMaterial).opacity = 0.65
            }
          }
        }
      }

      if (ref.introPhase === 3 && !ref.isBursting) {
        const targetY = time * 0.28 + ref.mouseX * 0.22
        const targetX = Math.sin(time * 0.22) * 0.08 + ref.mouseY * 0.12
        curRotY += (targetY - curRotY) * 0.045
        curRotX += (targetX - curRotX) * 0.045
        ref.heartGroup.rotation.y = curRotY
        ref.heartGroup.rotation.x = curRotX

        const breathe    = 1 + Math.sin(time * 0.9) * 0.022
        const floatOffset = Math.sin(time * 0.55) * 0.06
        ref.heartGroup.scale.setScalar(breathe)
        ref.heartGroup.position.y = 0.1 + floatOffset

        ref.lights[0].intensity = 4.5 + Math.sin(time * 1.6) * 1.8
        ref.lights[1].intensity = 3.5 + Math.cos(time * 1.2) * 1.4
        ref.lights[2].intensity = 5.0 + Math.sin(time * 1.9 + 1.0) * 2.0
        ref.lights[3].intensity = 2.0 + Math.cos(time * 0.8) * 0.8

        ref.lights[0].position.x = -2   + Math.sin(time * 0.65) * 0.9
        ref.lights[0].position.y =  1.5 + Math.cos(time * 0.45) * 0.4
        ref.lights[1].position.x =  2.5 + Math.cos(time * 0.55) * 0.9
        ref.lights[2].position.y =  3   + Math.sin(time * 0.75) * 0.7

        ref.sparks.rotation.y += 0.003
        ref.sparks.rotation.x += 0.001
      }

      if (ref.isBursting) {
        const burstElapsed = (Date.now() - ref.burstStartTime) / 1000
        const progress = Math.min(burstElapsed / 0.85, 1)
        const eased    = 1 - Math.pow(1 - progress, 3)

        ref.heartGroup.scale.setScalar(1 + eased * 0.8)

        ref.heartGroup.children.forEach((obj) => {
          const mesh = obj as THREE.Mesh
          const m    = mesh.material as THREE.MeshStandardMaterial
          if (m) {
            m.transparent = true
            m.opacity = Math.max(0, m.opacity - eased * 0.045)
          }
        })

        ref.sparks.visible = false

        if (ref.burstParticles) {
          const bpos = ref.burstParticles.geometry.getAttribute('position') as THREE.BufferAttribute
          const vel  = ref.burstParticles.geometry.userData.velocities as Float32Array
          const bmat = ref.burstParticles.material as THREE.PointsMaterial
          for (let i = 0; i < bpos.count; i++) {
            bpos.setX(i, bpos.getX(i) + vel[i*3])
            bpos.setY(i, bpos.getY(i) + vel[i*3+1] - 0.00055 * burstElapsed * 60)
            bpos.setZ(i, bpos.getZ(i) + vel[i*3+2])
          }
          bpos.needsUpdate = true
          bmat.opacity = Math.max(0, 1 - eased * 0.88)
        }

        if (progress >= 1) {
          ref.isBursting = false
          onBurstComplete?.()
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!mount || !sceneRef.current) return
      const w2 = mount.clientWidth
      const h2 = mount.clientHeight
      sceneRef.current.camera.aspect = w2 / h2
      sceneRef.current.camera.updateProjectionMatrix()
      sceneRef.current.renderer.setSize(w2, h2)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animFrame)
        sceneRef.current.renderer.dispose()
      }
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [buildHeartGeo, createIntroParticles, onBurstComplete])

  useEffect(() => {
    if (!sceneRef.current) return
    sceneRef.current.mouseX = mouseX
    sceneRef.current.mouseY = mouseY
  }, [mouseX, mouseY])

  useEffect(() => {
    if (!burst || !sceneRef.current) return
    const ref = sceneRef.current
    ref.isBursting     = true
    ref.burstStartTime = Date.now()
    const bp = createBurstParticles()
    ref.scene.add(bp)
    ref.burstParticles = bp
  }, [burst, createBurstParticles])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  )
}