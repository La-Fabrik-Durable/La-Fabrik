import type { Vector3Tuple } from "../three/three";

export interface MapNode {
  name: string;
  type: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export interface EditableMapNode extends MapNode {
  path: number[];
}

export interface HierarchicalMapNode extends MapNode {
  role?: "group";
  children?: HierarchicalMapNode[];
}

export interface SceneData {
  mapNodes: EditableMapNode[];
  mapTree: HierarchicalMapNode | HierarchicalMapNode[];
  models: Map<string, string>;
}

export type TransformMode = "translate" | "rotate" | "scale";
