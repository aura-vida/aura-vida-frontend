import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { pingBackend } from "@/lib/api";

pingBackend()
  .then((message) => console.info("[Aura Vida] backend:", message))
  .catch((error) => console.warn("[Aura Vida] backend not reachable:", error));

createRoot(document.getElementById("root")!).render(<App />);
