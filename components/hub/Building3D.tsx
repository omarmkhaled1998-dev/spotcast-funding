"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

/* ─── Material palette (matched to architectural render) ───── */
const STEEL    = "#2E3238";  // dark bronze-charcoal exoskeleton
const STEEL_D  = "#22252A";  // deep frame shadow
const GLASS    = "#41586A";  // tinted Low-E curtain glass
const GLASS_HI = "#6E8CA0";  // sky reflection tint
const TAUPE    = "#8A8177";  // solid facade panels
const CONCRETE = "#C9C1B2";  // plinth / retaining walls
const PAVING   = "#D3CCBE";  // site paving
const GOLD     = "#C9A96E";  // signage
const COURT    = "#2563AE";  // padel court
const COURT_LN = "#E8EDF2";  // court lines
const SOLAR    = "#101F33";  // PV cells
const LEAF     = "#6F7D52";  // olive foliage
const TRUNK    = "#6B5840";

/* ─── Dimensions ────────────────────────────────────────────── */
const W  = 7.4;             // building width  (X)
const D  = 4.4;             // building depth  (Z)
const FH = 1.62;            // floor height
const NF = 3;               // floors above ground
const H  = FH * NF;         // body height

const FLOORS = [
  { label: "G",  name: "Café · Entrance · Hall" },
  { label: "1F", name: "Co-working · Meeting · Offices" },
  { label: "2F", name: "Studios · Radio · Edit Suite" },
  { label: "RF", name: "Padel Court · Solar Array" },
];

/* ─── Primitive helper ──────────────────────────────────────── */
type BoxProps = {
  a: [number, number, number];
  p: [number, number, number];
  c: string;
  m?: number;
  r?: number;
  t?: boolean;
  o?: number;
  rot?: [number, number, number];
};
function B({ a, p, c, m = 0.25, r = 0.65, t = false, o = 1, rot }: BoxProps) {
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={a} />
      <meshStandardMaterial
        color={c} metalness={m} roughness={r}
        transparent={t} opacity={o}
        {...(t ? { side: THREE.DoubleSide, depthWrite: false } : {})}
      />
    </mesh>
  );
}

/* ─── Glazed facade with recessed bays (front/back) ────────── */
function Facade({ z, dir }: { z: number; dir: 1 | -1 }) {
  const bays = 5;
  const bayW = (W - 0.3) / bays;
  return (
    <group>
      {/* Recessed glass panels per floor & bay */}
      {Array.from({ length: NF }).map((_, f) =>
        Array.from({ length: bays }).map((_, b) => (
          <B
            key={`g${f}-${b}`}
            a={[bayW - 0.24, FH - 0.42, 0.05]}
            p={[-W / 2 + 0.15 + bayW * (b + 0.5), FH * f + FH / 2 + 0.05, z - dir * 0.16]}
            c={f === 2 ? GLASS_HI : GLASS}
            m={0.9} r={0.06} t o={0.62}
          />
        ))
      )}
      {/* Deep vertical mullion fins */}
      {Array.from({ length: bays + 1 }).map((_, i) => (
        <B
          key={`m${i}`}
          a={[0.14, H + 0.1, 0.5]}
          p={[-W / 2 + 0.15 + bayW * i, H / 2, z - dir * 0.05]}
          c={STEEL} m={0.55} r={0.35}
        />
      ))}
      {/* Spandrel bands at each slab line */}
      {Array.from({ length: NF + 1 }).map((_, i) => (
        <B
          key={`s${i}`}
          a={[W + 0.05, i === 0 ? 0.5 : 0.34, 0.42]}
          p={[0, i * FH + (i === 0 ? 0.02 : 0.02), z]}
          c={i === 0 ? CONCRETE : STEEL} m={0.35} r={0.5}
        />
      ))}
    </group>
  );
}

