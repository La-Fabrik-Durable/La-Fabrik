import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useWind } from "@/hooks/world/useWind";
import { GRASS_COLORS, GRASS_CONFIG } from "@/world/grass/grassConfig";
import {
  grassFragmentShader,
  grassVertexShader,
} from "@/world/grass/grassShaders";
import type { TerrainGrassSampler } from "@/world/grass/useTerrainGrassSampler";

interface GrassPatchProps {
  chunkX: number;
  chunkZ: number;
  density: number;
  terrainSampler: TerrainGrassSampler;
}

function random01(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function createGrassMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPlayerPosition: { value: new THREE.Vector3() },
      uPatchSize: { value: GRASS_CONFIG.chunkSize },
      uBladeWidth: { value: GRASS_CONFIG.bladeWidth },
      uWindDirection: { value: 0 },
      uWindSpeed: { value: 0 },
      uWindNoiseScale: { value: GRASS_CONFIG.windNoiseScale },
      uBaldPatchModifier: { value: GRASS_CONFIG.baldPatchModifier },
      uFalloffSharpness: { value: GRASS_CONFIG.falloffSharpness },
      uHeightNoiseFrequency: { value: GRASS_CONFIG.heightNoiseFrequency },
      uHeightNoiseAmplitude: { value: GRASS_CONFIG.heightNoiseAmplitude },
      uMaxBendAngle: { value: GRASS_CONFIG.maxBendAngle },
      uMaxBladeHeight: { value: GRASS_CONFIG.maxBladeHeight },
      uRandomHeightAmount: { value: GRASS_CONFIG.randomHeightAmount },
    },
  });
}

function pushVector(target: number[], value: THREE.Vector3): void {
  target.push(value.x, value.y, value.z);
}

function pushColor(target: number[], value: THREE.Color): void {
  target.push(value.r, value.g, value.b);
}

function addGrassBlade(
  positions: number[],
  bladeColors: number[],
  bladeBases: number[],
  bladeNormals: number[],
  sideFactors: number[],
  tipFactors: number[],
  randoms: number[],
  yaws: number[],
  basePosition: THREE.Vector3,
  normal: THREE.Vector3,
  color: THREE.Color,
  yaw: THREE.Vector3,
  random: number,
): void {
  const vertices = [
    { side: 1, tip: 0 },
    { side: -1, tip: 0 },
    { side: 0, tip: 1 },
  ];

  for (const vertex of vertices) {
    pushVector(positions, basePosition);
    pushColor(bladeColors, color);
    pushVector(bladeBases, basePosition);
    pushVector(bladeNormals, normal);
    pushVector(yaws, yaw);
    sideFactors.push(vertex.side);
    tipFactors.push(vertex.tip);
    randoms.push(random);
  }
}

function createGrassGeometry(
  chunkX: number,
  chunkZ: number,
  density: number,
  terrainSampler: TerrainGrassSampler,
): THREE.BufferGeometry | null {
  const positions: number[] = [];
  const bladeColors: number[] = [];
  const bladeBases: number[] = [];
  const bladeNormals: number[] = [];
  const sideFactors: number[] = [];
  const tipFactors: number[] = [];
  const randoms: number[] = [];
  const yaws: number[] = [];
  const startX = chunkX * GRASS_CONFIG.chunkSize;
  const startZ = chunkZ * GRASS_CONFIG.chunkSize;
  const bladeCount = Math.round(GRASS_CONFIG.baseBladesPerChunk * density);

  for (let index = 0; index < bladeCount; index++) {
    const seed = (chunkX + 101) * 92821 + (chunkZ + 103) * 68917 + index * 997;
    const x = startX + random01(seed + 1) * GRASS_CONFIG.chunkSize;
    const z = startZ + random01(seed + 2) * GRASS_CONFIG.chunkSize;
    const sample = terrainSampler.sample(x, z);
    if (!sample) continue;

    const colorIndex = Math.floor(random01(seed + 3) * GRASS_COLORS.length);
    const color = new THREE.Color(GRASS_COLORS[colorIndex] ?? GRASS_COLORS[0]);
    const yawAngle = random01(seed + 4) * Math.PI * 2;
    const yaw = new THREE.Vector3(Math.sin(yawAngle), 0, -Math.cos(yawAngle));
    const basePosition = sample.position
      .clone()
      .addScaledVector(sample.normal, GRASS_CONFIG.surfaceOffset);

    addGrassBlade(
      positions,
      bladeColors,
      bladeBases,
      bladeNormals,
      sideFactors,
      tipFactors,
      randoms,
      yaws,
      basePosition,
      sample.normal,
      color,
      yaw,
      random01(seed + 5),
    );
  }

  if (positions.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "aBladeColor",
    new THREE.Float32BufferAttribute(bladeColors, 3),
  );
  geometry.setAttribute(
    "aBladeBase",
    new THREE.Float32BufferAttribute(bladeBases, 3),
  );
  geometry.setAttribute(
    "aBladeNormal",
    new THREE.Float32BufferAttribute(bladeNormals, 3),
  );
  geometry.setAttribute(
    "aSideFactor",
    new THREE.Float32BufferAttribute(sideFactors, 1),
  );
  geometry.setAttribute(
    "aTipFactor",
    new THREE.Float32BufferAttribute(tipFactors, 1),
  );
  geometry.setAttribute(
    "aRandom",
    new THREE.Float32BufferAttribute(randoms, 1),
  );
  geometry.setAttribute("aYaw", new THREE.Float32BufferAttribute(yaws, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

export function GrassPatch({
  chunkX,
  chunkZ,
  density,
  terrainSampler,
}: GrassPatchProps): React.JSX.Element | null {
  const camera = useThree((state) => state.camera);
  const wind = useWind();
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const geometry = useMemo(
    () => createGrassGeometry(chunkX, chunkZ, density, terrainSampler),
    [chunkX, chunkZ, density, terrainSampler],
  );
  const material = useMemo(() => createGrassMaterial(), []);

  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
      material.dispose();
    };
  }, [material]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  useFrame(({ clock }) => {
    const currentMaterial = materialRef.current;
    if (!currentMaterial) return;

    const uniforms = currentMaterial.uniforms;
    if (uniforms.uTime) uniforms.uTime.value = clock.elapsedTime;
    if (uniforms.uPlayerPosition) {
      uniforms.uPlayerPosition.value.copy(camera.position);
    }
    if (uniforms.uWindDirection) uniforms.uWindDirection.value = wind.direction;
    if (uniforms.uWindSpeed) uniforms.uWindSpeed.value = wind.speed;
    if (uniforms.uWindNoiseScale) {
      uniforms.uWindNoiseScale.value =
        GRASS_CONFIG.windNoiseScale * wind.noiseScale;
    }
  });

  if (!geometry) return null;

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
