'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

interface DogProps {
  position?: [number, number, number]
  onPet?: () => void
  happiness: number
}

export function Dog({ position = [0, 0.8, 0], onPet, happiness }: DogProps) {
  const groupRef = useRef<THREE.Group>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPetting, setIsPetting] = useState(false)
  const [hovered, setHovered] = useState(false)

  const { scene } = useGLTF('/white_cartoon_dog.glb')
  const clonedScene = useMemo(() => scene.clone(), [scene])

  const playPupSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/pup.m4a')
      audioRef.current.volume = 0.7
    }

    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.elapsedTime

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      position[0],
      0.08
    )
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      position[2],
      0.08
    )
    groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.03

    if (happiness > 50) {
      groupRef.current.rotation.y =
        Math.sin(time * 6) * 0.08 * (happiness / 100)
    }

    if (isPetting) {
      groupRef.current.rotation.y = Math.sin(time * 12) * 0.12
      groupRef.current.scale.setScalar(1.05 + Math.sin(time * 8) * 0.03)
    } else {
      groupRef.current.scale.setScalar(1)
    }
  })

  const handlePointerDown = () => {
    setIsPetting(true)
    playPupSound()
    onPet?.()
  }

  const handlePointerUp = () => {
    setIsPetting(false)
  }

  return (
    <group ref={groupRef} position={position}>
      <primitive
        object={clonedScene}
        scale={0.08}
        position={[0, 0, 0]}
        rotation={[0, Math.PI, 0]}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />

      {hovered && (
        <Html position={[0, 1.1, 0]} center>
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium shadow-lg pointer-events-none select-none">
            {isPetting ? 'Petting!' : 'Click to pet!'}
          </div>
        </Html>
      )}

      {isPetting && (
        <>
          <Heart position={[0.3, 1.4, 0]} delay={0} />
          <Heart position={[-0.3, 1.3, 0.2]} delay={0.2} />
          <Heart position={[0, 1.5, -0.2]} delay={0.4} />
        </>
      )}
    </group>
  )
}

function Heart({
  position,
  delay,
}: {
  position: [number, number, number]
  delay: number
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return

    const time = state.clock.elapsedTime + delay
    ref.current.position.y = position[1] + Math.sin(time * 3) * 0.2
    ref.current.rotation.y = time * 2
    ref.current.scale.setScalar(0.6 + Math.sin(time * 5) * 0.15)
  })

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color="#ef4444"
        emissive="#ef4444"
        emissiveIntensity={0.6}
      />
    </mesh>
  )
}

useGLTF.preload('/white_cartoon_dog.glb')