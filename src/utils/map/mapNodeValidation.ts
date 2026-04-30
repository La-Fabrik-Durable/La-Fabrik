import type { MapNode } from "../../types/editor/editor";

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

export function parseMapNodes(value: unknown): MapNode[] {
  if (!Array.isArray(value) || !value.every(isMapNode)) {
    throw new Error("Invalid map node data");
  }

  return value;
}