/* ─── Corner portal frames (the render's signature steel) ──── */
function PortalFrames() {
  const fx = W / 2 + 0.14;
  const fz = D / 2 + 0.14;
  const beamY = H + 0.28;
  return (
    <group>
      {/* Corner columns */}
      {[[-fx, -fz], [fx, -fz], [-fx, fz], [fx, fz]].map(([x, z], i) => (
        <B key={`c${i}`} a={[0.34, H + 0.62, 0.34]} p={[x, (H + 0.62) / 2, z]} c={STEEL_D} m={0.55} r={0.32} />
      ))}
      {/* Roof edge beams connecting columns */}
      <B a={[W + 0.7, 0.3, 0.3]} p={[0, beamY, fz]}  c={STEEL_D} m={0.55} r={0.32} />
      <B a={[W + 0.7, 0.3, 0.3]} p={[0, beamY, -fz]} c={STEEL_D} m={0.55} r={0.32} />
      <B a={[0.3, 0.3, D + 0.7]} p={[fx, beamY, 0]}  c={STEEL_D} m={0.55} r={0.32} />
      <B a={[0.3, 0.3, D + 0.7]} p={[-fx, beamY, 0]} c={STEEL_D} m={0.55} r={0.32} />
      {/* Intermediate facade fins */}
      {[-W / 6, W / 6].map((x, i) => (
        <group key={`f${i}`}>
          <B a={[0.24, H + 0.5, 0.42]} p={[x, (H + 0.5) / 2, fz]}  c={STEEL} m={0.5} r={0.35} />
          <B a={[0.24, H + 0.5, 0.42]} p={[x, (H + 0.5) / 2, -fz]} c={STEEL} m={0.5} r={0.35} />
        </group>
      ))}
    </group>
  );
}

/* ─── Rooftop program ───────────────────────────────────────── */
function Roof() {
  const y = H;
  const courtW = 3.1, courtD = 3.4;
  const courtX = -W / 2 + courtW / 2 + 0.35;
  return (
    <group>
      {/* Roof slab + parapet */}
      <B a={[W, 0.22, D]} p={[0, y + 0.11, 0]} c={CONCRETE} m={0.1} r={0.9} />
      {[[0, D / 2], [0, -D / 2]].map(([x, z], i) => (
        <B key={`pp${i}`} a={[W, 0.32, 0.1]} p={[x, y + 0.36, z]} c={TAUPE} m={0.2} r={0.7} />
      ))}
      {[[W / 2, 0], [-W / 2, 0]].map(([x, z], i) => (
        <B key={`ps${i}`} a={[0.1, 0.32, D]} p={[x, y + 0.36, z]} c={TAUPE} m={0.2} r={0.7} />
      ))}

      {/* ── Padel court ── */}
      <B a={[courtW, 0.06, courtD]} p={[courtX, y + 0.26, 0]} c={COURT} m={0.05} r={0.55} />
      {/* Court lines */}
      <B a={[courtW, 0.012, 0.05]} p={[courtX, y + 0.3, 0]} c={COURT_LN} r={0.8} />
      <B a={[0.05, 0.012, courtD]} p={[courtX, y + 0.3, 0]} c={COURT_LN} r={0.8} />
      <B a={[courtW - 0.1, 0.012, 0.05]} p={[courtX, y + 0.3, courtD / 2 - 0.05]} c={COURT_LN} r={0.8} />
      <B a={[courtW - 0.1, 0.012, 0.05]} p={[courtX, y + 0.3, -courtD / 2 + 0.05]} c={COURT_LN} r={0.8} />
      {/* Net */}
      <B a={[courtW - 0.15, 0.34, 0.02]} p={[courtX, y + 0.48, 0]} c="#3a4148" m={0.3} r={0.6} t o={0.65} />
      <B a={[0.05, 0.5, 0.05]} p={[courtX - courtW / 2 + 0.08, y + 0.5, 0]} c={STEEL_D} m={0.5} r={0.4} />
      <B a={[0.05, 0.5, 0.05]} p={[courtX + courtW / 2 - 0.08, y + 0.5, 0]} c={STEEL_D} m={0.5} r={0.4} />
      {/* Glass surround */}
      {[courtD / 2 + 0.12, -(courtD / 2 + 0.12)].map((z, i) => (
        <B key={`cg${i}`} a={[courtW + 0.24, 1.0, 0.04]} p={[courtX, y + 0.78, z]} c="#AFC6D6" m={0.7} r={0.08} t o={0.32} />
      ))}
      <B a={[0.04, 1.0, courtD + 0.24]} p={[courtX - courtW / 2 - 0.12, y + 0.78, 0]} c="#AFC6D6" m={0.7} r={0.08} t o={0.32} />
      <B a={[0.04, 1.0, courtD + 0.24]} p={[courtX + courtW / 2 + 0.12, y + 0.78, 0]} c="#AFC6D6" m={0.7} r={0.08} t o={0.32} />

      {/* ── Solar array ── (2 rows × 3 tilted panels) */}
      {Array.from({ length: 2 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => (
          <group key={`pv${row}-${col}`}>
            <B
              a={[0.86, 0.045, 0.72]}
              p={[W / 2 - 2.35 + col * 0.95, y + 0.52, -D / 2 + 0.85 + row * 1.05]}
              c={SOLAR} m={0.75} r={0.15}
              rot={[-0.42, 0, 0]}
            />
            <B a={[0.05, 0.24, 0.05]} p={[W / 2 - 2.35 + col * 0.95, y + 0.34, -D / 2 + 1.0 + row * 1.05]} c={STEEL} m={0.5} r={0.4} />
          </group>
        ))
      )}

      {/* HVAC + plant */}
      <B a={[0.85, 0.6, 0.85]} p={[W / 2 - 1.15, y + 0.52, D / 2 - 0.95]} c="#9C9A92" m={0.55} r={0.45} />
      <B a={[0.6, 0.42, 0.6]}  p={[W / 2 - 2.1, y + 0.43, D / 2 - 0.85]} c="#8D8B83" m={0.55} r={0.45} />
      <B a={[0.5, 0.85, 0.5]}  p={[W / 2 - 0.65, y + 0.65, -D / 2 + 0.65]} c={TAUPE} m={0.25} r={0.65} />
    </group>
  );
}

