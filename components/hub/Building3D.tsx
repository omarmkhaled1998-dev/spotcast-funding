"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";

/* ─── PBR materials (Shumul brand palette) ─────────────────── */
const MAT_STRUCTURE = new THREE.MeshStandardMaterial({
  color: "#2C3038",   // dark charcoal concrete — main façade
  metalness: 0.2,
  roughness: 0.72,
  envMapIntensity: 0.5,
});

const MAT_ACCENT = new THREE.MeshStandardMaterial({
  color: "#C76B4A",   // terracotta — staircase / Shumul accent
  metalness: 0.05,
  roughness: 0.55,
});

const MAT_GLASS = new THREE.MeshStandardMaterial({
  color: "#5E8BA8",   // dark tinted glass
  metalness: 0.88,
  roughness: 0.06,
  transparent: true,
  opacity: 0.48,
  side: THREE.DoubleSide,
  envMapIntensity: 1.2,
});

/* ─── Floor annotations ─────────────────────────────────────── */
const FLOORS = [
  { label: "G",  name: "Café · Entrance · Hall" },
  { label: "1F", name: "Co-working · Meeting · Offices" },
  { label: "2F", name: "Studios · Radio · Edit Room" },
  { label: "RF", name: "Padel Court · Solar Array" },
];

const GOLD  = "#C9A96E";
const CREAM = "#D0DDE8";

/* ─── Model ─────────────────────────────────────────────────── */
function BuildingModel() {
  const raw = useLoader(OBJLoader, "/models/shumul-center.obj");

  const { group, height, halfWidth } = useMemo(() => {
    const g = raw.clone(true);

    // Apply PBR materials — match on Rhino material name fragments
    g.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = Array.isArray(child.material) ? child.material[0] : child.material;
      const name: string = (mat as THREE.Material)?.name ?? "";
      if (name.includes("191_63_63")) {
        child.material = MAT_ACCENT;
      } else if (name.includes("0_0_255")) {
        child.material = MAT_GLASS;
      } else {
        child.material = MAT_STRUCTURE;
      }
      child.castShadow = true;
      child.receiveShadow = true;
    });

    // Normalize: center on XZ, bottom at y = 0
    const box = new THREE.Box3().setFromObject(g);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const SCALE  = 12 / Math.max(size.x, size.z);

    g.scale.setScalar(SCALE);
    g.position.set(
      -SCALE * center.x,
      -SCALE * box.min.y,
      -SCALE * center.z,
    );

    return {
      group:     g,
      height:    SCALE * size.y,
      halfWidth: SCALE * size.x * 0.5,
    };
  }, [raw]);

  // Distribute floor labels evenly (skip basement region, top at roof)
  const labelYs = FLOORS.map((_, i) =>
    (0.12 + (i / (FLOORS.length - 1)) * 0.82) * height
  );
  const labelX = halfWidth + 0.35;

  return (
    <group>
      <primitive object={group} />

      {FLOORS.map((floor, i) => (
        <Html
          key={floor.label}
          position={[labelX, labelYs[i], 0]}
          distanceFactor={14}
          occlude={false}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
            transform: "translateY(-50%)",
          }}>
            <div style={{ width: 16, height: 1.5, background: GOLD, flexShrink: 0 }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  fontFamily: "var(--font-barlow-condensed,'Barlow Condensed',sans-serif)",
                  fontSize: 10,
                  fontWeight: 700,
                  color: GOLD,
                  letterSpacing: "0.08em",
                }}>
                  {floor.label}
                </span>
                <span style={{
                  fontFamily: "var(--font-barlow,'Barlow',sans-serif)",
                  fontSize: 8.5,
                  color: CREAM,
                  fontWeight: 400,
                }}>
                  {floor.name}
                </span>
              </div>
            </div>
          </div>
        </Html>
      ))}
    </group>
  );
}

/* ─── Loading fallback ──────────────────────────────────────── */
function Loader() {
  return (
    <Html center>
      <div style={{
        color: GOLD,
        fontFamily: "monospace",
        fontSize: 12,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        opacity: 0.7,
      }}>
        loading model…
      </div>
    </Html>
  );
}

/* ─── Canvas ────────────────────────────────────────────────── */
export default function Building3D() {
  return (
    <Canvas
      camera={{ position: [14, 5.5, 18], fov: 42 }}
      shadows
      style={{ background: "#0D1520", width: "100%", height: "100%" }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
    >
      {/* Sky + ambient */}
      <ambientLight intensity={0.38} color="#b8c8d8" />
      <hemisphereLight
        args={["#c8d8e8", "#0d1e2e", 0.5] as [THREE.ColorRepresentation, THREE.ColorRepresentation, number]}
      />

      {/* Key sun from upper-right (matches render) */}
      <directionalLight
        position={[14, 18, 10]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        color="#fff5e8"
      />
      {/* Soft fill from opposite side */}
      <directionalLight position={[-8, 5, -8]} intensity={0.45} color="#6a9ab8" />
      {/* Gold accent glow (signage / brand warmth) */}
      <pointLight position={[0, 3, 5]} intensity={0.4} color="#C9A96E" distance={22} />

      {/* Ground plane — dark concrete apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0E1824" roughness={0.92} metalness={0.05} />
      </mesh>

      <Suspense fallback={<Loader />}>
        <BuildingModel />
      </Suspense>

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.38}
        enablePan={false}
        minDistance={7}
        maxDistance={32}
        maxPolarAngle={Math.PI * 0.56}
        target={[0, 2.5, 0]}
      />
    </Canvas>
  );
}
