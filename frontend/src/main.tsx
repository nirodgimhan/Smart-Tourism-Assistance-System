
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./app/App";

// Global application CSS
import "./styles/globals.css";

// Leaflet CSS should load after globals.css
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
