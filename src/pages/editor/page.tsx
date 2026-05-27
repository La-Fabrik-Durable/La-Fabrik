import { Suspense, useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { EditorControls } from "@/components/editor/EditorControls";
import { EditorScene } from "@/components/editor/scene/EditorScene";
import type { EditorCinematicPreviewRequest } from "@/components/editor/scene/EditorScene";
import { SceneLoadingOverlay } from "@/components/ui/SceneLoadingOverlay";
import { Subtitles } from "@/components/ui/Subtitles";
import { useEditorHistory } from "@/hooks/editor/useEditorHistory";
import type { CinematicDefinition } from "@/types/cinematics/cinematics";
import { useEditorSceneData } from "@/hooks/editor/useEditorSceneData";
import type {
  EditableMapNode,
  HierarchicalMapNode,
  MapNode,
  SceneData,
  TransformMode,
} from "@/types/editor/editor";
import {
  INITIAL_SCENE_LOADING_STATE,
  type SceneLoadingChangeHandler,
  type SceneLoadingState,
} from "@/types/world/sceneLoading";
import { logger } from "@/utils/core/Logger";

const SAVE_ERROR_MESSAGE = "Erreur lors de l'enregistrement";
const DEFAULT_NEW_NODE_NAME = "new-model";

interface EditorSceneLoadingTrackerProps {
  onLoadingStateChange: SceneLoadingChangeHandler;
}

function serializeMapNodes(sceneData: SceneData): string {
  return JSON.stringify(sceneData.mapTree, null, 2);
}

function cloneMapTree(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): HierarchicalMapNode | HierarchicalMapNode[] {
  return JSON.parse(JSON.stringify(mapTree)) as
    | HierarchicalMapNode
    | HierarchicalMapNode[];
}

function toEditableMapNode(
  node: HierarchicalMapNode,
  path: number[],
): EditableMapNode | null {
  if (node.name === "terrain" || node.role === "group") return null;

  return {
    name: node.name,
    path,
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
    type: node.type,
  };
}

function collectEditableMapNodes(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): EditableMapNode[] {
  const nodes: EditableMapNode[] = [];

  function visit(node: HierarchicalMapNode, path: number[]): void {
    const editableNode = toEditableMapNode(node, path);
    if (editableNode) {
      nodes.push(editableNode);
      return;
    }

    node.children?.forEach((child, index) => visit(child, [...path, index]));
  }

  if (Array.isArray(mapTree)) {
    mapTree.forEach((node, index) => visit(node, [index]));
  } else {
    visit(mapTree, []);
  }

  return nodes;
}

function updateTreeNodeAtPath(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  path: number[],
  update: (node: HierarchicalMapNode) => HierarchicalMapNode,
): HierarchicalMapNode | HierarchicalMapNode[] {
  const nextTree = cloneMapTree(mapTree);
  const rootNodes = Array.isArray(nextTree) ? nextTree : [nextTree];
  const targetIndex = path[path.length - 1] ?? 0;
  const isRootTarget = Array.isArray(nextTree)
    ? path.length === 1
    : path.length === 0;

  if (isRootTarget) {
    rootNodes[targetIndex] = update(
      rootNodes[targetIndex] as HierarchicalMapNode,
    );
    return nextTree;
  }

  const parentPath = path.slice(0, -1);
  let parent = Array.isArray(nextTree)
    ? rootNodes[parentPath[0] ?? 0]
    : rootNodes[0];
  const childPath = Array.isArray(nextTree) ? parentPath.slice(1) : parentPath;

  for (const index of childPath) {
    parent = parent?.children?.[index];
  }

  if (!parent?.children?.[targetIndex]) return nextTree;
  parent.children[targetIndex] = update(parent.children[targetIndex]);

  return nextTree;
}

function removeTreeNodeAtPath(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  path: number[],
): HierarchicalMapNode | HierarchicalMapNode[] {
  const nextTree = cloneMapTree(mapTree);
  const rootNodes = Array.isArray(nextTree) ? nextTree : [nextTree];
  const targetIndex = path[path.length - 1];
  if (targetIndex === undefined) return nextTree;

  if (Array.isArray(nextTree) && path.length === 1) {
    nextTree.splice(targetIndex, 1);
    return nextTree;
  }

  const parentPath = path.slice(0, -1);
  let parent = Array.isArray(nextTree)
    ? rootNodes[parentPath[0] ?? 0]
    : rootNodes[0];
  const childPath = Array.isArray(nextTree) ? parentPath.slice(1) : parentPath;

  for (const index of childPath) {
    parent = parent?.children?.[index];
  }

  parent?.children?.splice(targetIndex, 1);
  return nextTree;
}

function addTreeNode(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  node: HierarchicalMapNode,
): HierarchicalMapNode | HierarchicalMapNode[] {
  const blockingPath = findNodePathByName(mapTree, "blocking");
  if (!blockingPath) return mapTree;

  return updateTreeNodeAtPath(mapTree, blockingPath, (blockingNode) => ({
    ...blockingNode,
    children: [...(blockingNode.children ?? []), node],
  }));
}

function updateSceneDataTree(
  sceneData: SceneData,
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
): SceneData {
  return {
    ...sceneData,
    mapNodes: collectEditableMapNodes(mapTree),
    mapTree,
  };
}

function findNodePathByName(
  mapTree: HierarchicalMapNode | HierarchicalMapNode[],
  name: string,
): number[] | null {
  function visit(node: HierarchicalMapNode, path: number[]): number[] | null {
    if (node.name === name) return path;

    for (let index = 0; index < (node.children?.length ?? 0); index++) {
      const child = node.children?.[index];
      if (!child) continue;
      const result = visit(child, [...path, index]);
      if (result) return result;
    }

    return null;
  }

  if (Array.isArray(mapTree)) {
    for (let index = 0; index < mapTree.length; index++) {
      const node = mapTree[index];
      if (!node) continue;
      const result = visit(node, [index]);
      if (result) return result;
    }
    return null;
  }

  return visit(mapTree, []);
}

function createNewMapNode(name: string): HierarchicalMapNode {
  const safeName = name.trim() || DEFAULT_NEW_NODE_NAME;

  return {
    name: safeName,
    type: "Object3D",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    children: [
      {
        name: safeName,
        type: "Mesh",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    ],
  };
}

function EditorSceneLoadingTracker({
  onLoadingStateChange,
}: EditorSceneLoadingTrackerProps): null {
  const { active, progress } = useProgress();

  useEffect(() => {
    if (active) {
      onLoadingStateChange({
        currentStep: "Importation des models",
        progress: 0.2 + (progress / 100) * 0.7,
        status: "loading",
      });
      return;
    }

    onLoadingStateChange({
      currentStep: "Gameplay prêt",
      progress: 1,
      status: "ready",
    });
  }, [active, onLoadingStateChange, progress]);

  return null;
}

export function EditorPage(): React.JSX.Element {
  const {
    hasMapJson,
    isMapLoading,
    sceneData,
    setSceneData,
    handleFolderUpload,
  } = useEditorSceneData();

  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(
    null,
  );
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);
  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");
  const [isPlayerMode, setIsPlayerMode] = useState(false);
  const [isSelectionLocked, setIsSelectionLocked] = useState(false);
  const [snapToTerrain, setSnapToTerrain] = useState(true);
  const [newNodeName, setNewNodeName] = useState(DEFAULT_NEW_NODE_NAME);
  const [sceneLoadingState, setSceneLoadingState] = useState<SceneLoadingState>(
    {
      ...INITIAL_SCENE_LOADING_STATE,
      currentStep: "Montage progressif des models",
      progress: 0.2,
    },
  );
  const handleSceneLoadingStateChange = useCallback(
    (nextState: SceneLoadingState) => {
      setSceneLoadingState((currentState) => {
        const shouldRestartProgress = currentState.status === "ready";

        return {
          ...nextState,
          progress: shouldRestartProgress
            ? nextState.progress
            : Math.max(currentState.progress, nextState.progress),
        };
      });
    },
    [],
  );
  const editorLoadingState = isMapLoading
    ? {
        currentStep: "Récupération blocking",
        progress: 0.08,
        status: "loading" as const,
      }
    : sceneLoadingState;
  const [cinematicPreviewRequest, setCinematicPreviewRequest] =
    useState<EditorCinematicPreviewRequest | null>(null);

  const {
    undoCount,
    redoCount,
    handleUndo,
    handleRedo,
    handleTransformStart,
    handleTransformEnd,
  } = useEditorHistory(sceneData, setSceneData);

  const handleSelectNode = useCallback((index: number | null) => {
    setSelectedNodeIndex(index);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedNodeIndex(null);
  }, []);

  const handleSelectionLockToggle = useCallback(() => {
    setIsSelectionLocked((locked) => !locked);
  }, []);

  const handleSnapToTerrainToggle = useCallback(() => {
    setSnapToTerrain((enabled) => !enabled);
  }, []);

  const handleNewNodeNameChange = useCallback((value: string) => {
    setNewNodeName(value);
  }, []);

  const handleHoverNode = useCallback((index: number | null) => {
    setHoveredNodeIndex(index);
  }, []);

  const handleTransformModeChange = useCallback((mode: TransformMode) => {
    setTransformMode(mode);
  }, []);

  const handleSaveToServer = useCallback(async () => {
    if (!sceneData) return;
    const json = serializeMapNodes(sceneData);

    try {
      const response = await fetch("/api/save-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });

      if (response.ok) {
        alert("Map enregistrée avec succès!");
      } else {
        alert(SAVE_ERROR_MESSAGE);
      }
    } catch (err) {
      console.error("Error saving map:", err);
      alert(SAVE_ERROR_MESSAGE);
    }
  }, [sceneData]);

  const handleExportJson = useCallback(() => {
    if (!sceneData) return;
    const json = serializeMapNodes(sceneData);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "map.json";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [sceneData]);

  const handlePlayerMode = useCallback(() => {
    setIsPlayerMode((prev) => !prev);
  }, []);

  const handlePreviewCinematic = useCallback(
    (cinematic: CinematicDefinition) => {
      setCinematicPreviewRequest({
        id: window.crypto.randomUUID(),
        cinematic,
      });
    },
    [],
  );

  const handleCinematicPreviewComplete = useCallback(() => {
    setCinematicPreviewRequest(null);
  }, []);

  const handleNodeTransform = useCallback(
    (nodeIndex: number, updatedNode: MapNode) => {
      setSceneData((prev) => {
        if (!prev) return null;
        const currentNode = prev.mapNodes[nodeIndex];
        if (!currentNode) return prev;

        const mapTree = updateTreeNodeAtPath(
          prev.mapTree,
          currentNode.path,
          (node) => ({
            ...node,
            position: updatedNode.position,
            rotation: updatedNode.rotation,
            scale: updatedNode.scale,
          }),
        );

        return updateSceneDataTree(prev, mapTree);
      });
    },
    [setSceneData],
  );

  const handleSelectedScaleChange = useCallback(
    (axis: 0 | 1 | 2, value: number) => {
      if (selectedNodeIndex === null || Number.isNaN(value)) return;

      setSceneData((prev) => {
        if (!prev) return null;
        const currentNode = prev.mapNodes[selectedNodeIndex];
        if (!currentNode) return prev;

        const nextScale = [...currentNode.scale] as [number, number, number];
        nextScale[axis] = value;

        const mapTree = updateTreeNodeAtPath(
          prev.mapTree,
          currentNode.path,
          (node) => ({ ...node, scale: nextScale }),
        );

        return updateSceneDataTree(prev, mapTree);
      });
    },
    [selectedNodeIndex, setSceneData],
  );

  const handleAddNode = useCallback(() => {
    setSceneData((prev) => {
      if (!prev) return null;
      const mapTree = addTreeNode(prev.mapTree, createNewMapNode(newNodeName));
      const nextSceneData = updateSceneDataTree(prev, mapTree);
      setSelectedNodeIndex(nextSceneData.mapNodes.length - 1);
      return nextSceneData;
    });
  }, [newNodeName, setSceneData]);

  const handleDeleteSelectedNode = useCallback(() => {
    if (selectedNodeIndex === null) return;

    setSceneData((prev) => {
      if (!prev) return null;
      const currentNode = prev.mapNodes[selectedNodeIndex];
      if (!currentNode) return prev;
      const mapTree = removeTreeNodeAtPath(prev.mapTree, currentNode.path);
      setSelectedNodeIndex(null);
      return updateSceneDataTree(prev, mapTree);
    });
  }, [selectedNodeIndex, setSceneData]);

  if (isMapLoading) {
    return (
      <div className="editor-container">
        <SceneLoadingOverlay state={editorLoadingState} />
      </div>
    );
  }

  if (!hasMapJson) {
    return (
      <div className="editor-container">
        <div className="editor-error">
          <h2>Erreur : map.json introuvable</h2>
          <p>
            Le fichier map.json est requis dans le dossier <code>public/</code>.
          </p>

          <div className="editor-upload-section">
            <h3>Télécharger un dossier contenant map.json</h3>

            <label className="editor-drop-zone">
              <input
                type="file"
                className="editor-folder-input"
                onChange={handleFolderUpload}
                multiple
                {...{ webkitdirectory: "" }}
              />
              Choisir un dossier contenant map.json
            </label>

            <div className="editor-folder-structure">
              <h4>Structure requise :</h4>
              <pre>
                public/ ├── <strong>map.json</strong> (à la racine) └── models/
                ├── arbre/ │ └── model.glb ├── building/ │ └── model.gltf └──
                ...
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <Canvas
        camera={{ position: [0, 50, 100], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#050505");

          const canvas = gl.domElement;
          const handleContextLost = (event: Event) => {
            event.preventDefault();
            logger.error("WebGL", "Context lost - GPU resources exhausted");
          };
          const handleContextRestored = () => {
            logger.info("WebGL", "Context restored");
          };
          canvas.addEventListener("webglcontextlost", handleContextLost);
          canvas.addEventListener(
            "webglcontextrestored",
            handleContextRestored,
          );
        }}
      >
        <EditorSceneLoadingTracker
          onLoadingStateChange={handleSceneLoadingStateChange}
        />
        <Suspense fallback={null}>
          <EditorScene
            sceneData={sceneData!}
            selectedNodeIndex={selectedNodeIndex}
            onSelectNode={handleSelectNode}
            isSelectionLocked={isSelectionLocked}
            hoveredNodeIndex={hoveredNodeIndex}
            onHoverNode={handleHoverNode}
            transformMode={transformMode}
            snapToTerrain={snapToTerrain}
            onTransformModeChange={handleTransformModeChange}
            onTransformStart={handleTransformStart}
            onTransformEnd={handleTransformEnd}
            onNodeTransform={handleNodeTransform}
            onUndo={handleUndo}
            onRedo={handleRedo}
            isPlayerMode={isPlayerMode}
            cinematicPreviewRequest={cinematicPreviewRequest}
            onCinematicPreviewComplete={handleCinematicPreviewComplete}
          />
        </Suspense>
      </Canvas>

      <SceneLoadingOverlay state={editorLoadingState} />

      {sceneData && (
        <EditorControls
          transformMode={transformMode}
          onTransformModeChange={handleTransformModeChange}
          selectedNodeIndex={selectedNodeIndex}
          mapNodes={sceneData.mapNodes}
          nodesCount={sceneData.mapNodes.length}
          selectedNodeName={
            selectedNodeIndex !== null && sceneData.mapNodes[selectedNodeIndex]
              ? sceneData.mapNodes[selectedNodeIndex].name || null
              : null
          }
          selectedNodeScale={
            selectedNodeIndex !== null && sceneData.mapNodes[selectedNodeIndex]
              ? sceneData.mapNodes[selectedNodeIndex].scale
              : null
          }
          isSelectionLocked={isSelectionLocked}
          onSelectionLockToggle={handleSelectionLockToggle}
          onClearSelection={handleClearSelection}
          snapToTerrain={snapToTerrain}
          onSnapToTerrainToggle={handleSnapToTerrainToggle}
          newNodeName={newNodeName}
          onNewNodeNameChange={handleNewNodeNameChange}
          onAddNode={handleAddNode}
          onDeleteSelectedNode={handleDeleteSelectedNode}
          onSelectedScaleChange={handleSelectedScaleChange}
          undoCount={undoCount}
          redoCount={redoCount}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExportJson={handleExportJson}
          onSaveToServer={import.meta.env.DEV ? handleSaveToServer : undefined}
          onPlayerMode={handlePlayerMode}
          onPreviewCinematic={handlePreviewCinematic}
          isPlayerMode={isPlayerMode}
        />
      )}
      <Subtitles />
    </div>
  );
}
