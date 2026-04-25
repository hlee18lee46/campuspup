'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import { Dog } from './dog'
import { Campus } from './campus'

interface GameSceneProps {
  onPet: () => void
  happiness: number
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#888" />
    </mesh>
  )
}

export function GameScene({ onPet, happiness }: GameSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 5, 8], fov: 50 }}
      style={{ background: '#87CEEB' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight args={['#87CEEB', '#4ade80', 0.4]} />

      {/* Sky */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.3} rayleigh={0.5} />

      {/* Scene content */}
      <Suspense fallback={<LoadingFallback />}>
        <Campus />
        <Dog position={[0, 0, 0]} onPet={onPet} happiness={happiness} />
      </Suspense>

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  )
}
