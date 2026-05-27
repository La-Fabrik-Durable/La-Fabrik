import type {
  EditableMapNode,
  HierarchicalMapNode,
  MapNode,
  SceneData,
} from "@/types/editor/editor";
import {
  parseHierarchicalMapPayload,
  parseMapNodes,
} from "@/utils/map/mapNodeValidation";

const MAP_JSON_PATH = "/map.json";
const MODEL_FILE_NAMES = ["model.glb", "model.gltf"];
const HTML_CONTENT_TYPE = "text/html";
const MAP_STRUCTURE_NODE_NAMES = new Set(["Scene", "blocking"]);
const POSITION_PRECISION = 3;
type ModelEntry = [modelName: string, modelUrl: string];

let cachedSceneData: SceneData | null = null;
let loadingPromise: Promise<SceneData | null> | null = null;

export async function loadMapSceneData(): Promise<SceneData | null> {
  if (cachedSceneData) {
    return cachedSceneData;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = loadMapSceneDataInternal();
  cachedSceneData = await loadingPromise;
  loadingPromise = null;

  return cachedSceneData;
}

export function getMapNodes(): MapNode[] | null {
  return cachedSceneData?.mapNodes ?? null;
}

export function getMapNodesByName(name: string): MapNode[] {
  const nodes = cachedSceneData?.mapNodes;
  if (!nodes) return [];
  return nodes.filter((node) => node.name === name);
}

async function loadMapSceneDataInternal(): Promise<SceneData | null> {
  const response = await fetch(MAP_JSON_PATH);

  if (!response.ok) {
    return null;
  }

  const mapPayload: unknown = await response.json();
  return createSceneDataFromMapPayload(mapPayload);
}

export async function createSceneDataFromMapPayload(
  mapPayload: unknown,
): Promise<SceneData> {
  const mapTree = parseHierarchicalMapPayload(mapPayload);
  const mapNodes = parseMapNodes(mapTree);
  const editableNodes = createEditableMapNodes(mapTree);
  const deduplicatedNodes = deduplicateMapNodes(mapNodes);
  const deduplicatedEditableNodes = deduplicateEditableMapNodes(editableNodes);
  return createSceneData(mapTree, deduplicatedEditableNodes, deduplicatedNodes);
}

function toMapNode(node: HierarchicalMapNode): MapNode {
  return {
    name: node.name,
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
    type: node.type,
  };
}

function flattenEditableMapNode(
  node: HierarchicalMapNode,
  path: number[],
): EditableMapNode[] {
  if (node.name === "terrain") {
    return [];
  }

  if (node.role === "group") {
    return (
      node.children?.flatMap((child, index) =>
        flattenEditableMapNode(child, [...path, index]),
      ) ?? []
    );
  }

  return [{ ...toMapNode(node), path }];
}

function createEditableMapNodes(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): EditableMapNode[] {
  if (Array.isArray(mapTree)) {
    return mapTree.flatMap((node, index) =>
      flattenEditableMapNode(node, [index]),
    );
  }

  return flattenEditableMapNode(mapTree, []);
}

function createPositionKey(node: MapNode): string {
  const [x, y, z] = node.position;
  const px = x.toFixed(POSITION_PRECISION);
  const py = y.toFixed(POSITION_PRECISION);
  const pz = z.toFixed(POSITION_PRECISION);
  return `${node.name}:${px},${py},${pz}`;
}

function deduplicateMapNodes(nodes: MapNode[]): MapNode[] {
  const seen = new Set<string>();
  const result: MapNode[] = [];

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === "Object3D" && b.type !== "Object3D") return -1;
    if (a.type !== "Object3D" && b.type === "Object3D") return 1;
    return 0;
  });

  for (const node of sortedNodes) {
    if (MAP_STRUCTURE_NODE_NAMES.has(node.name)) {
      result.push(node);
      continue;
    }

    const key = createPositionKey(node);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(node);
    }
  }

  return result;
}

function deduplicateEditableMapNodes(
  nodes: EditableMapNode[],
): EditableMapNode[] {
  const seen = new Set<string>();
  const result: EditableMapNode[] = [];

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === "Object3D" && b.type !== "Object3D") return -1;
    if (a.type !== "Object3D" && b.type === "Object3D") return 1;
    return 0;
  });

  for (const node of sortedNodes) {
    const key = createPositionKey(node);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(node);
    }
  }

  return result;
}

async function createSceneData(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  mapNodes: EditableMapNode[],
  modelLookupNodes: MapNode[],
): Promise<SceneData> {
  const models = await loadMapModelUrls(modelLookupNodes);
  return { mapNodes, mapTree, models };
}

async function loadMapModelUrls(
  mapNodes: MapNode[],
): Promise<Map<string, string>> {
  const uniqueModelNames = [
    ...new Set(
      mapNodes
        .filter((node) => !MAP_STRUCTURE_NODE_NAMES.has(node.name))
        .map((node) => node.name),
    ),
  ];
  const modelEntries = await Promise.all(
    uniqueModelNames.map((modelName) => loadModelEntry(modelName)),
  );

  return new Map(modelEntries.filter((entry) => entry !== null));
}

async function loadModelEntry(modelName: string): Promise<ModelEntry | null> {
  for (const fileName of MODEL_FILE_NAMES) {
    const modelUrl = `/models/${modelName}/${fileName}`;

    try {
      const response = await fetch(modelUrl, { method: "HEAD" });
      const contentType = response.headers.get("content-type") ?? "";
      if (response.ok && !contentType.includes(HTML_CONTENT_TYPE)) {
        return [modelName, modelUrl];
      }
    } catch {
      continue;
    }
  }

  return null;
}
