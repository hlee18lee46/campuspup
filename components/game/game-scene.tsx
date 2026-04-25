'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import { Dog } from './dog'
// import { Campus } from './campus'

interface GameSceneProps {
  onPet: () => void
  happiness: number
}

export function GameScene({ onPet, happiness }: GameSceneProps) {
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

      <Suspense fallback={null}>
        {/* Temporarily disabled while testing dog model */}
        {/* <Campus /> */}

        <Dog
          position={[0, 0, 0]}
          onPet={onPet}
          happiness={happiness}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#7ccf6b" />
        </mesh>
      </Suspense>

      <OrbitControls
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