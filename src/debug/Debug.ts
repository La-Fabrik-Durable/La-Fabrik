import GUI from "lil-gui";

export type CameraMode = "player" | "debug";

export class Debug {
  private static instance: Debug | null = null;

  public readonly active: boolean;
  private readonly gui: GUI | null;
  private readonly folders = new Map<string, GUI>();
  private readonly listeners = new Set<() => void>();
  private readonly controls = { cameraMode: "player" as CameraMode };
  private cameraMode: CameraMode = "player";

  static getInstance(): Debug {
    if (!Debug.instance) {
      Debug.instance = new Debug();
    }

    return Debug.instance;
  }

  private constructor() {
    this.active = new URLSearchParams(window.location.search).has("debug");
    this.gui = this.active ? new GUI({ title: "La-Fabrik Debug" }) : null;

    if (this.gui) {
      const folder = this.createFolder("Debug");

      folder
        ?.add(this.controls, "cameraMode", { Player: "player", Debug: "debug" })
        .name("Camera Mode")
        .onChange((value: CameraMode) => {
          this.controls.cameraMode = value;
          this.cameraMode = value;
          this.emit();
        });
    }
  }

  createFolder(name: string): GUI | null {
    if (!this.gui) {
      return null;
    }

    const existingFolder = this.folders.get(name);

    if (existingFolder) {
      return existingFolder;
    }

    const folder = this.gui.addFolder(name);
    this.folders.set(name, folder);

    return folder;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  isDebugCameraEnabled(): boolean {
    return this.cameraMode === "debug";
  }

  getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  destroy(): void {
    this.listeners.clear();
    this.folders.clear();
    this.gui?.destroy();
    Debug.instance = null;
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}
