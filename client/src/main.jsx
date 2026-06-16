import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./AppRouter.jsx";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error(
    '[main.jsx] Could not find #root element. ' +
    'Make sure index.html has <div id="root"></div>.'
  );
}

createRoot(container).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);