import { useGLTF } from "@react-three/drei";
import {
  MergedStaticMapModel,
  type MergedStaticMapModelProps,
} from "@/components/three/world/MergedStaticMapModel";
import { assetUrl } from "@/utils/assetUrl";

const FERME_VERTICALE_MODEL_PATH = assetUrl(
  "/models/fermeverticale/model.gltf",
);

type FermeVerticaleModelProps = Omit<MergedStaticMapModelProps, "modelPath">;

export function FermeVerticaleModel(
  props: FermeVerticaleModelProps,
): React.JSX.Element {
  return (
    <MergedStaticMapModel modelPath={FERME_VERTICALE_MODEL_PATH} {...props} />
  );
}

useGLTF.preload(FERME_VERTICALE_MODEL_PATH);