/* ─── Signage pillar with gold lettering ────────────────────── */
function Signage() {
  const x = W / 6 + (W / 2 - W / 6) / 2 - 0.55;
  return (
    <group>
      <B a={[1.15, H + 0.4, 0.16]} p={[x, (H + 0.4) / 2, D / 2 + 0.22]} c={TAUPE} m={0.25} r={0.6} />
      <Html
        position={[x, H / 2 + 0.15, D / 2 + 0.32]}
        distanceFactor={7.5}
        occlude={false}
        transform
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{
          fontFamily: "var(--font-barlow-condensed),'Barlow Condensed',sans-serif",
          fontWeight: 800,
          fontSize: 30,
          lineHeight: 1.02,
          color: GOLD,
          letterSpacing: "0.03em",
          textAlign: "center",
          transform: "rotate(-90deg)",
          whiteSpace: "nowrap",
          textShadow: "0 1px 3px rgba(0,0,0,0.45)",
        }}>
          shumul&nbsp;center
        </div>
      </Html>
    </group>
  );
}

/* ─── Entrance ──────────────────────────────────────────────── */
function Entrance() {
  const x = -W / 4;
  return (
    <group>
      {/* Canopy */}
      <B a={[2.3, 0.14, 1.25]} p={[x, FH - 0.12, D / 2 + 0.62]} c={STEEL} m={0.5} r={0.35} />
      {/* Canopy ties */}
      {[-0.85, 0.85].map((dx, i) => (
        <B key={i} a={[0.06, 0.9, 0.06]} p={[x + dx, FH + 0.3, D / 2 + 1.1]} c={STEEL_D} m={0.5} r={0.35}
           rot={[0.5, 0, 0]} />
      ))}
      {/* Steps */}
      <B a={[2.5, 0.12, 0.9]} p={[x, 0.06, D / 2 + 0.65]} c={CONCRETE} m={0.05} r={0.9} />
      <B a={[2.8, 0.1, 1.25]} p={[x, -0.05, D / 2 + 0.85]} c={CONCRETE} m={0.05} r={0.9} />
      {/* Door glass */}
      <B a={[1.7, FH - 0.5, 0.05]} p={[x, (FH - 0.4) / 2, D / 2 + 0.02]} c={GLASS} m={0.9} r={0.05} t o={0.7} />
    </group>
  );
}

