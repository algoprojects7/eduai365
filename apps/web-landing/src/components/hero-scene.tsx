'use client';

/* eslint-disable react/no-unknown-property -- React Three Fiber uses non-DOM element props */
import { Float } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import type { Group, Mesh, PerspectiveCamera } from 'three';

function CameraRig() {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const cam = camera as PerspectiveCamera;
    cam.position.x += (pointer.x * 0.6 - cam.position.x) * 0.04;
    cam.position.y += (pointer.y * 0.4 - cam.position.y) * 0.04;
    cam.lookAt(target.current);
  });
  return null;
}

function NeuralNetwork() {
  const groupRef = useRef<Group>(null);
  
  // Create static positions for nodes
  const nodes = useRef(
    Array.from({ length: 16 }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 1.2 + Math.random() * 0.8;
      return {
        pos: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        ),
        size: 0.02 + Math.random() * 0.03,
        color: i % 3 === 0 ? '#1B64F1' : i % 3 === 1 ? '#7C3AED' : '#22D3EE',
      };
    })
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.08;
      groupRef.current.rotation.x = Math.sin(t * 0.04) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.current.map((node, i) => (
        <group key={i} position={[node.pos.x, node.pos.y, node.pos.z]}>
          <mesh>
            <sphereGeometry args={[node.size, 12, 12]} />
            <meshBasicMaterial color={node.color} transparent opacity={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function AIKnowledgeCore() {
  const coreRef = useRef<Mesh>(null);
  const wireframeRef = useRef<Mesh>(null);
  const ringXRef = useRef<Mesh>(null);
  const ringYRef = useRef<Mesh>(null);
  const ringZRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Core pulsing glow
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.25;
      coreRef.current.rotation.x = t * 0.08;
      const scale = 1.0 + Math.sin(t * 1.8) * 0.04;
      coreRef.current.scale.set(scale, scale, scale);
    }
    
    // Wireframe neural network rotation
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = -t * 0.08;
      wireframeRef.current.rotation.z = t * 0.04;
    }
    
    // Orbital rings rotating at different speeds
    if (ringXRef.current) ringXRef.current.rotation.x = t * 0.2;
    if (ringYRef.current) ringYRef.current.rotation.y = -t * 0.15;
    if (ringZRef.current) ringZRef.current.rotation.z = t * 0.25;
  });

  return (
    <group>
      {/* Inner Glowing Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.8, 3]} />
        <meshPhysicalMaterial
          color="#1B64F1"
          emissive="#7C3AED"
          emissiveIntensity={0.65}
          roughness={0.08}
          metalness={0.85}
          transmission={0.35}
          thickness={1.2}
          clearcoat={1.0}
        />
      </mesh>
      
      {/* Neural Wireframe Shell */}
      <mesh ref={wireframeRef}>
        <icosahedronGeometry args={[1.25, 2]} />
        <meshBasicMaterial
          color="#7272fb"
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>
      
      {/* Neural Network Nodes */}
      <NeuralNetwork />
      
      {/* Orbital Ring X */}
      <mesh ref={ringXRef} rotation={[0.2, 0.4, 0.1]}>
        <torusGeometry args={[1.7, 0.015, 16, 120]} />
        <meshBasicMaterial color="#0085e4" transparent opacity={0.5} />
      </mesh>
      
      {/* Orbital Ring Y */}
      <mesh ref={ringYRef} rotation={[Math.PI / 2.3, -0.3, 0.2]}>
        <torusGeometry args={[2.0, 0.01, 16, 120]} />
        <meshBasicMaterial color="#7272fb" transparent opacity={0.45} />
      </mesh>
      
      {/* Orbital Ring Z */}
      <mesh ref={ringZRef} rotation={[-0.4, Math.PI / 3.8, 0.3]}>
        <torusGeometry args={[2.3, 0.008, 16, 120]} />
        <meshBasicMaterial color="#62aeff" transparent opacity={0.42} />
      </mesh>
    </group>
  );
}

interface FloatingModelProps {
  position?: [number, number, number];
  scale?: number;
}

