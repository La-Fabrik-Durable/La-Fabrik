import { useGLTF } from "@react-three/drei";
import {
  MergedStaticMapModel,
  type MergedStaticMapModelProps,
} from "@/components/three/world/MergedStaticMapModel";

const LAFABRIK_MODEL_PATH = "/models/lafabrik/model.gltf";

type LafabrikModelProps = Omit<MergedStaticMapModelProps, "modelPath">;

export function LafabrikModel(props: LafabrikModelProps): React.JSX.Element {
  return <MergedStaticMapModel modelPath={LAFABRIK_MODEL_PATH} {...props} />;
}

useGLTF.preload(LAFABRIK_MODEL_PATH);
