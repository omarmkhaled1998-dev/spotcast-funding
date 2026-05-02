"use client";

import { Canvas, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useState, useRef, useEffect } from "react";
import * as THREE from "three";

/* ─── Brand colors ─────────────────────────────────────────── */
const PINK = "#dd7c99";
const NAVY = "#0e2334";
const FACADE = "#2a3347";
const FACADE_HOVER = "#3a4a66";
const SLAB = "#3d4d66";
const GLASS = "#6a90b0";
const GLASS_ACTIVE = "#a0c8e8";
const BASEMENT = "#1a2234";
const BASEMENT_HOVER = "#253350";
const ROOF_BASE = "#1e2840";
const SOLAR = "#111d33";
const PADEL = "#1a4490";
const PADEL_ACTIVE = "#2266cc";
const GROUND = "#ccc8c0";
const WALL = "#9a9488";
const TREE_TRUNK = "#7a6040";
const TREE_LEAF = "#4a6840";

/* ─── Dimensions ───────────────────────────────────────────── */
const W = 5.0;   // building width
const D = 3.0;   // building depth
const FH = 0.78; // floor height

/* ─── Floor data ───────────────────────────────────────────── */
export interface FloorInfo {
  id: string;
  label: string;
  tag: string;
  yIndex: number;
  items: string[];
  tagColor: string;
}

export const FLOOR_DATA: FloorInfo[] = [
  {
    id: "roof",
    label: "Roof",
    tag: "Solar & Broadcast",
    yIndex: 3,
    tagColor: PINK,
    items: [
      "Solar PV panels + Battery ESS",
      "Radio broadcast antenna",
      "Rooftop padel court",
      "HVAC units & technical access",
    ],
  },
  {
    id: "second",
    label: "2nd Floor — Media",
    tag: "Media Production",
    yIndex: 2,
    tagColor: PINK,
    items: [
      "Broadcast-quality radio studio",
      "Podcast & video studios",
      "Editing suites & control room",
      "Director's suite with private facilities",
    ],
  },
  {
    id: "first",
    label: "1st Floor — Work",
    tag: "Work & Co-Working",
    yIndex: 1,
    tagColor: "#839ba3",
    items: [
      "10 private offices (Offices 1–10)",
      "Co-working space & Black Box room",
      "Large meeting room",
      "Kitchen, WC & shared services",
    ],
  },
  {
    id: "ground",
    label: "Ground Floor — Community",
    tag: "Community Hub",
    yIndex: 0,
    tagColor: "#839ba3",
    items: [
      "Multi-purpose event hall (~60 seats)",
      "Café with vegan & GF options",
      "Reception & main entrance",
      "Garden & outdoor plaza access",
    ],
  },
  {
    id: "b1",
    label: "Basement B1 — Services",
    tag: "Services & Parking",
    yIndex: -1,
    tagColor: "#839ba3",
    items: [
      "Parking for 20–30 cars (RFID gates)",
      "Server & IT infrastructure rooms",
      "Electrical distribution & battery storage",
      "Archives & maintenance rooms",
    ],
  },
  {
    id: "b2",
    label: "Basement B2 — Confidential",
    tag: "Safe & Confidential",
    yIndex: -2,
    tagColor: PINK,
    items: [
      "Psychosocial support session rooms",
      "SRHR program delivery spaces",
      "Case management & consultation offices",
      "No CCTV — fully confidential access",
    ],
  },
];

/* ─── Building geometry pieces ───────────────────────────────── */

