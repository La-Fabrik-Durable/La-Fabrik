import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { WATER_SHADER_CONFIG } from "@/data/world/waterConfig";
import type { WaterSurfaceConfig } from "@/data/world/waterConfig";
import {
  WATER_FRAGMENT_SHADER,
  WATER_VERTEX_SHADER,
} from "@/world/water/waterShaders";

export function WaterSurface({
  position,
  renderOrder,
  rotation,
  size,
}: WaterSurfaceConfig): React.JSX.Element {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScale: { value: WATER_SHADER_CONFIG.scale },
      uSmoothness: { value: WATER_SHADER_CONFIG.smoothness },
      uEdgeThreshold: { value: WATER_SHADER_CONFIG.edgeThreshold },
      uEdgeSoftness: { value: WATER_SHADER_CONFIG.edgeSoftness },
      uFlowX: { value: WATER_SHADER_CONFIG.flowX },
      uFlowZ: { value: WATER_SHADER_CONFIG.flowZ },
      uCellSpeed: { value: WATER_SHADER_CONFIG.cellSpeed },
      uNoiseScale: { value: WATER_SHADER_CONFIG.noiseScale },
      uNoiseFlowSpeed: { value: WATER_SHADER_CONFIG.noiseFlowSpeed },
      uDistortAmount: { value: WATER_SHADER_CONFIG.distortAmount },
      uDeepColor: { value: new THREE.Color(WATER_SHADER_CONFIG.deepColor) },
      uMidColor: { value: new THREE.Color(WATER_SHADER_CONFIG.midColor) },
      uMidPos: { value: WATER_SHADER_CONFIG.midPos },
      uHighlight: {
        value: new THREE.Color(WATER_SHADER_CONFIG.highlightColor),
      },
      uOpacity: { value: WATER_SHADER_CONFIG.opacity },
      uDeepOpacity: { value: WATER_SHADER_CONFIG.deepOpacity },
    }),
    [],
  );

  useFrame(({ clock }) => {
    const uniform = materialRef.current?.uniforms.uTime;
    if (uniform) {
      uniform.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2 + rotation[0], rotation[1], rotation[2]]}
      renderOrder={renderOrder}
    >
      <planeGeometry args={size} />
      <shaderMaterial
        ref={materialRef}
        attach="material"
        depthTest
        depthWrite={false}
        fragmentShader={WATER_FRAGMENT_SHADER}
        side={THREE.FrontSide}
        transparent
        uniforms={uniforms}
        vertexShader={WATER_VERTEX_SHADER}
      />
    </mesh>
  );
}
