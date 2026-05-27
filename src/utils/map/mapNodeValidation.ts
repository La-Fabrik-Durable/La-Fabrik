import type { HierarchicalMapNode, MapNode } from "../../types/editor/editor";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isVector3Tuple(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function isMapNode(value: unknown): value is MapNode {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.type === "string" &&
    isVector3Tuple(value.position) &&
    isVector3Tuple(value.rotation) &&
    isVector3Tuple(value.scale)
  );
}

export function isHierarchicalMapNode(
  value: unknown,
): value is HierarchicalMapNode {
  if (!isMapNode(value)) {
    return false;
  }

  if ("role" in value && value.role !== undefined && value.role !== "group") {
    return false;
  }

  if (!("children" in value)) {
    return true;
  }

  return (
    value.children === undefined ||
    (Array.isArray(value.children) &&
      value.children.every(isHierarchicalMapNode))
  );
}

function flattenMapNode(node: HierarchicalMapNode): MapNode[] {
  const mapNode: MapNode = {
    name: node.name,
    type: node.type,
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
  if (node.role === "group") {
    return node.children?.flatMap(flattenMapNode) ?? [];
  }

  return [mapNode];
}

export function parseHierarchicalMapPayload(
  value: unknown,
): HierarchicalMapNode | HierarchicalMapNode[] {
  if (Array.isArray(value) && value.every(isHierarchicalMapNode)) {
    return value;
  }

  if (isHierarchicalMapNode(value)) {
    return value;
  }

  throw new Error("Invalid map node data");
}

export function parseMapNodes(value: unknown): MapNode[] {
  if (Array.isArray(value) && value.every(isHierarchicalMapNode)) {
    return value.flatMap(flattenMapNode);
  }

  if (isHierarchicalMapNode(value)) {
    return flattenMapNode(value);
  }

  throw new Error("Invalid map node data");
}
