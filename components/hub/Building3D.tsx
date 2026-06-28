"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

/* ─── Lazy-import OBJLoader (avoids bundler ESM issues) ─────── */
async function loadOBJ(url: string): Promise<THREE.Group> {
  const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
  return new Promise((resolve, reject) => {
    new OBJLoader().load(url, resolve, undefined, reject);
  });
}

/* ─── PBR materials (Shumul brand) ─────────────────────────── */
const MAT_STRUCTURE = new THREE.MeshStandardMaterial({
  color: "#2C3038", metalness: 0.2, roughness: 0.72,
});
const MAT_ACCENT = new THREE.MeshStandardMaterial({
  color: "#C76B4A", metalness: 0.05, roughness: 0.55,
});
const MAT_GLASS = new THREE.MeshStandardMaterial({
  color: "#5E8BA8", metalness: 0.88, roughness: 0.06,
  transparent: true, opacity: 0.48, side: THREE.DoubleSide,
});

/* ─── Floor labels ──────────────────────────────────────────── */
const FLOORS = [
  { label: "G",  name: "Café · Entrance · Hall" },
  { label: "1F", name: "Co-working · Meeting · Offices" },
  { label: "2F", name: "Studios · Radio · Edit Room" },
  { label: "RF", name: "Padel Court · Solar Array" },
];

/* ─── Scene inner (runs inside Canvas context) ──────────────── */
function Scene() {
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group | null>(null);
  const [ready, setReady] = useState(false);
  const [labelData, setLabelData] = useState<{ x: number; ys: number[] } | null>(null);
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    loadOBJ("/models/shumul-center.obj")
      .then((obj) => {
        if (cancelled) return;

        // Remove meshes with empty/NaN geometry (some usemtl groups produce them)
        const toRemove: THREE.Object3D[] = [];
        obj.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const pos = child.geometry?.attributes?.position;
          if (!pos || pos.count === 0 || !isFinite((pos.array as Float32Array)[0])) {
            toRemove.push(child);
          }
        });
        toRemove.forEach((m) => m.removeFromParent());

        // Apply PBR materials by matching Rhino material name fragments
        obj.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const mat = Array.isArray(child.material) ? child.material[0] : child.material;
          const name: string = (mat as THREE.Material)?.name ?? "";
          child.material = name.includes("191_63_63")
            ? MAT_ACCENT
            : name.includes("0_0_255")
            ? MAT_GLASS
            : MAT_STRUCTURE;
          child.castShadow = true;
          child.receiveShadow = true;
        });

        // Centre on XZ, bottom at y = 0, normalise longest horiz. dim to 12 units
        // Build box from valid meshes only; fallback to Python-analysed bounds
        const box = new THREE.Box3();
        obj.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const pos = child.geometry?.attributes?.position;
          if (!pos || pos.count === 0) return;
          const arr = pos.array as Float32Array;
          if (!isFinite(arr[0])) return;
          const cb = new THREE.Box3().setFromBufferAttribute(pos as THREE.BufferAttribute);
          if (isFinite(cb.min.x)) box.union(cb);
        });
        if (!isFinite(box.min.x)) {
          box.set(new THREE.Vector3(22.26, -3.20, -26.48),
                  new THREE.Vector3(60.73,  13.90,  34.98));
        }
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const SCALE  = 12 / Math.max(size.x, size.z);

        obj.scale.setScalar(SCALE);
        obj.position.set(
          -SCALE * center.x,
          -SCALE * box.min.y,
          -SCALE * center.z,
        );

        const halfW = (SCALE * size.x) / 2;
        const h     = SCALE * size.y;
        const ys    = FLOORS.map((_, i) => (0.12 + (i / (FLOORS.length - 1)) * 0.82) * h);

        groupRef.current = obj;
        scene.add(obj);
        setLabelData({ x: halfW + 0.35, ys });
        setReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[Building3D] load failed:", err);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      if (groupRef.current) scene.remove(groupRef.current);
    };
  }, [scene]);

  if (!ready) {
    return (
      <Html center>
        <div style={{
          color: status === "error" ? "#ff6b6b" : "#C9A96E",
          fontFamily: "monospace", fontSize: 12,
          letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          {status === "error" ? "model unavailable" : "loading model…"}
        </div>
      </Html>
    );
  }

  return (
    <>
      {labelData && FLOORS.map((floor, i) => (
        <Html
          key={floor.label}
          position={[labelData.x, labelData.ys[i], 0]}
          distanceFactor={14}
          occlude={false}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            whiteSpace: "nowrap", transform: "translateY(-50%)",
          }}>
            <div style={{ width: 16, height: 1.5, background: "#C9A96E", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                fontFamily: "var(--font-barlow-condensed,'Barlow Condensed',sans-serif)",
                fontSize: 10, fontWeight: 700, color: "#C9A96E", letterSpacing: "0.08em",
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
      ))}
    </>
  );
}

/* ─── Canvas ─────────────────────────────────────────────────── */
export default function Building3D() {
  return (
    <Canvas
      camera={{ position: [14, 5.5, 18], fov: 42 }}
      shadows
      style={{ background: "#0D1520", width: "100%", height: "100%" }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
    >
      <ambientLight intensity={0.38} color="#b8c8d8" />
      <hemisphereLight
        args={["#c8d8e8", "#0d1e2e", 0.5] as [THREE.ColorRepresentation, THREE.ColorRepresentation, number]}
      />
      <directionalLight
        position={[14, 18, 10]} intensity={1.9} castShadow
        color="#fff5e8"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18} shadow-camera-right={18}
        shadow-camera-top={18}  shadow-camera-bottom={-18}
        shadow-camera-near={0.5} shadow-camera-far={60}
      />
      <directionalLight position={[-8, 5, -8]} intensity={0.45} color="#6a9ab8" />
      <pointLight position={[0, 3, 5]} intensity={0.4} color="#C9A96E" distance={22} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0E1824" roughness={0.92} metalness={0.05} />
      </mesh>

      <Scene />

      <OrbitControls
        autoRotate autoRotateSpeed={0.38}
        enablePan={false}
        minDistance={7} maxDistance={32}
        maxPolarAngle={Math.PI * 0.56}
        target={[0, 2.5, 0]}
      />
    </Canvas>
  );
}