function GraduationCap({ position = [0, 0, 0], scale = 1 }: FloatingModelProps) {
  const ref = useRef<Group>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      // Gentle floating and slow rotation
      ref.current.position.y = position[1] + Math.sin(t * 1.1) * 0.12;
      ref.current.rotation.y = t * 0.18;
      ref.current.rotation.x = Math.sin(t * 0.4) * 0.04;
    }
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Cap Diamond Top */}
      <mesh position={[0, 0.22, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[1.3, 0.04, 1.3]} />
        <meshPhysicalMaterial
          color="#22D3EE"
          emissive="#06B6D4"
          emissiveIntensity={0.4}
          roughness={0.08}
          metalness={0.8}
          transmission={0.7}
          thickness={0.6}
          clearcoat={1.0}
        />
      </mesh>
      
      {/* Cap Skull Base */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.42, 0.46, 0.32, 32]} />
        <meshPhysicalMaterial
          color="#1E1B4B"
          emissive="#6366F1"
          emissiveIntensity={0.5}
          roughness={0.15}
          metalness={0.9}
          transmission={0.4}
          thickness={0.6}
          clearcoat={0.5}
        />
      </mesh>
      
      {/* Cap Button on Top */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Tassel String/Ribbon */}
      <mesh position={[0.26, 0.12, 0.26]} rotation={[0, 0, -Math.PI / 6.2]}>
        <boxGeometry args={[0.55, 0.015, 0.03]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Tassel Fringe */}
      <mesh position={[0.48, -0.06, 0.48]}>
        <cylinderGeometry args={[0.04, 0.06, 0.18, 16]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function OpenBook({ position = [0, 0, 0], scale = 1 }: FloatingModelProps) {
  const ref = useRef<Group>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      // Gentle floating and slow rotation opposite to cap
      ref.current.position.y = position[1] + Math.sin(t * 0.95 + Math.PI) * 0.12;
      ref.current.rotation.y = -t * 0.14;
      ref.current.rotation.z = Math.sin(t * 0.3) * 0.03;
    }
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Spine */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.85, 16]} />
        <meshStandardMaterial color="#312E81" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Left Page (angled slightly upwards) */}
      <group position={[-0.24, 0, 0]} rotation={[0, 0, 0.14]}>
        <mesh>
          <boxGeometry args={[0.46, 0.025, 0.76]} />
          <meshPhysicalMaterial
            color="#C084FC"
            emissive="#A855F7"
            emissiveIntensity={0.4}
            roughness={0.12}
            metalness={0.6}
            transmission={0.75}
            thickness={0.4}
            clearcoat={0.8}
          />
        </mesh>
        {/* Page lines / text glow */}
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[0.36, 0.004, 0.56]} />
          <meshBasicMaterial color="#F3E8FF" transparent opacity={0.7} />
        </mesh>
      </group>
      
      {/* Right Page (angled slightly upwards) */}
      <group position={[0.24, 0, 0]} rotation={[0, 0, -0.14]}>
        <mesh>
          <boxGeometry args={[0.46, 0.025, 0.76]} />
          <meshPhysicalMaterial
            color="#C084FC"
            emissive="#A855F7"
            emissiveIntensity={0.4}
            roughness={0.12}
            metalness={0.6}
            transmission={0.75}
            thickness={0.4}
            clearcoat={0.8}
          />
        </mesh>
        {/* Page lines / text glow */}
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[0.36, 0.004, 0.56]} />
          <meshBasicMaterial color="#F3E8FF" transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function ScienceModel({ position = [0, 0, 0], scale = 1 }: FloatingModelProps) {
  const ref = useRef<Group>(null);
  const ring1 = useRef<Mesh>(null);
  const ring2 = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t * 1.3) * 0.1;
      ref.current.rotation.y = t * 0.12;
    }
    if (ring1.current) ring1.current.rotation.x = t * 0.75;
    if (ring2.current) ring2.current.rotation.y = t * 0.55;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshPhysicalMaterial
          color="#EC4899"
          emissive="#EC4899"
          emissiveIntensity={1.0}
          roughness={0.05}
          metalness={0.8}
        />
      </mesh>
      
      {/* Orbit 1 */}
      <mesh ref={ring1} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[0.46, 0.008, 8, 64]} />
        <meshBasicMaterial color="#F472B6" transparent opacity={0.5} />
        {/* Electron */}
        <mesh position={[0.46, 0, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#F472B6" />
        </mesh>
      </mesh>
      
      {/* Orbit 2 */}
      <mesh ref={ring2} rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[0.46, 0.008, 8, 64]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.5} />
        {/* Electron */}
        <mesh position={[-0.46, 0, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#3B82F6" />
        </mesh>
      </mesh>
    </group>
  );
}

function HolographicGlobe({ position = [0, 0, 0], scale = 1 }: FloatingModelProps) {
  const ref = useRef<Group>(null);
  const sphereRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t * 0.75) * 0.12;
    }
    if (sphereRef.current) {
      sphereRef.current.rotation.y = t * 0.12;
    }
  });

  return (
    <group ref={ref} position={position} scale={scale} rotation={[0.4, 0, 0.4]}>
      {/* Tilted Globe Axis */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshPhysicalMaterial
          color="#06B6D4"
          emissive="#0891B2"
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial color="#0891B2" transparent opacity={0.25} />
      </mesh>
      {/* Orbital Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.006, 8, 64]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#050A1E']} />
      <fog attach="fog" args={['#0B1120', 18, 42]} />
      <CameraRig />
      <ambientLight intensity={1.45} />
      <pointLight position={[8, 8, 6]} intensity={1.2} color="#7C3AED" />
      <pointLight position={[-6, -4, 6]} intensity={1.0} color="#1B64F1" />
      <spotLight position={[0, 10, 3]} angle={0.4} penumbra={1} intensity={0.85} color="#ffffff" />

      {/* Central AI Knowledge Core */}
      <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.7}>
        <AIKnowledgeCore />
      </Float>

      {/* Floating Graduation Cap (Top Left) */}
      <GraduationCap position={[-2.1, 1.1, 0.5]} scale={0.7} />

      {/* Floating Open Book (Bottom Right) */}
      <OpenBook position={[2.2, -1.0, 0.5]} scale={0.75} />

      {/* Floating Science Model (Top Right) */}
      <ScienceModel position={[2.0, 1.2, -0.5]} scale={0.8} />

      {/* Floating Holographic Globe (Bottom Left) */}
      <HolographicGlobe position={[-2.2, -1.1, -0.5]} scale={0.85} />
    </>
  );
}

export function HeroScene({ isVisible = true }: { isVisible?: boolean }) {
  return (
    <Canvas
      className="absolute inset-0 h-full min-h-[400px] w-full touch-none"
      camera={{ position: [0, 0, 7], fov: 48 }}
      dpr={[1, 1.5]}
      frameloop={isVisible ? 'always' : 'never'}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#050A1E', 0);
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      }}
      onError={(error) => {
        console.warn('[HeroScene] WebGL unavailable:', error);
      }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
