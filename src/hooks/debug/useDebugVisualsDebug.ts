import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { useDebugVisualsStore } from "@/managers/stores/useDebugVisualsStore";

export function useDebugVisualsDebug(): void {
  useDebugFolder("Debug", (folder) => {
    const controls = {
      showPlayerModel: useDebugVisualsStore.getState().showPlayerModel,
      showOctree: useDebugVisualsStore.getState().showOctree,
      octreeMaxDepth: useDebugVisualsStore.getState().octreeMaxDepth,
    };

    folder
      .add(controls, "showPlayerModel")
      .name("Show Player Model")
      .onChange((value: boolean) => {
        useDebugVisualsStore.getState().setShowPlayerModel(value);
      });

    folder
      .add(controls, "showOctree")
      .name("Show Octree")
      .onChange((value: boolean) => {
        useDebugVisualsStore.getState().setShowOctree(value);
      });

    folder
      .add(controls, "octreeMaxDepth", 0, 10, 1)
      .name("Octree Max Depth")
      .onChange((value: number) => {
        useDebugVisualsStore.getState().setOctreeMaxDepth(value);
      });
  });
}
