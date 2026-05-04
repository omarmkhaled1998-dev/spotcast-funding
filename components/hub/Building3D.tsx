"use client";

import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const PINK = "#dd7c99";

function BuildingModel({ onLoaded }: { onLoaded: () => void }) {
  const obj = useLoader(OBJLoader, "/models/building.obj");
  const { scene: threeScene } = useThree();

  const mesh = useMemo(() => {
    const clone = obj.clone(true);

    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 7 / maxDim : 1;
    const center = box.getCenter(new THREE.Vector3());

    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        const matName = Array.isArray(m.material)
          ? (m.material[0] as THREE.MeshStandardMaterial)?.name ?? ""
          : (m.material as THREE.MeshStandardMaterial)?.name ?? "";
        const isAccent = matName.includes("191") || matName.includes("63");
        m.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(isAccent ? PINK : "#2a3a50"),
          roughness: 0.55,
          metalness: 0.2,
        });
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });

    return clone;
  }, [obj]);

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  // ignore unused warning
  void threeScene;

  return <primitive object={mesh} />;
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#c8d8e8", "#0d1e2e", 0.5]} />
      <directionalLight position={[10, 14, 8]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 4, -6]} intensity={0.5} color="#839ba3" />
      <pointLight position={[0, 6, 0]} intensity={0.4} color={PINK} distance={20} />
    </>
  );
}

export default function Building3D() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Loading overlay — visible until model resolves */}
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a1825",
            zIndex: 2,
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
      )}

      <Canvas camera={{ position: [12, 8, 12], fov: 42 }} shadows style={{ background: "#0a1825" }}>
        <SceneLights />

        {/* Ground plane always visible */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.6, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#0d1e2e" roughness={1} />
        </mesh>

        <Suspense fallback={null}>
          <BuildingModel onLoaded={() => setLoaded(true)} />
        </Suspense>

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
