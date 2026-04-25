'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export function Campus() {
  return (
    <group>
      {/* Ground/Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>

      {/* Campus Path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]} receiveShadow>
        <planeGeometry args={[4, 20]} />
        <meshStandardMaterial color="#d4a373" />
      </mesh>

      {/* Main Building */}
      <Building position={[8, 0, -5]} scale={1.5} color="#fbbf24" />
      
      {/* Library */}
      <Building position={[-8, 0, -3]} scale={1.2} color="#f87171" />
      
      {/* Small Building */}
      <Building position={[6, 0, 5]} scale={0.8} color="#60a5fa" />

      {/* Trees */}
      <Tree position={[-5, 0, -8]} scale={1.2} />
      <Tree position={[5, 0, -10]} scale={1} />
      <Tree position={[-8, 0, 6]} scale={1.3} />
      <Tree position={[10, 0, 2]} scale={0.9} />
      <Tree position={[-3, 0, 8]} scale={1.1} />
      <Tree position={[8, 0, -12]} scale={1} />

      {/* Benches */}
      <Bench position={[-2.5, 0, 2]} rotation={[0, Math.PI / 2, 0]} />
      <Bench position={[2.5, 0, 2]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Lamp Posts */}
      <LampPost position={[-2, 0, -3]} />
      <LampPost position={[2, 0, -3]} />
      <LampPost position={[-2, 0, 5]} />
      <LampPost position={[2, 0, 5]} />

      {/* Campus Sign */}
      <group position={[0, 0, -12]}>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[6, 1.5, 0.3]} />
          <meshStandardMaterial color="#1e3a5f" />
        </mesh>
        <Text
          position={[0, 1.5, 0.2]}
          fontSize={0.5}
          color="white"
          font="/fonts/Geist-Bold.ttf"
          anchorX="center"
          anchorY="middle"
        >
          CAMPUS PUP UNIVERSITY
        </Text>
        <mesh position={[-2.5, 0.5, 0]}>
          <boxGeometry args={[0.2, 2, 0.2]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        <mesh position={[2.5, 0.5, 0]}>
          <boxGeometry args={[0.2, 2, 0.2]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      </group>

      {/* Fountain */}
      <Fountain position={[0, 0, -5]} />

      {/* Clouds */}
      <Cloud position={[-10, 15, -20]} scale={2} />
      <Cloud position={[15, 18, -25]} scale={1.5} />
      <Cloud position={[5, 16, -30]} scale={1.8} />
    </group>
  )
}

function Building({ position, scale = 1, color }: { position: [number, number, number], scale?: number, color: string }) {
  const height = 4 * scale
  
  return (
    <group position={position}>
      {/* Main building body */}
      <mesh position={[0, height / 2 - 0.5, 0]} castShadow>
        <boxGeometry args={[4 * scale, height, 3 * scale]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, height - 0.3, 0]} castShadow>
        <boxGeometry args={[4.4 * scale, 0.3, 3.4 * scale]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      
      {/* Windows */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[-1 + i, height / 2, 1.51 * scale]} castShadow>
          <boxGeometry args={[0.5 * scale, 0.7 * scale, 0.05]} />
          <meshStandardMaterial color="#87ceeb" />
        </mesh>
      ))}
      
      {/* Door */}
      <mesh position={[0, 0.5, 1.51 * scale]}>
        <boxGeometry args={[0.8 * scale, 1.2 * scale, 0.05]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
    </group>
  )
}

function Tree({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const treeRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (treeRef.current) {
      // Gentle swaying
      const time = state.clock.elapsedTime
      treeRef.current.rotation.z = Math.sin(time * 0.5 + position[0]) * 0.02
    }
  })

  return (
    <group ref={treeRef} position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* Foliage layers */}
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[1, 1.5, 8]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[0.8, 1.2, 8]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0, 3.4, 0]} castShadow>
        <coneGeometry args={[0.5, 0.8, 8]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
    </group>
  )
}

function Bench({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* Back */}
      <mesh position={[0, 0.7, -0.2]} castShadow>
        <boxGeometry args={[1.5, 0.5, 0.08]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* Legs */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.4]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>
      ))}
    </group>
  )
}

function LampPost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 3, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      
      {/* Lamp head */}
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Point light */}
      <pointLight position={[0, 3.2, 0]} intensity={0.5} distance={8} color="#fbbf24" />
    </group>
  )
}

function Fountain({ position }: { position: [number, number, number] }) {
  const waterRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (waterRef.current) {
      const material = waterRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.3, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      
      {/* Water basin */}
      <mesh ref={waterRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 0.15, 16]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.3} transparent opacity={0.8} />
      </mesh>
      
      {/* Center pillar */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      
      {/* Top bowl */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  )
}

function Cloud({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const cloudRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.1) * 0.5
    }
  })

  return (
    <group ref={cloudRef} position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="white" transparent opacity={0.9} />
      </mesh>
      <mesh position={[1, -0.2, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="white" transparent opacity={0.9} />
      </mesh>
      <mesh position={[-1, -0.1, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color="white" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0.5, 0.4, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="white" transparent opacity={0.9} />
      </mesh>
    </group>
  )
}