/* ─── Landscape ─────────────────────────────────────────────── */
function OliveTree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.11, 1.1, 7]} />
        <meshStandardMaterial color={TRUNK} roughness={0.95} />
      </mesh>
      {[[0, 1.35, 0, 0.52], [0.3, 1.15, 0.15, 0.34], [-0.28, 1.2, -0.12, 0.3]].map(([dx, dy, dz, r], i) => (
        <mesh key={i} position={[dx, dy, dz]} castShadow>
          <sphereGeometry args={[r, 10, 10]} />
          <meshStandardMaterial color={LEAF} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Shrub({ x, z, r = 0.22 }: { x: number; z: number; r?: number }) {
  return (
    <mesh position={[x, r * 0.75, z]} castShadow>
      <sphereGeometry args={[r, 8, 8]} />
      <meshStandardMaterial color="#7d8a5e" roughness={0.92} />
    </mesh>
  );
}

function Landscape() {
  return (
    <group>
      {/* Site retaining wall */}
      {([
        [[0, 0.28, D / 2 + 3.1], [W + 6.5, 0.55, 0.18]],
        [[0, 0.28, -(D / 2 + 3.1)], [W + 6.5, 0.55, 0.18]],
        [[W / 2 + 3.2, 0.28, 0], [0.18, 0.55, D + 6.2]],
        [[-(W / 2 + 3.2), 0.28, 0], [0.18, 0.55, D + 6.2]],
      ] as [ [number, number, number], [number, number, number] ][]).map(([p, a], i) => (
        <B key={`w${i}`} a={a} p={p} c={CONCRETE} m={0.05} r={0.92} />
      ))}

      {/* Planting beds */}
      <B a={[2.6, 0.3, 1.5]} p={[-(W / 2 + 1.6), 0.15, D / 2 + 1.7]} c="#B5AB99" m={0.05} r={0.95} />
      <B a={[3.2, 0.3, 1.4]} p={[W / 2 + 1.4, 0.15, -(D / 2 + 1.5)]} c="#B5AB99" m={0.05} r={0.95} />

      <OliveTree x={-(W / 2 + 1.6)} z={D / 2 + 1.7} s={1.15} />
      <OliveTree x={W / 2 + 1.9} z={-(D / 2 + 1.4)} s={0.9} />
      <Shrub x={W / 2 + 0.8} z={-(D / 2 + 1.6)} r={0.26} />
      <Shrub x={W / 2 + 2.6} z={-(D / 2 + 1.2)} r={0.2} />
      <Shrub x={-(W / 2 + 2.4)} z={D / 2 + 1.4} r={0.18} />
    </group>
  );
}

/* ─── Floor annotations ─────────────────────────────────────── */
function FloorLabels() {
  return (
    <group>
      {FLOORS.map((f, i) => {
        const y = i < NF ? FH * i + FH / 2 : H + 0.55;
        return (
          <Html
            key={f.label}
            position={[W / 2 + 0.55, y, 0]}
            distanceFactor={9}
            occlude={false}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              whiteSpace: "nowrap", transform: "translateY(-50%)",
            }}>
              <div style={{ width: 20, height: 1.5, background: GOLD, flexShrink: 0, opacity: 0.9 }} />
              <span style={{
                fontFamily: "var(--font-barlow-condensed),'Barlow Condensed',sans-serif",
                fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.1em",
              }}>
                {f.label}
              </span>
              <span style={{
                fontFamily: "var(--font-barlow),'Barlow',sans-serif",
                fontSize: 9, fontWeight: 500, color: "#3D362F", opacity: 0.85,
              }}>
                {f.name}
              </span>
            </div>
          </Html>
        );
      })}
    </group>
  );
}

/* ─── Building assembly ─────────────────────────────────────── */
function Building() {
  return (
    <group>
      {/* Podium plinth */}
      <B a={[W + 2.2, 0.42, D + 2.2]} p={[0, -0.21, 0]} c={CONCRETE} m={0.05} r={0.92} />

      {/* Core mass */}
      <B a={[W - 0.25, H, D - 0.25]} p={[0, H / 2, 0]} c={STEEL_D} m={0.2} r={0.72} />

      {/* Side walls: taupe panels + glazing strip */}
      {[-W / 2, W / 2].map((x, i) => (
        <group key={i}>
          <B a={[0.14, H, D]} p={[x, H / 2, 0]} c={TAUPE} m={0.22} r={0.68} />
          <B a={[0.16, H - 0.7, D * 0.42]} p={[x, H / 2, -D * 0.16]} c={GLASS} m={0.88} r={0.07} t o={0.55} />
        </group>
      ))}

      <Facade z={D / 2} dir={1} />
      <Facade z={-D / 2} dir={-1} />
      <PortalFrames />
      <Signage />
      <Entrance />
      <Roof />
      <FloorLabels />
    </group>
  );
}

/* ─── Scene ─────────────────────────────────────────────────── */
export default function Building3D() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [14.5, 8.5, 15.5], fov: 37 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.12,
      }}
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #AEC3D2 0%, #D9DCD3 55%, #CFC7B6 100%)",
      }}
    >
      <fog attach="fog" args={["#D9DCD3", 34, 68]} />

      {/* Daylight rig */}
      <ambientLight intensity={0.5} color="#dfe8ef" />
      <hemisphereLight
        args={["#e8f0f6", "#8f8574", 0.65] as [THREE.ColorRepresentation, THREE.ColorRepresentation, number]}
      />
      <directionalLight
        position={[13, 17, 9]}
        intensity={2.0}
        color="#fff2df"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={55}
      />
      <directionalLight position={[-9, 6, -8]} intensity={0.45} color="#9db4c6" />

      {/* Paving */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color={PAVING} roughness={0.96} metalness={0} />
      </mesh>

      <Building />
      <Landscape />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.45}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={10}
        maxDistance={30}
        maxPolarAngle={Math.PI * 0.49}
        target={[0, 2.4, 0]}
      />
    </Canvas>
  );
}
