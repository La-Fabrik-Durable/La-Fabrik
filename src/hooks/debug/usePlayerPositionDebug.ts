import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type GUI from "lil-gui";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";

export function usePlayerPositionDebug(): void {
  const pos = useRef({ x: 0, y: 0, z: 0 });
  const controllers = useRef<{ updateDisplay: () => void }[]>([]);

  useDebugFolder("Game", (folder: GUI) => {
    const sub = folder.addFolder("Player Position");
    sub.open();

    controllers.current = [
      sub.add(pos.current, "x").name("X").decimals(2).disable(),
      sub.add(pos.current, "y").name("Y").decimals(2).disable(),
      sub.add(pos.current, "z").name("Z").decimals(2).disable(),
    ];
  });

  useFrame(() => {
    const p = window.playerPos;
    if (!p) return;
    pos.current.x = p[0];
    pos.current.y = p[1];
    pos.current.z = p[2];
    for (const c of controllers.current) c.updateDisplay();
  });
}
