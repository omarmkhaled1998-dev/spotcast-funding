"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const PINK = "#dd7c99";
const NAVY = "#0e2334";
const STEEL = "#2a3a50";
const GLASS = "#4a7a9b";
const GOLD = "#c9a84c";

/* ─── Reusable box ─────────────────────────────────────────── */
function Box({
  position,
  size,
  color,
  metalness = 0.3,
  roughness = 0.5,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

/* ─── Window strip ─────────────────────────────────────────── */
function WindowStrip({
  y,
  z,
  width,
  count,
}: {
  y: number;
  z: number;
  width: number;
  count: number;
}) {
  const spacing = width / count;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          position={[
            -width / 2 + spacing * i + spacing / 2,
            y,
            z,
          ]}
          castShadow
        >
          <boxGeometry args={[spacing * 0.72, 0.55, 0.04]} />
          <meshStandardMaterial
            color={GLASS}
            metalness={0.8}
            roughness={0.1}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </>
  );
}

/* ─── Building scene ────────────────────────────────────────── */
function Building() {
  const W = 3.2;   // width
  const D = 2.0;   // depth
  const fH = 0.75; // floor height
  const floors = 6;
  const totalH = floors * fH;
  const baseY = -totalH / 2;

  return (
    <group>
      {/* ── Main structure — each floor ── */}
      {Array.from({ length: floors }).map((_, i) => {
        const y = baseY + fH * i + fH / 2;
        const isTop = i === floors - 1;
        const floorW = isTop ? W * 0.85 : W;
        const floorD = isTop ? D * 0.85 : D;
        return (
          <group key={i}>
            {/* Slab */}
            <Box
              position={[0, y, 0]}
              size={[floorW, fH * 0.9, floorD]}
              color={i % 2 === 0 ? STEEL : "#1e2e40"}
              metalness={0.25}
              roughness={0.6}
            />
            {/* Front windows */}
            <WindowStrip y={y} z={floorD / 2 + 0.02} width={floorW * 0.88} count={4} />
            {/* Back windows */}
            <WindowStrip y={y} z={-(floorD / 2 + 0.02)} width={floorW * 0.88} count={4} />
          </group>
        );
      })}

      {/* ── Facade cladding — vertical fins ── */}
      {[-W / 2 - 0.07, W / 2 + 0.07].map((x, si) =>
        Array.from({ length: 5 }).map((_, fi) => (
          <Box
            key={`fin-${si}-${fi}`}
            position={[x, baseY + fH * fi + fH / 2, (fi % 2 === 0 ? 0.3 : -0.3)]}
            size={[0.08, fH * 0.85, D * 0.55]}
            color={PINK}
            metalness={0.5}
            roughness={0.3}
          />
        ))
      )}

      {/* ── Rooftop — solar array ── */}
      {[-0.8, 0, 0.8].map((x, i) => (
        <Box
          key={`solar-${i}`}
          position={[x, baseY + totalH + 0.12, 0]}
          size={[0.55, 0.06, D * 0.7]}
          color="#1a2a3a"
          metalness={0.6}
          roughness={0.2}
        />
      ))}
      {/* Solar panel accent cells */}
      {[-0.8, 0, 0.8].map((x, i) =>
        [-0.5, 0.5].map((z, j) => (
          <Box
            key={`cell-${i}-${j}`}
            position={[x, baseY + totalH + 0.16, z]}
            size={[0.52, 0.03, 0.38]}
            color="#2255aa"
            metalness={0.7}
            roughness={0.15}
          />
        ))
      )}

      {/* ── Rooftop padel court outline ── */}
      <mesh position={[0, baseY + totalH + 0.07, 0]} receiveShadow>
        <boxGeometry args={[W * 0.5, 0.03, D * 0.75]} />
        <meshStandardMaterial color="#1a3322" roughness={0.9} />
      </mesh>
      {/* Court lines */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={`line-${i}`} position={[x, baseY + totalH + 0.085, 0]}>
          <boxGeometry args={[0.02, 0.01, D * 0.7]} />
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </mesh>
      ))}

      {/* ── Signage bar ── */}
      <Box
        position={[0, baseY + totalH * 0.72, D / 2 + 0.1]}
        size={[W * 0.7, 0.18, 0.06]}
        color={GOLD}
        metalness={0.7}
        roughness={0.25}
      />

      {/* ── Ground level entrance canopy ── */}
      <Box
        position={[0, baseY + fH * 0.15, D / 2 + 0.4]}
        size={[W * 0.55, 0.06, 0.8]}
        color={PINK}
        metalness={0.4}
        roughness={0.4}
      />
      {/* Canopy supports */}
      {[-W * 0.2, W * 0.2].map((x, i) => (
        <Box
          key={`support-${i}`}
          position={[x, baseY + fH * 0.08, D / 2 + 0.78]}
          size={[0.06, fH * 0.3, 0.06]}
          color={NAVY}
          metalness={0.5}
          roughness={0.4}
        />
      ))}

      {/* ── Perimeter wall ── */}
      {[
        { pos: [0, baseY - 0.15, D / 2 + 1.2] as [number, number, number], size: [W + 2.4, 0.7, 0.1] as [number, number, number] },
        { pos: [0, baseY - 0.15, -(D / 2 + 1.2)] as [number, number, number], size: [W + 2.4, 0.7, 0.1] as [number, number, number] },
        { pos: [W / 2 + 1.2, baseY - 0.15, 0] as [number, number, number], size: [0.1, 0.7, D + 2.4] as [number, number, number] },
        { pos: [-(W / 2 + 1.2), baseY - 0.15, 0] as [number, number, number], size: [0.1, 0.7, D + 2.4] as [number, number, number] },
      ].map(({ pos, size }, i) => (
        <Box key={`wall-${i}`} position={pos} size={size} color="#162535" metalness={0.1} roughness={0.9} />
      ))}
    </group>
  );
}

/* ─── Canvas ────────────────────────────────────────────────── */
export default function Building3D() {
  return (
    <Canvas
      camera={{ position: [9, 5, 9], fov: 44 }}
      shadows
      style={{ background: "#0a1825", width: "100%", height: "100%" }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#b8ccd8", "#0d1e2e", 0.6]} />
      <directionalLight
        position={[10, 14, 8]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-6, 4, -6]} intensity={0.5} color="#839ba3" />
      <pointLight position={[0, 4, 4]} intensity={0.6} color={PINK} distance={18} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0d1e2e" roughness={1} />
      </mesh>
      {/* Ground grid lines */}
      {[-4, -2, 0, 2, 4].map((v) => (
        <group key={v}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[v, -2.38, 0]}>
            <planeGeometry args={[0.01, 14]} />
            <meshStandardMaterial color="#1a3050" roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.38, v]}>
            <planeGeometry args={[14, 0.01]} />
            <meshStandardMaterial color="#1a3050" roughness={1} />
          </mesh>
        </group>
      ))}

      <Building />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.6}
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI * 0.56}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}
