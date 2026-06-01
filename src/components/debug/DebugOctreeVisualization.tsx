import { useMemo } from "react";
import { Box3, BufferAttribute, BufferGeometry } from "three";
import type { Octree } from "three-stdlib";
import { useDebugVisualsStore } from "@/managers/stores/useDebugVisualsStore";

interface DebugOctreeVisualizationProps {
  octree: Octree | null;
}

interface OctreeNodeBox {
  box: Box3;
  depth: number;
  triangleCount: number;
  isLeaf: boolean;
}

interface CollectOptions {
  minDepth: number;
  maxDepth: number;
  leavesOnly: boolean;
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
  options: CollectOptions,
  depth = 0,
  acc: OctreeNodeBox[] = [],
): OctreeNodeBox[] {
  if (depth > options.maxDepth) return acc;

  const isLeaf = node.subTrees.length === 0;
  const passesDepth = depth >= options.minDepth;
  const passesLeafFilter = !options.leavesOnly || isLeaf;
  const hasTriangles = node.triangles.length > 0;

  if (passesDepth && passesLeafFilter && hasTriangles) {
    acc.push({
      box: node.box,
      depth,
      triangleCount: node.triangles.length,
      isLeaf,
    });
  }

  for (const sub of node.subTrees) {
    collectOctreeBoxes(sub, options, depth + 1, acc);
  }

  return acc;
}

function buildOctreeLineGeometry(
  nodes: readonly OctreeNodeBox[],
): BufferGeometry {
  const positionsBuffer = new Float32Array(
    nodes.length * BOX_VERTEX_INDEX_PAIRS.length * 2 * 3,
  );

  const corners: [number, number, number][] = Array.from({ length: 8 }, () => [
    0, 0, 0,
  ]);

  let positionsOffset = 0;

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

    for (const [a, b] of BOX_VERTEX_INDEX_PAIRS) {
      const ca = corners[a]!;
      const cb = corners[b]!;
      positionsBuffer[positionsOffset++] = ca[0];
      positionsBuffer[positionsOffset++] = ca[1];
      positionsBuffer[positionsOffset++] = ca[2];
      positionsBuffer[positionsOffset++] = cb[0];
      positionsBuffer[positionsOffset++] = cb[1];
      positionsBuffer[positionsOffset++] = cb[2];
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positionsBuffer, 3));
  return geometry;
}

export function DebugOctreeVisualization({
  octree,
}: DebugOctreeVisualizationProps): React.JSX.Element | null {
  const showOctree = useDebugVisualsStore((state) => state.showOctree);
  const minDepth = useDebugVisualsStore((state) => state.octreeMinDepth);
  const maxDepth = useDebugVisualsStore((state) => state.octreeMaxDepth);
  const leavesOnly = useDebugVisualsStore((state) => state.octreeLeavesOnly);
  const opacity = useDebugVisualsStore((state) => state.octreeOpacity);

  const geometry = useMemo(() => {
    if (!octree || !showOctree) return null;
    const boxes = collectOctreeBoxes(octree, {
      minDepth,
      maxDepth,
      leavesOnly,
    });
    if (boxes.length === 0) return null;
    return buildOctreeLineGeometry(boxes);
  }, [leavesOnly, maxDepth, minDepth, octree, showOctree]);

  if (!geometry) return null;

  return (
    <lineSegments frustumCulled={false} renderOrder={999}>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial
        color="#22d3ee"
        depthTest={false}
        depthWrite={false}
        transparent
        opacity={opacity}
      />
    </lineSegments>
  );
}
