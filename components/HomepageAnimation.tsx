import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF, Text, Float } from '@react-three/drei';
import { motion } from 'framer-motion-3d';
import * as THREE from 'three';

interface KnowledgeNode {
  name: string;
  color: string;
}

const KNOWLEDGE_NODES: KnowledgeNode[] = [
  { name: 'HTML', color: '#e34c26' },
  { name: 'CSS', color: '#264de4' },
  { name: 'JavaScript', color: '#f7df1e' },
  { name: 'Python', color: '#3776ab' },
  { name: 'SEO', color: '#00a698' },
  { name: 'AI', color: '#ff6b6b' },
  { name: 'Analytics', color: '#4285f4' },
  { name: 'Database', color: '#f29111' },
  { name: 'Cloud', color: '#0080ff' },
  { name: 'Security', color: '#ff4757' },
];

interface BrainProps {
  onNodeClick: (name: string) => void;
}

function Brain({ onNodeClick }: BrainProps) {
  const brainRef = useRef<THREE.Group>(null);
  const [hasError, setHasError] = useState(false);

  useFrame(({ clock }) => {
    if (brainRef.current) {
      brainRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.1;
    }
  });

  // Fallback brain visualization using basic Three.js shapes
  if (hasError) {
    return (
      <group ref={brainRef}>
        <mesh>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial
            color="#ff6b6b"
            roughness={0.3}
            metalness={0.7}
            wireframe={true}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.4, 24, 24]} />
          <meshStandardMaterial
            color="#4285f4"
            roughness={0.4}
            metalness={0.6}
            wireframe={true}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={brainRef}>
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#ff6b6b"
          roughness={0.3}
          metalness={0.7}
          wireframe={true}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.4, 24, 24]} />
        <meshStandardMaterial
          color="#4285f4"
          roughness={0.4}
          metalness={0.6}
          wireframe={true}
        />
      </mesh>
    </group>
  );
}

interface KnowledgeNodeProps {
  name: string;
  color: string;
  position: [number, number, number];
  onNodeClick: (name: string) => void;
}

function KnowledgeNode({ name, color, position, onNodeClick }: KnowledgeNodeProps) {
  const [hovered, setHovered] = useState(false);
  const nodeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (nodeRef.current) {
      nodeRef.current.position.y += Math.sin(clock.elapsedTime + position[0]) * 0.002;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onNodeClick(name);
  };

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group
        ref={nodeRef}
        position={position}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <mesh>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 0.5 : 0.2}
          />
        </mesh>
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      </group>
    </Float>
  );
}

interface SceneProps {
  onNodeClick: (name: string) => void;
}

function Scene({ onNodeClick }: SceneProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 10);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Brain onNodeClick={onNodeClick} />
      {KNOWLEDGE_NODES.map((node, i) => (
        <KnowledgeNode
          key={node.name}
          name={node.name}
          color={node.color}
          position={[
            Math.cos(i * (Math.PI * 2) / KNOWLEDGE_NODES.length) * 4,
            Math.sin(i * (Math.PI * 2) / KNOWLEDGE_NODES.length) * 4,
            0
          ]}
          onNodeClick={onNodeClick}
        />
      ))}
    </>
  );
}

export default function HomepageAnimation() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleNodeClick = (nodeName: string) => {
    setSelectedNode(nodeName);
  };

  return (
    <div className="relative w-full h-[600px]">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{
          background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%)'
        }}
      >
        <Scene onNodeClick={handleNodeClick} />
        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={15}
          enableDamping
        />
      </Canvas>
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm"
        >
          <h3 className="text-lg font-bold mb-2">{selectedNode}</h3>
          <p className="text-sm">
            Learn how our AI-powered SEO tools optimize your {selectedNode} content
            for better search engine rankings.
          </p>
        </motion.div>
      )}
    </div>
  );
} 