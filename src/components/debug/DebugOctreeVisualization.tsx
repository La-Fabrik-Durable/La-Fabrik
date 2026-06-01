import { useMemo } from "react";
import { Box3, BufferAttribute, BufferGeometry, Color } from "three";
import type { Octree } from "three-stdlib";
import { useDebugVisualsStore } from "@/managers/stores/useDebugVisualsStore";

interface DebugOctreeVisualizationProps {
  octree: Octree | null;
}

interface OctreeNodeBox {
  box: Box3;
  depth: number;
  triangleCount: number;
}

const BOX_VERTEX_INDEX_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 3],
  [3, 2],
  [2, 0],
  [4, 5],
  [5, 7],
  [7, 6],
  [6, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

function collectOctreeBoxes(
  node: Octree,
  maxDepth: number,
  depth = 0,
  acc: OctreeNodeBox[] = [],
): OctreeNodeBox[] {
  if (depth > maxDepth) return acc;

  acc.push({
    box: node.box,
    depth,
    triangleCount: node.triangles.length,
  });

  for (const sub of node.subTrees) {
    collectOctreeBoxes(sub, maxDepth, depth + 1, acc);
  }

  return acc;
}

function buildOctreeLineGeometry(
  nodes: readonly OctreeNodeBox[],
): BufferGeometry {
  const positionsBuffer = new Float32Array(
    nodes.length * BOX_VERTEX_INDEX_PAIRS.length * 2 * 3,
  );
  const colorsBuffer = new Float32Array(
    nodes.length * BOX_VERTEX_INDEX_PAIRS.length * 2 * 3,
  );

  const corners: [number, number, number][] = Array.from({ length: 8 }, () => [
    0, 0, 0,
  ]);

  let positionsOffset = 0;
  let colorsOffset = 0;
  const colorHelper = new Color();

  for (const node of nodes) {
    const { min, max } = node.box;

    corners[0] = [min.x, min.y, min.z];
    corners[1] = [max.x, min.y, min.z];
    corners[2] = [min.x, max.y, min.z];
    corners[3] = [max.x, max.y, min.z];
    corners[4] = [min.x, min.y, max.z];
    corners[5] = [max.x, min.y, max.z];
    corners[6] = [min.x, max.y, max.z];
    corners[7] = [max.x, max.y, max.z];

    const hue = (node.depth * 0.13) % 1;
    colorHelper.setHSL(hue, 0.85, 0.55);

    for (const [a, b] of BOX_VERTEX_INDEX_PAIRS) {
      const ca = corners[a]!;
      const cb = corners[b]!;
      positionsBuffer[positionsOffset++] = ca[0];
      positionsBuffer[positionsOffset++] = ca[1];
      positionsBuffer[positionsOffset++] = ca[2];
      positionsBuffer[positionsOffset++] = cb[0];
      positionsBuffer[positionsOffset++] = cb[1];
      positionsBuffer[positionsOffset++] = cb[2];

      colorsBuffer[colorsOffset++] = colorHelper.r;
      colorsBuffer[colorsOffset++] = colorHelper.g;
      colorsBuffer[colorsOffset++] = colorHelper.b;
      colorsBuffer[colorsOffset++] = colorHelper.r;
      colorsBuffer[colorsOffset++] = colorHelper.g;
      colorsBuffer[colorsOffset++] = colorHelper.b;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positionsBuffer, 3));
  geometry.setAttribute("color", new BufferAttribute(colorsBuffer, 3));
  return geometry;
}

export function DebugOctreeVisualization({
  octree,
}: DebugOctreeVisualizationProps): React.JSX.Element | null {
  const showOctree = useDebugVisualsStore((state) => state.showOctree);
  const maxDepth = useDebugVisualsStore((state) => state.octreeMaxDepth);

  const geometry = useMemo(() => {
    if (!octree || !showOctree) return null;
    const boxes = collectOctreeBoxes(octree, maxDepth);
    if (boxes.length === 0) return null;
    return buildOctreeLineGeometry(boxes);
  }, [maxDepth, octree, showOctree]);

  if (!geometry) return null;

  return (
    <lineSegments frustumCulled={false} renderOrder={999}>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial
        vertexColors
        depthTest={false}
        depthWrite={false}
        transparent
        opacity={0.85}
      />
    </lineSegments>
  );
}
