import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import {
  logModelLoadSuccess,
  type ModelLoadLogContext,
} from "@/utils/three/modelLoadLogger";

export function useLoggedGLTF(
  modelPath: string,
  context: Omit<ModelLoadLogContext, "modelPath">,
) {
  const gltf = useGLTF(modelPath);
  const hasLoggedRef = useRef(false);
  const { position, rotation, scale, scope } = context;

  useEffect(() => {
    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;
    logModelLoadSuccess({ modelPath, position, rotation, scale, scope }, gltf);
  }, [gltf, modelPath, position, rotation, scale, scope]);

  return gltf;
}
