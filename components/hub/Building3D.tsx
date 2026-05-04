"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

const PINK = "#dd7c99";
const STEEL = "#2a3a50";
const GLASS = "#4a7a9b";
const GOLD = "#c9a84c";

const W = 3.0;   // building width
const D = 1.8;   // building depth
const fH = 0.72; // floor height

/* ─── Floor definitions ─────────────────────────────────────── */
const FLOORS = [
  { id: "b2",    label: "B2", name: "Safe & Confidential",    desc: "PSS · SRHR · Consultation Rooms",    color: "#0f1e2e", underground: true  },
  { id: "b1",    label: "B1", name: "Parking & Utilities",    desc: "20–30 Cars · Server Room · Battery",  color: "#142030", underground: true  },
  { id: "g",     label: "G",  name: "Entrance & Café",        desc: "Reception · Community Café · Lobby",  color: STEEL,      underground: false },
  { id: "f1",    label: "1F", name: "Event Hall",             desc: "Conferences · Trainings · Gatherings", color: "#233548", underground: false },
  { id: "f2",    label: "2F", name: "Media Studios",          desc: "Radio · Podcast · Video Production",  color: STEEL,      underground: false },
  { id: "f3",    label: "3F", name: "NGO Offices",            desc: "UN · INGO · Civil Society Offices",   color: "#233548", underground: false },
  { id: "f4",    label: "4F", name: "Co-working & Training",  desc: "Youth Programs · Hot Desks · Labs",   color: STEEL,      underground: false },
  { id: "roof",  label: "RF", name: "Rooftop",                desc: "Padel Court · Solar Array",            color: "#1a2e1a", underground: false },
];

// Ground is between B1 and Ground floor
// Floors are ordered bottom-up: B2=index 0, B1=1, G=2, ...
// y of bottom of B2 = 0 (we'll offset the group so ground is at y=0)
// B2: 0 → fH, center = fH/2
// B1: fH → 2fH, center = 1.5fH
// G:  2fH → 3fH, center = 2.5fH
// ...
// We shift whole group so ground plane (between B1 top and G bottom) = y=0
// Ground plane is at y = 2*fH from the bottom of B2
const GROUP_OFFSET_Y = -2 * fH;  // shift group down so ground = y=0

function floorCenterY(index: number) {
  return GROUP_OFFSET_Y + fH * index + fH / 2;
}

/* ─── Window strip ─────────────────────────────────────────── */
function WindowStrip({ y, z, count }: { y: number; z: number; count: number }) {
  const spacing = (W * 0.88) / count;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[-W * 0.44 + spacing * i + spacing / 2, y, z]}>
          <boxGeometry args={[spacing * 0.7, fH * 0.55, 0.04]} />
          <meshStandardMaterial color={GLASS} metalness={0.8} roughness={0.1} transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  );
}