function AboveGroundFloor({
  yIndex,
  isActive,
  isHovered,
  onClick,
  onHover,
}: {
  yIndex: number;
  isActive: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (v: boolean) => void;
}) {
  const yCenter = (yIndex + 0.5) * FH;
  const faceColor = isActive ? PINK : isHovered ? FACADE_HOVER : FACADE;

  return (
    <group position={[0, yCenter, 0]}>
      {/* Main facade volume */}
      <mesh
        onPointerEnter={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerLeave={(e) => { e.stopPropagation(); onHover(false); }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        castShadow
      >
        <boxGeometry args={[W, FH * 0.86, D]} />
        <meshStandardMaterial color={faceColor} roughness={0.65} metalness={0.35} />
      </mesh>

      {/* Glass window band — front face */}
      <mesh position={[0, 0, D / 2 + 0.008]}>
        <boxGeometry args={[W * 0.87, FH * 0.5, 0.05]} />
        <meshStandardMaterial
          color={isActive ? GLASS_ACTIVE : GLASS}
          roughness={0.05}
          metalness={0.9}
          transparent
          opacity={0.72}
        />
      </mesh>

      {/* Window band — back face */}
      <mesh position={[0, 0, -(D / 2 + 0.008)]}>
        <boxGeometry args={[W * 0.87, FH * 0.5, 0.05]} />
        <meshStandardMaterial
          color={isActive ? GLASS_ACTIVE : GLASS}
          roughness={0.05}
          metalness={0.9}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Vertical mullions on front */}
      {[-1.5, -0.75, 0, 0.75, 1.5].map((x) => (
        <mesh key={x} position={[x, 0, D / 2 + 0.012]}>
          <boxGeometry args={[0.06, FH * 0.88, 0.04]} />
          <meshStandardMaterial color={isActive ? "#ee99bb" : SLAB} roughness={0.5} metalness={0.6} />
        </mesh>
      ))}

      {/* Floor slab edge */}
      <mesh position={[0, FH * 0.44, 0]} receiveShadow>
        <boxGeometry args={[W + 0.18, 0.09, D + 0.18]} />
        <meshStandardMaterial color={SLAB} roughness={0.8} metalness={0.25} />
      </mesh>
    </group>
  );
}

function RoofLevel({ isActive, isHovered, onClick, onHover }: {
  isActive: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (v: boolean) => void;
}) {
  const y = 3 * FH;
  return (
    <group position={[0, y, 0]}>
      {/* Roof slab */}
      <mesh
        onPointerEnter={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerLeave={(e) => { e.stopPropagation(); onHover(false); }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        receiveShadow
      >
        <boxGeometry args={[W, 0.14, D]} />
        <meshStandardMaterial color={isActive ? PINK : isHovered ? "#253355" : ROOF_BASE} roughness={0.85} />
      </mesh>

      {/* Padel court surface */}
      <mesh position={[-W / 4 - 0.1, 0.1, 0]}>
        <boxGeometry args={[W / 2 - 0.1, 0.06, D - 0.3]} />
        <meshStandardMaterial color={isActive ? PADEL_ACTIVE : PADEL} roughness={0.45} />
      </mesh>

      {/* Solar panel array */}
      <mesh position={[W / 4 + 0.15, 0.18, 0.2]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[W / 2 - 0.2, 0.05, D / 2 + 0.2]} />
        <meshStandardMaterial color={SOLAR} roughness={0.25} metalness={0.85} />
      </mesh>

      {/* Glass railing — padel court perimeter */}
      {[
        { pos: [-(W / 4 + 0.1), 0.3, (D - 0.3) / 2] as [number,number,number], scale: [W / 2 - 0.1, 0.48, 0.04] as [number,number,number] },
        { pos: [-(W / 4 + 0.1), 0.3, -(D - 0.3) / 2] as [number,number,number], scale: [W / 2 - 0.1, 0.48, 0.04] as [number,number,number] },
        { pos: [-(W / 2 - 0.05), 0.3, 0] as [number,number,number], scale: [0.04, 0.48, D - 0.3] as [number,number,number] },
        { pos: [0.1, 0.3, 0] as [number,number,number], scale: [0.04, 0.48, D - 0.3] as [number,number,number] },
      ].map((r, i) => (
        <mesh key={i} position={r.pos}>
          <boxGeometry args={r.scale} />
          <meshStandardMaterial color="#8aaabb" transparent opacity={0.35} roughness={0.05} metalness={0.9} />
        </mesh>
      ))}

      {/* HVAC units */}
      {[[W / 3, 0.22, 0.4], [W / 3, 0.22, -0.5]] .map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.55, 0.38, 0.55]} />
          <meshStandardMaterial color="#3a4455" roughness={0.9} />
        </mesh>
      ))}

      {/* Antenna mast */}
      <mesh position={[-W / 2 + 0.4, 0.7, -D / 2 + 0.4]}>
        <cylinderGeometry args={[0.025, 0.025, 1.3, 6]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Parapet */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[W + 0.2, 0.32, D + 0.2]} />
        <meshStandardMaterial color={ROOF_BASE} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[W - 0.2, 0.32, D - 0.2]} />
        <meshStandardMaterial color={ROOF_BASE} roughness={0.8} />
        <primitive object={new THREE.MeshStandardMaterial({ color: ROOF_BASE, side: THREE.BackSide })} />
      </mesh>
    </group>
  );
}

