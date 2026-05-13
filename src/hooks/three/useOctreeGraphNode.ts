import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Object3D } from "three";
import { Octree } from "three/addons/math/Octree.js";
import type { OctreeReadyHandler } from "@/types/three/three";
import { logger } from "@/utils/core/Logger";

export function useOctreeGraphNode(
  graphNodeRef: RefObject<Object3D | null>,
  onOctreeReady: OctreeReadyHandler,
  rebuildKey: string | number = 0,
  enabled = true,
): void {
  const octreeBuilt = useRef(false);

  useEffect(() => {
    octreeBuilt.current = false;
  }, [rebuildKey]);

  useEffect(() => {
    logger.debug("useOctreeGraphNode", "Check", {
      enabled,
      octreeBuilt: octreeBuilt.current,
      hasGraphNode: !!graphNodeRef.current,
      rebuildKey,
    });

    if (!enabled) return;

    const graphNode = graphNodeRef.current;
    if (!enabled || octreeBuilt.current || !graphNode) return;
    octreeBuilt.current = true;

    logger.info("useOctreeGraphNode", "Building octree from graph node");
    graphNode.updateMatrixWorld(true);

    const octree = new Octree();
    octree.fromGraphNode(graphNode);
    logger.info("useOctreeGraphNode", "Octree built, calling onOctreeReady");
    onOctreeReady(octree);
  }, [enabled, graphNodeRef, onOctreeReady, rebuildKey]);
}
