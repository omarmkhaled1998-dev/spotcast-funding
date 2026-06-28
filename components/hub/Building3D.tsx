"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

/* ─── Palette (from architectural render) ──────────────────── */
const FRAME   = "#33373E";  // dark bronze-charcoal steel frame
const FRAME_D = "#26292F";  // deeper frame shadow
const GLASS   = "#3E5B6E";  // tinted curtain-wall glass
const PLINTH  = "#B9B0A2";  // concrete plinth / retaining wall
const PANEL   = "#7C746A";  // solid signage panel (taupe)
const GOLD    = "#C9A96E";  // signage + accents
const COURT   = "#1F5FA8";  // padel court blue
const SOLAR   = "#13233A";  // solar panel dark blue

/* ─── Dimensions ────────────────────────────────────────────── */
const W = 6.4;     // width  (X)
const D = 3.8;     // depth  (Z)
const FH = 1.5;    // floor height
const FLOORS_N = 3;
const BODY_H = FH * FLOORS_N;

/* ─── Floor labels ──────────────────────────────────────────── */
const FLOORS = [
  { label: "G",  name: "Café · Entrance · Hall" },
  { label: "1F", name: "Co-working · Meeting · Offices" },
  { label: "2F", name: "Studios · Radio · Edit Room" },
  { label: "RF", name: "Padel Court · Solar Array" },
];

/* ─── Reusable box ─────────────────────────────────────────── */
function Box({
  args, position, color, metalness = 0.3, roughness = 0.6,
  transparent = false, opacity = 1,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color: string;
  metalness?: number;
  roughness?: number;
  transparent?: boolean;
  opacity?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  );
}

/* ─── One glazed facade (front or back) ────────────────────── */
function GlassFacade({ z }: { z: number }) {
  const cols = 6;
  const colW = W / cols;
  return (
    <group>
      {/* Continuous glass curtain wall */}
      <Box
        args={[W - 0.1, BODY_H - 0.1, 0.06]}
        position={[0, BODY_H / 2, z]}
        color={GLASS}
        metalness={0.85}
        roughness={0.08}
        transparent
        opacity={0.55}
      />
      {/* Vertical mullions */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <Box
          key={`v${i}`}
          args={[0.12, BODY_H, 0.16]}
          position={[-W / 2 + i * colW, BODY_H / 2, z]}
          color={FRAME}
          metalness={0.5}
          roughness={0.4}
        />
      ))}
      {/* Horizontal floor bands (spandrels) */}
      {Array.from({ length: FLOORS_N + 1 }).map((_, i) => (
        <Box
          key={`h${i}`}
          args={[W, 0.22, 0.2]}
          position={[0, i * FH, z]}
          color={i === 0 ? PLINTH : FRAME}
          metalness={0.35}
          roughness={0.5}
        />
      ))}
    </group>
  );
}

