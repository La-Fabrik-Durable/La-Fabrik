import { useGLTF } from "@react-three/drei";
import {
  MergedStaticMapModel,
  type MergedStaticMapModelProps,
} from "@/components/three/world/MergedStaticMapModel";

const GENERATEUR_MODEL_PATH = "/models/generateur/model.gltf";

type GenerateurModelProps = Omit<MergedStaticMapModelProps, "modelPath">;

export function GenerateurModel(
  props: GenerateurModelProps,
): React.JSX.Element {
  return <MergedStaticMapModel modelPath={GENERATEUR_MODEL_PATH} {...props} />;
}

useGLTF.preload(GENERATEUR_MODEL_PATH);