/* ─── Single floor slab ─────────────────────────────────────── */
function FloorSlab({ index, floor }: { index: number; floor: typeof FLOORS[0] }) {
  const y = floorCenterY(index);
  const isRoof = floor.id === "roof";
  const fw = isRoof ? W * 0.82 : W;
  const fd = isRoof ? D * 0.82 : D;

  return (
    <group>
      {/* Main slab */}
      <mesh position={[0, y, 0]} castShadow receiveShadow>
        <boxGeometry args={[fw, fH * 0.92, fd]} />
        <meshStandardMaterial color={floor.color} metalness={0.25} roughness={0.65} />
      </mesh>

      {/* Windows (above-ground non-roof floors) */}
      {!floor.underground && !isRoof && (
        <>
          <WindowStrip y={y} z={fd / 2 + 0.02} count={4} />
          <WindowStrip y={y} z={-(fd / 2 + 0.02)} count={4} />
        </>
      )}

      {/* Underground — narrow vent slots */}
      {floor.underground && (
        <>
          {[-0.6, 0.6].map((x, i) => (
            <mesh key={i} position={[x, y, D / 2 + 0.02]}>
              <boxGeometry args={[0.35, fH * 0.15, 0.04]} />
              <meshStandardMaterial color="#1a3050" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </>
      )}

      {/* Floor label — Html overlay to the right */}
      <Html
        position={[W / 2 + 0.18, y, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
        distanceFactor={8}
        occlude={false}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            whiteSpace: "nowrap",
            transform: "translateY(-50%)",
          }}
        >
          {/* Connector line */}
          <div style={{ width: 14, height: 1, background: floor.underground ? "#4a6a8a" : PINK, marginTop: 7, flexShrink: 0 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: floor.underground ? "#4a6a8a" : PINK }}>
                {floor.label}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#c8d8e8", fontWeight: 600 }}>
                {floor.name}
              </span>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 7.5, color: "#607a8a", marginTop: 1 }}>
              {floor.desc}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ─── Full building ─────────────────────────────────────────── */
function Building() {
  const totalFloors = FLOORS.length;

  return (
    <group>
      {/* Floors */}
      {FLOORS.map((floor, i) => (
        <FloorSlab key={floor.id} index={i} floor={floor} />
      ))}

      {/* Facade fins — sides */}
      {[-W / 2 - 0.07, W / 2 + 0.07].map((x, si) =>
        Array.from({ length: 6 }).map((_, fi) => {
          const y = floorCenterY(fi + 2); // above-ground only
          return (
            <mesh key={`fin-${si}-${fi}`} position={[x, y, fi % 2 === 0 ? 0.25 : -0.25]} castShadow>
              <boxGeometry args={[0.07, fH * 0.82, D * 0.5]} />
              <meshStandardMaterial color={PINK} metalness={0.5} roughness={0.3} />
            </mesh>
          );
        })
      )}

      {/* Signage bar on 3F */}
      <mesh position={[0, floorCenterY(5) + 0.1, D / 2 + 0.09]} castShadow>
        <boxGeometry args={[W * 0.68, 0.16, 0.06]} />
        <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Ground-level entrance canopy */}
      <mesh position={[0, floorCenterY(2) - fH * 0.32, D / 2 + 0.38]} castShadow>
        <boxGeometry args={[W * 0.52, 0.06, 0.76]} />
        <meshStandardMaterial color={PINK} metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Rooftop solar panels */}
      {[-0.75, 0, 0.75].map((x, i) => (
        <group key={`solar-${i}`}>
          <mesh position={[x, floorCenterY(totalFloors - 1) + fH * 0.55, 0]}>
            <boxGeometry args={[0.52, 0.05, D * 0.68]} />
            <meshStandardMaterial color="#1a2a3a" metalness={0.6} roughness={0.2} />
          </mesh>
          {[-0.45, 0.45].map((z, j) => (
            <mesh key={j} position={[x, floorCenterY(totalFloors - 1) + fH * 0.6, z]}>
              <boxGeometry args={[0.5, 0.03, 0.36]} />
              <meshStandardMaterial color="#2255aa" metalness={0.7} roughness={0.15} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Padel court outline on roof */}
      <mesh position={[0, floorCenterY(totalFloors - 1) + fH * 0.5, 0]}>
        <boxGeometry args={[W * 0.48, 0.025, D * 0.72]} />
        <meshStandardMaterial color="#1a3322" roughness={0.9} />
      </mesh>
      {[-0.28, 0, 0.28].map((x, i) => (
        <mesh key={`line-${i}`} position={[x, floorCenterY(totalFloors - 1) + fH * 0.51, 0]}>
          <boxGeometry args={[0.015, 0.01, D * 0.68]} />
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </mesh>
      ))}

      {/* Perimeter wall (surface level) */}
      {([
        [[0, -0.38, D / 2 + 1.1], [W + 2.2, 0.65, 0.1]],
        [[0, -0.38, -(D / 2 + 1.1)], [W + 2.2, 0.65, 0.1]],
        [[W / 2 + 1.1, -0.38, 0], [0.1, 0.65, D + 2.2]],
        [[-(W / 2 + 1.1), -0.38, 0], [0.1, 0.65, D + 2.2]],
      ] as [[number, number, number], [number, number, number]][]).map(([pos, size], i) => (
        <mesh key={`wall-${i}`} position={pos} castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color="#162535" metalness={0.1} roughness={0.9} />
        </mesh>
      ))}

      {/* Underground indicator — dashed outline around basements */}
      <mesh position={[0, GROUP_OFFSET_Y + fH, 0]}>
        <boxGeometry args={[W + 0.15, fH * 2 + 0.04, D + 0.15]} />
        <meshStandardMaterial color="#1a3050" wireframe />
      </mesh>

      {/* "UNDERGROUND" label */}
      <Html position={[0, GROUP_OFFSET_Y + fH, -D / 2 - 0.1]} distanceFactor={8} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div style={{
          fontFamily: "monospace",
          fontSize: 7,
          color: "#3a5a7a",
          letterSpacing: 2,
          textTransform: "uppercase",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
        }}>
          ▼ underground ▼
        </div>
      </Html>
    </group>
  );
}

/* ─── Canvas ────────────────────────────────────────────────── */
export default function Building3D() {
  return (
    <Canvas
      camera={{ position: [11, 4, 11], fov: 44 }}
      shadows
      style={{ background: "#0a1825", width: "100%", height: "100%" }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#b8ccd8", "#0d1e2e", 0.55] as [THREE.ColorRepresentation, THREE.ColorRepresentation, number]} />
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
      <pointLight position={[0, 4, 4]} intensity={0.5} color={PINK} distance={18} />

      {/* Ground plane (surface) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0d1e2e" roughness={1} />
      </mesh>

      {/* Underground earth fill */}
      <mesh position={[0, -fH - 0.01, 0]}>
        <boxGeometry args={[W + 0.5, fH * 2, D + 0.5]} />
        <meshStandardMaterial color="#0a1620" roughness={1} />
      </mesh>

      {/* Ground grid */}
      {[-4, -2, 0, 2, 4].map((v) => (
        <group key={v}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[v, 0.001, 0]}>
            <planeGeometry args={[0.01, 14]} />
            <meshStandardMaterial color="#1a3050" roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, v]}>
            <planeGeometry args={[14, 0.01]} />
            <meshStandardMaterial color="#1a3050" roughness={1} />
          </mesh>
        </group>
      ))}

      <Building />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.55}
        enablePan={false}
        minDistance={6}
        maxDistance={22}
        maxPolarAngle={Math.PI * 0.6}
        target={[0, 1.5, 0]}
      />
    </Canvas>
  );
}