function BasementFloor({
  yIndex,
  isActive,
  isHovered,
  onClick,
  onHover,
}: {
  yIndex: number;
  isActive: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (v: boolean) => void;
}) {
  const y = (yIndex + 0.5) * FH;
  return (
    <mesh
      position={[0, y, 0]}
      onPointerEnter={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerLeave={(e) => { e.stopPropagation(); onHover(false); }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <boxGeometry args={[W + 0.1, FH * 0.86, D + 0.1]} />
      <meshStandardMaterial
        color={isActive ? PINK : isHovered ? BASEMENT_HOVER : BASEMENT}
        roughness={0.8}
        metalness={0.4}
        transparent
        opacity={0.65}
      />
    </mesh>
  );
}

function PerimeterWall() {
  const h = 0.4;
  const t = 0.14;
  const sw = W + 2.8;
  const sd = D + 2.2;
  const y = h / 2 - FH * 0.43;
  return (
    <group>
      {[
        { p: [0, y, -sd / 2] as [number,number,number], s: [sw, h, t] as [number,number,number] },
        { p: [0, y, sd / 2] as [number,number,number], s: [sw, h, t] as [number,number,number] },
        { p: [-sw / 2, y, 0] as [number,number,number], s: [t, h, sd] as [number,number,number] },
        { p: [sw / 2, y, 0] as [number,number,number], s: [t, h, sd] as [number,number,number] },
      ].map((seg, i) => (
        <mesh key={i} position={seg.p}>
          <boxGeometry args={seg.s} />
          <meshStandardMaterial color={WALL} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function OliveTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.05, 0.09, 0.55, 6]} />
        <meshStandardMaterial color={TREE_TRUNK} roughness={1} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <sphereGeometry args={[0.42, 7, 5]} />
        <meshStandardMaterial color={TREE_LEAF} roughness={1} />
      </mesh>
    </group>
  );
}

function GroundPlane() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -FH * 0.43 + 0.001, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={GROUND} roughness={1} />
      </mesh>
      {/* Entrance plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -FH * 0.43 + 0.005, D / 2 + 0.8]}>
        <planeGeometry args={[W + 1, 1.8]} />
        <meshStandardMaterial color="#d8d4ca" roughness={0.9} />
      </mesh>
    </>
  );
}

/* ─── Scene ───────────────────────────────────────────────────── */

function BuildingScene({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[9, 14, 7]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 6, -4]} intensity={0.3} color="#aabbdd" />
      <hemisphereLight args={["#c8e0f0", "#c4bfb2", 0.45]} />

      <GroundPlane />

      {/* Above-ground floors */}
      {FLOOR_DATA.filter((f) => f.yIndex >= 0 && f.yIndex <= 2).map((f) => (
        <AboveGroundFloor
          key={f.id}
          yIndex={f.yIndex}
          isActive={activeId === f.id}
          isHovered={hoveredId === f.id}
          onClick={() => onSelect(activeId === f.id ? null : f.id)}
          onHover={(v) => setHoveredId(v ? f.id : null)}
        />
      ))}

      {/* Roof */}
      {(() => {
        const rf = FLOOR_DATA.find((f) => f.id === "roof")!;
        return (
          <RoofLevel
            isActive={activeId === "roof"}
            isHovered={hoveredId === "roof"}
            onClick={() => onSelect(activeId === "roof" ? null : "roof")}
            onHover={(v) => setHoveredId(v ? "roof" : null)}
          />
        );
      })()}

      {/* Basements */}
      {FLOOR_DATA.filter((f) => f.yIndex < 0).map((f) => (
        <BasementFloor
          key={f.id}
          yIndex={f.yIndex}
          isActive={activeId === f.id}
          isHovered={hoveredId === f.id}
          onClick={() => onSelect(activeId === f.id ? null : f.id)}
          onHover={(v) => setHoveredId(v ? f.id : null)}
        />
      ))}

      <PerimeterWall />
      <OliveTree position={[-2.2, -FH * 0.43, D / 2 + 1.0]} />
      <OliveTree position={[2.3, -FH * 0.43, D / 2 + 0.9]} />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.45}
        enablePan={false}
        maxPolarAngle={Math.PI * 0.6}
        minPolarAngle={Math.PI * 0.1}
        minDistance={8}
        maxDistance={20}
        makeDefault
      />
    </>
  );
}

/* ─── Export ──────────────────────────────────────────────────── */

export default function Building3D() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeFloor = FLOOR_DATA.find((f) => f.id === activeId);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 480 }}>
      <Canvas
        camera={{ position: [8.5, 5.5, 8.5], fov: 44, near: 0.1, far: 100 }}
        shadows
        dpr={[1, 2]}
        style={{ touchAction: "none", background: "transparent" }}
        onPointerMissed={() => setActiveId(null)}
      >
        <Suspense fallback={null}>
          <BuildingScene activeId={activeId} onSelect={setActiveId} />
        </Suspense>
      </Canvas>

      {/* Hint */}
      {!activeId && (
        <p
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs pointer-events-none select-none whitespace-nowrap"
          style={{ color: "rgba(131,155,163,0.8)", fontFamily: "monospace" }}
        >
          drag to rotate · click a floor to explore
        </p>
      )}

      {/* Floor info panel */}
      {activeFloor && (
        <div
          className="absolute bottom-0 left-0 right-0 px-5 py-4"
          style={{ background: "rgba(14,35,52,0.96)", borderTop: `2px solid ${PINK}` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span
                  className="text-xs tracking-widest uppercase"
                  style={{ fontFamily: "monospace", color: activeFloor.tagColor }}
                >
                  {activeFloor.tag}
                </span>
                <span className="text-sm font-bold text-white">{activeFloor.label}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                {activeFloor.items.map((item) => (
                  <p key={item} className="text-xs" style={{ color: "#839ba3" }}>
                    — {item}
                  </p>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveId(null)}
              className="text-xs shrink-0 transition-colors"
              style={{ fontFamily: "monospace", color: "#839ba3" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#839ba3")}
            >
              ✕ close
            </button>
          </div>
        </div>
      )}

      {/* Floor selector pills */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        {FLOOR_DATA.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveId(activeId === f.id ? null : f.id)}
            className="px-2 py-0.5 rounded text-xs transition-all"
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              background: activeId === f.id ? PINK : "rgba(14,35,52,0.75)",
              color: activeId === f.id ? "#fff" : "#839ba3",
              border: `1px solid ${activeId === f.id ? PINK : "rgba(131,155,163,0.3)"}`,
            }}
          >
            {f.label.split(" — ")[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
