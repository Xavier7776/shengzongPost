'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

interface HeartCrystalProps {
  burst?: boolean
  onBurstComplete?: () => void
  mouseX?: number
  mouseY?: number
}

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
      depth: 0.30,
      bevelEnabled: true,
      bevelThickness: 0.10,
      bevelSize: 0.07,
      bevelSegments: 16,
      curveSegments: 80,
    })
    geo.center()
    return geo
  }, [buildHeartShape])

  const createBurstParticles = useCallback(() => {
    const count = 1000
    const positions  = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const colors     = new Float32Array(count * 3)

    const palette: THREE.Color[] = [
      new THREE.Color('#C4785A'),
      new THREE.Color('#E8849C'),
      new THREE.Color('#F2A98A'),
      new THREE.Color('#FFDDD5'),
      new THREE.Color('#FF6B88'),
      new THREE.Color('#ffffff'),
    ]

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 0.2 + Math.random() * 0.8
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i*3+2] = r * Math.cos(phi)

      const speed = 0.012 + Math.random() * 0.055
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
      size: 0.042, vertexColors: true,
      transparent: true, opacity: 1, sizeAttenuation: true,
    })
    return new THREE.Points(geo, mat)
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth
    const h = mount.clientHeight

    // ── Renderer ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 100)
    camera.position.z = 5.2

    // ── Lights ────────────────────────────────────────────
    // Ambient
    scene.add(new THREE.AmbientLight(0xfff5ee, 1.0))

    // Directional: key (warm white, top-right)
    const key = new THREE.DirectionalLight(0xffffff, 3.5)
    key.position.set(4, 7, 5)
    scene.add(key)

    // Directional: rim (rose, back-left)
    const rim = new THREE.DirectionalLight(0xff9ab5, 2.5)
    rim.position.set(-5, -1, -3)
    scene.add(rim)

    // Directional: fill (peach, front-bottom)
    const fill = new THREE.DirectionalLight(0xffeedd, 1.2)
    fill.position.set(0, -4, 6)
    scene.add(fill)

    // Point lights (dynamic, produce moving specular highlights)
    const pt1 = new THREE.PointLight(0xff5577, 5.0, 14)
    pt1.position.set(-2, 1.5, 3.5)
    scene.add(pt1)

    const pt2 = new THREE.PointLight(0xffaa44, 4.0, 12)
    pt2.position.set(2.5, -1, 3)
    scene.add(pt2)

    const pt3 = new THREE.PointLight(0xffffff, 6.0, 10)
    pt3.position.set(0, 3, 2)
    scene.add(pt3)

    const pt4 = new THREE.PointLight(0xcc88ff, 2.5, 10)
    pt4.position.set(-3, -2, 1)
    scene.add(pt4)

    // ── Heart group ───────────────────────────────────────
    const heartGroup = new THREE.Group()
    heartGroup.rotation.z = 0
    heartGroup.position.y = 0.1
    scene.add(heartGroup)

    // Layer 1: outer body — glossy rose red (MeshPhongMaterial, no envMap needed)
    const outerMat = new THREE.MeshPhongMaterial({
      color:    new THREE.Color('#CC3360'),
      emissive: new THREE.Color('#5A0A18'),
      emissiveIntensity: 1,
      specular: new THREE.Color('#ffffff'),
      shininess: 180,
      transparent: false,
    })
    heartGroup.add(new THREE.Mesh(buildHeartGeo(0.065), outerMat))

    // Layer 2: inner shell back-side — soft pink glow
    const innerMat = new THREE.MeshPhongMaterial({
      color:    new THREE.Color('#FF8FAA'),
      emissive: new THREE.Color('#CC2255'),
      emissiveIntensity: 1,
      specular: new THREE.Color('#ffccdd'),
      shininess: 60,
      transparent: true,
      opacity: 0.45,
      side: THREE.BackSide,
    })
    heartGroup.add(new THREE.Mesh(buildHeartGeo(0.058), innerMat))

    // Layer 3: deep emissive core — bright inner glow
    const coreMat = new THREE.MeshPhongMaterial({
      color:    new THREE.Color('#FFB0C8'),
      emissive: new THREE.Color('#FF2244'),
      emissiveIntensity: 1,
      shininess: 0,
      transparent: true,
      opacity: 0.28,
      side: THREE.BackSide,
    })
    heartGroup.add(new THREE.Mesh(buildHeartGeo(0.048), coreMat))

    // Layer 4: specular highlight shell — ultra smooth, catches bright spots
    const specMat = new THREE.MeshPhongMaterial({
      color:    new THREE.Color('#ffffff'),
      emissive: new THREE.Color('#000000'),
      specular: new THREE.Color('#ffffff'),
      shininess: 800,
      transparent: true,
      opacity: 0.10,
    })
    heartGroup.add(new THREE.Mesh(buildHeartGeo(0.0655), specMat))

    // ── Orbiting sparkles ─────────────────────────────────
    const sparkCount = 100
    const sPos = new Float32Array(sparkCount * 3)
    const sCol = new Float32Array(sparkCount * 3)
    const sparkColors: THREE.Color[] = [
      new THREE.Color('#FFD6E0'),
      new THREE.Color('#FFC0CB'),
      new THREE.Color('#FFAABB'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#FFE4EC'),
    ]
    for (let i = 0; i < sparkCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 1.3 + Math.random() * 1.0
      sPos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      sPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      sPos[i*3+2] = r * Math.cos(phi)
      const c = sparkColors[Math.floor(Math.random() * sparkColors.length)]
      sCol[i*3] = c.r; sCol[i*3+1] = c.g; sCol[i*3+2] = c.b
    }
    const sparkGeo = new THREE.BufferGeometry()
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
    sparkGeo.setAttribute('color',    new THREE.BufferAttribute(sCol, 3))
    const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
      size: 0.022, vertexColors: true,
      transparent: true, opacity: 0.7, sizeAttenuation: true,
    }))
    scene.add(sparks)

    // ── Store refs ────────────────────────────────────────
    sceneRef.current = {
      renderer, scene, camera, heartGroup,
      burstParticles: null, animFrame: 0,
      isBursting: false, burstStartTime: 0,
      mouseX: 0, mouseY: 0,
      lights: [pt1, pt2, pt3, pt4],
      sparks,
    }

    // ── Animation loop ────────────────────────────────────
    let time = 0
    let curRotY = 0
    let curRotX = 0

    const animate = () => {
      const ref = sceneRef.current
      if (!ref) return
      ref.animFrame = requestAnimationFrame(animate)
      time += 0.008

      if (!ref.isBursting) {
        // Smooth parallax rotation
        const targetY = time * 0.32 + ref.mouseX * 0.25
        const targetX = Math.sin(time * 0.25) * 0.10 + ref.mouseY * 0.15
        curRotY += (targetY - curRotY) * 0.05
        curRotX += (targetX - curRotX) * 0.05
        ref.heartGroup.rotation.y = curRotY
        ref.heartGroup.rotation.x = curRotX

        // Breathing scale
        const breathe = 1 + Math.sin(time * 1.0) * 0.028
        ref.heartGroup.scale.setScalar(breathe)

        // Animate point lights for moving specular highlights
        ref.lights[0].intensity = 5.0 + Math.sin(time * 1.8) * 2.0
        ref.lights[1].intensity = 4.0 + Math.cos(time * 1.4) * 1.5
        ref.lights[2].intensity = 6.0 + Math.sin(time * 2.1 + 1.0) * 2.5
        ref.lights[3].intensity = 2.5 + Math.cos(time * 0.9) * 1.0

        ref.lights[0].position.x = -2   + Math.sin(time * 0.7) * 1.0
        ref.lights[0].position.y =  1.5 + Math.cos(time * 0.5) * 0.5
        ref.lights[1].position.x =  2.5 + Math.cos(time * 0.6) * 1.0
        ref.lights[2].position.y =  3   + Math.sin(time * 0.8) * 0.8

        ref.sparks.rotation.y += 0.004
        ref.sparks.rotation.x += 0.0015

      } else {
        const elapsed  = (Date.now() - ref.burstStartTime) / 1000
        const progress = Math.min(elapsed / 0.9, 1)
        const eased    = 1 - Math.pow(1 - progress, 3)

        ref.heartGroup.scale.setScalar(1 + eased * 0.7)

        ref.heartGroup.children.forEach((obj) => {
          const mesh = obj as THREE.Mesh
          const mat  = mesh.material as THREE.MeshPhongMaterial
          if (mat) {
            mat.transparent = true
            mat.opacity = Math.max(0, mat.opacity - eased * 0.04)
          }
        })

        ref.sparks.visible = false

        if (ref.burstParticles) {
          const pos = ref.burstParticles.geometry.getAttribute('position') as THREE.BufferAttribute
          const vel = ref.burstParticles.geometry.userData.velocities as Float32Array
          const mat = ref.burstParticles.material as THREE.PointsMaterial
          for (let i = 0; i < pos.count; i++) {
            pos.setX(i, pos.getX(i) + vel[i*3])
            pos.setY(i, pos.getY(i) + vel[i*3+1] - 0.0006 * elapsed * 60)
            pos.setZ(i, pos.getZ(i) + vel[i*3+2])
          }
          pos.needsUpdate = true
          mat.opacity = Math.max(0, 1 - eased * 0.9)
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
  }, [buildHeartGeo, onBurstComplete])

  useEffect(() => {
    if (!sceneRef.current) return
    sceneRef.current.mouseX = mouseX
    sceneRef.current.mouseY = mouseY
  }, [mouseX, mouseY])

  useEffect(() => {
    if (!burst || !sceneRef.current) return
    const ref = sceneRef.current
    ref.isBursting   = true
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
