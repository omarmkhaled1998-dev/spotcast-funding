"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

/* ─── Brand colors ─────────────────────────────────────────── */
const PINK = "#dd7c99";
const NAVY = "#0e2334";

/* ─── Real building model ──────────────────────────────────── */
function BuildingModel() {
  const obj = useLoader(OBJLoader, "/models/building.obj");

  const scene = useMemo(() => {
    const clone = obj.clone(true);

    // Compute bounding box to center and scale the model
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 7 / maxDim;

    clone.scale.setScalar(scale);
    clone.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );

    // Apply Shumul brand materials
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Differentiate by original material name for accent color
        const matName = Array.isArray(mesh.material)
          ? (mesh.material[0] as THREE.MeshStandardMaterial)?.name ?? ""
          : (mesh.material as THREE.MeshStandardMaterial)?.name ?? "";

        const isAccent = matName.includes("191") || matName.includes("63");
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(isAccent ? PINK : "#2a3a50"),
          roughness: 0.6,
          metalness: 0.15,
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return clone;
  }, [obj]);

  return <primitive object={scene} />;
}

/* ─── Loading spinner ──────────────────────────────────────── */
function Loader() {
  return (
    <mesh>
      <torusGeometry args={[0.4, 0.08, 16, 40]} />
      <meshStandardMaterial color={PINK} />
    </mesh>
  );
}

/* ─── Canvas ────────────────────────────────────────────────── */
export default function Building3D() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Loading overlay */}
      <div
        id="building-loading"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a1825",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: `3px solid ${PINK}33`,
            borderTop: `3px solid ${PINK}`,
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <p style={{ color: PINK, fontFamily: "monospace", fontSize: 11, marginTop: 12 }}>
          Loading 3D Model…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <Canvas
        camera={{ position: [12, 8, 12], fov: 42 }}
        shadows
        style={{ background: "#0a1825" }}
        onCreated={() => {
          const el = document.getElementById("building-loading");
          if (el) el.style.display = "none";
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 14, 8]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-6, 4, -6]} intensity={0.4} color="#839ba3" />

        <Suspense fallback={<Loader />}>
          <BuildingModel />
          <Environment preset="city" />
        </Suspense>

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.6, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#0d1e2e" roughness={1} />
        </mesh>

        <OrbitControls
          autoRotate
          autoRotateSpeed={0.5}
          enablePan={false}
          minDistance={6}
          maxDistance={22}
          maxPolarAngle={Math.PI * 0.58}
        />
      </Canvas>
    </div>
  );
}
