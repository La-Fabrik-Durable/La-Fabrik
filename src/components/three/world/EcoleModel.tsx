import { useGLTF } from "@react-three/drei";
import {
  MergedStaticMapModel,
  type MergedStaticMapModelProps,
} from "@/components/three/world/MergedStaticMapModel";

const ECOLE_MODEL_PATH = "/models/ecole/model.gltf";

type EcoleModelProps = Omit<MergedStaticMapModelProps, "modelPath">;

export function EcoleModel(props: EcoleModelProps): React.JSX.Element {
  return <MergedStaticMapModel modelPath={ECOLE_MODEL_PATH} {...props} />;
}

useGLTF.preload(ECOLE_MODEL_PATH);
