export type InteractableKind = "grab" | "trigger";

export interface InteractableHandle {
  kind: InteractableKind;
  label: string;
  onPress: () => void;
  onRelease: () => void;
}

export interface InteractionSnapshot {
  focused: InteractableHandle | null;
  holding: boolean;
}