/* ─── Building ──────────────────────────────────────────────── */
function Building() {
  const sideZ = D / 2;

  // Tall corner / facade fin columns (the prominent vertical elements)
  const finXs = [-W / 2, -W / 6, W / 6, W / 2];

  return (
    <group position={[0, 0, 0]}>
      {/* Concrete plinth / base */}
      <Box args={[W + 1.4, 0.6, D + 1.4]} position={[0, -0.3, 0]} color={PLINTH} metalness={0.05} roughness={0.95} />

      {/* Solid core (so glass reads against a mass) */}
      <Box args={[W - 0.4, BODY_H, D - 0.4]} position={[0, BODY_H / 2, 0]} color={FRAME_D} metalness={0.2} roughness={0.7} />

      {/* Front & back glazed facades */}
      <GlassFacade z={sideZ} />
      <GlassFacade z={-sideZ} />

      {/* Side walls — solid taupe panels with windows */}
      {[-W / 2, W / 2].map((x, i) => (
        <group key={i}>
          <Box args={[0.16, BODY_H, D]} position={[x, BODY_H / 2, 0]} color={PANEL} metalness={0.2} roughness={0.7} />
          {/* side glazing strip */}
          <Box args={[0.18, BODY_H - 0.6, D * 0.5]} position={[x, BODY_H / 2, 0]} color={GLASS} metalness={0.85} roughness={0.1} transparent opacity={0.5} />
        </group>
      ))}

      {/* Prominent vertical fin columns (front) */}
      {finXs.map((x, i) => (
        <Box
          key={`fin-f-${i}`}
          args={[0.26, BODY_H + 0.7, 0.4]}
          position={[x, (BODY_H + 0.7) / 2, sideZ + 0.18]}
          color={FRAME}
          metalness={0.55}
          roughness={0.35}
        />
      ))}
      {finXs.map((x, i) => (
        <Box
          key={`fin-b-${i}`}
          args={[0.26, BODY_H + 0.7, 0.4]}
          position={[x, (BODY_H + 0.7) / 2, -sideZ - 0.18]}
          color={FRAME}
          metalness={0.55}
          roughness={0.35}
        />
      ))}

      {/* Gold "shumul center" signage panel on a solid section */}
      <Box args={[W / 6 - 0.2, BODY_H, 0.1]} position={[W / 6, BODY_H / 2, sideZ + 0.12]} color={PANEL} metalness={0.2} roughness={0.7} />
      <Html
        position={[W / 6, BODY_H / 2, sideZ + 0.22]}
        distanceFactor={9}
        occlude={false}
        style={{ pointerEvents: "none", userSelect: "none" }}
        transform
      >
        <div style={{
          fontFamily: "var(--font-barlow-condensed,'Barlow Condensed',sans-serif)",
          fontSize: 13,
          fontWeight: 800,
          color: GOLD,
          letterSpacing: "0.04em",
          lineHeight: 1.05,
          textAlign: "center",
          whiteSpace: "nowrap",
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
        }}>
          shumul<br />center
        </div>
      </Html>

      {/* Entrance canopy at ground */}
      <Box args={[W * 0.34, 0.12, 1.1]} position={[-W * 0.2, FH * 0.78, sideZ + 0.55]} color={FRAME} metalness={0.5} roughness={0.4} />

      {/* ── Rooftop ──────────────────────────────────────────── */}
      {/* Roof slab */}
      <Box args={[W, 0.18, D]} position={[0, BODY_H + 0.09, 0]} color={PLINTH} metalness={0.1} roughness={0.9} />

      {/* Blue padel court */}
      <Box args={[W * 0.42, 0.06, D * 0.72]} position={[-W * 0.22, BODY_H + 0.2, 0]} color={COURT} metalness={0.1} roughness={0.5} />
      {/* Court center net line */}
      <Box args={[W * 0.42, 0.08, 0.04]} position={[-W * 0.22, BODY_H + 0.25, 0]} color="#dfe7ee" metalness={0.1} roughness={0.6} />
      {/* Glass railing around court */}
      {[
        { a: [W * 0.42, 0.7, 0.04] as [number, number, number], p: [-W * 0.22, BODY_H + 0.5, D * 0.36] as [number, number, number] },
        { a: [W * 0.42, 0.7, 0.04] as [number, number, number], p: [-W * 0.22, BODY_H + 0.5, -D * 0.36] as [number, number, number] },
        { a: [0.04, 0.7, D * 0.72] as [number, number, number], p: [-W * 0.43, BODY_H + 0.5, 0] as [number, number, number] },
      ].map((r, i) => (
        <Box key={`rail${i}`} args={r.a} position={r.p} color="#9fb8c8" metalness={0.6} roughness={0.1} transparent opacity={0.35} />
      ))}

      {/* Solar panel array */}
      {Array.from({ length: 3 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <mesh
            key={`solar-${row}-${col}`}
            position={[W * 0.12 + col * 0.62, BODY_H + 0.28, -D * 0.28 + row * 0.62]}
            rotation={[-0.32, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.56, 0.04, 0.5]} />
            <meshStandardMaterial color={SOLAR} metalness={0.7} roughness={0.18} />
          </mesh>
        ))
      )}

      {/* HVAC units */}
      <Box args={[0.7, 0.5, 0.7]} position={[W * 0.05, BODY_H + 0.43, D * 0.22]} color="#9a9890" metalness={0.6} roughness={0.4} />
      <Box args={[0.6, 0.4, 0.6]} position={[W * 0.05, BODY_H + 0.38, -D * 0.02]} color="#8a8880" metalness={0.6} roughness={0.4} />

      {/* Floor labels */}
      {FLOORS.map((floor, i) => {
        const y = i < 3 ? FH * i + FH / 2 : BODY_H + 0.5;
        return (
          <Html
            key={floor.label}
            position={[W / 2 + 0.5, y, 0]}
            distanceFactor={11}
            occlude={false}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              whiteSpace: "nowrap", transform: "translateY(-50%)",
            }}>
              <div style={{ width: 16, height: 1.5, background: GOLD, flexShrink: 0 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  fontFamily: "var(--font-barlow-condensed,'Barlow Condensed',sans-serif)",
                  fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.08em",
                }}>
                  {floor.label}
                </span>
                <span style={{
                  fontFamily: "var(--font-barlow,'Barlow',sans-serif)",
                  fontSize: 8.5, color: "#D0DDE8",
                }}>
                  {floor.name}
                </span>
              </div>
            </div>
          </Html>
        );
      })}
    </group>
  );
}

/* ─── Landscaping ───────────────────────────────────────────── */
function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 1, 8]} />
        <meshStandardMaterial color="#6b5840" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color="#6f7d52" roughness={0.85} />
      </mesh>
    </group>
  );
}

/* ─── Canvas ─────────────────────────────────────────────────── */
export default function Building3D() {
  return (
    <Canvas
      camera={{ position: [11, 7, 13], fov: 42 }}
      shadows
      style={{ background: "#0D1520", width: "100%", height: "100%" }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
    >
      {/* Sky-toned ambient */}
      <ambientLight intensity={0.55} color="#cdd9e4" />
      <hemisphereLight
        args={["#dce8f2", "#2a2620", 0.7] as [THREE.ColorRepresentation, THREE.ColorRepresentation, number]}
      />
      {/* Warm key sun (upper-right, like the render) */}
      <directionalLight
        position={[12, 16, 9]}
        intensity={2.1}
        color="#fff3e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
      />
      <directionalLight position={[-9, 5, -7]} intensity={0.5} color="#8fb0c8" />

      {/* Ground plane — light paving */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.61, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#cfc7ba" roughness={0.95} metalness={0} />
      </mesh>

      <Building />
      <Tree x={-W / 2 - 1.2} z={D / 2 + 1.0} />
      <Tree x={W / 2 + 1.3} z={-D / 2 - 0.6} />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.45}
        enablePan={false}
        minDistance={9}
        maxDistance={30}
        maxPolarAngle={Math.PI * 0.5}
        target={[0, 2.2, 0]}
      />
    </Canvas>
  );
}
