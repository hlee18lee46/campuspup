'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls, Sky } from '@react-three/drei'
import { Dog } from './dog'
import * as THREE from 'three'

interface GameSceneProps {
  onPet: () => void
  happiness: number
  walkMode: boolean
}

function FirstPersonController({
  walkMode,
  onDogMove,
}: {
  walkMode: boolean
  onDogMove: (pos: [number, number, number]) => void
}) {
  const { camera } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const breatheAudio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    breatheAudio.current = new Audio('/breathe.mp3')
    breatheAudio.current.loop = true
    breatheAudio.current.volume = 0.35

    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true
    }

    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      breatheAudio.current?.pause()
    }
  }, [])

  useFrame(() => {
    if (!walkMode) {
      breatheAudio.current?.pause()
      return
    }

    const moving =
      keys.current.w || keys.current.a || keys.current.s || keys.current.d

    if (moving) {
      breatheAudio.current?.play().catch(() => {})
    } else {
      breatheAudio.current?.pause()
    }

    const speed = 0.08

    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(forward, camera.up).normalize()

    if (keys.current.w) camera.position.addScaledVector(forward, speed)
    if (keys.current.s) camera.position.addScaledVector(forward, -speed)
    if (keys.current.a) camera.position.addScaledVector(right, -speed)
    if (keys.current.d) camera.position.addScaledVector(right, speed)

    camera.position.y = 1.5
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -9, 9)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -9, 9)

    const dogOffset = new THREE.Vector3()
      .copy(forward)
      .multiplyScalar(2.5)
      .add(new THREE.Vector3().copy(right).multiplyScalar(0.8))

    const dogPos: [number, number, number] = [
      camera.position.x + dogOffset.x,
      1.0,
      camera.position.z + dogOffset.z,
    ]

    onDogMove(dogPos)
  })

  return null
}

export function GameScene({ onPet, happiness, walkMode }: GameSceneProps) {
  const [dogPosition, setDogPosition] = useState<[number, number, number]>([
    0, 0.8, 0,
  ])

  return (
    <Canvas
      shadows
      camera={{ position: [5, 3, 8], fov: 50 }}
      style={{ background: '#87CEEB' }}
    >
      <ambientLight intensity={1.2} />

      <directionalLight
        position={[10, 15, 10]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <hemisphereLight args={['#87CEEB', '#4ade80', 0.8]} />

      <Sky sunPosition={[100, 20, 100]} turbidity={0.3} rayleigh={0.5} />

      <FirstPersonController
        walkMode={walkMode}
        onDogMove={setDogPosition}
      />

      {walkMode && <PointerLockControls />}

      <Suspense fallback={null}>
        <Dog
          position={walkMode ? dogPosition : [0, 0.8, 0]}
          onPet={onPet}
          happiness={happiness}
        />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.05, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#7ccf6b" />
        </mesh>
      </Suspense>

      <OrbitControls
        enabled={!walkMode}
        enablePan={false}
        minDistance={2}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  )
}