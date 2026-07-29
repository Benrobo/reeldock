import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/globals.css";

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("#app element missing from index.html");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
