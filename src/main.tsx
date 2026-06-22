import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { FontLoader } from "@/components/ui/FontLoader";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FontLoader />
    <App />
  </StrictMode>,
);
