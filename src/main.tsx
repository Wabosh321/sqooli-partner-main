import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from './components/common/ErrorBoundary';
import "./index.css";

import { ThemeProvider } from "./context/ThemeProvider";
import { PermissionProvider } from "./context/PermissionProvider";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { devLogger } from "./lib/devLogger";
import { initAuthDebugger } from "./lib/authDebuggerHelper";

const root = ReactDOM.createRoot(document.getElementById("root")!);

if (import.meta.env.DEV) {
  try {
    devLogger.info("DEV MODE: devLogger initialized");
    initAuthDebugger(); // Initialize authorization debugging helper
  } catch (e) {
    // fallback to console
    // eslint-disable-next-line no-console
    console.info("DEV MODE: rendering app without Convex");
  }
}



root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PermissionProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          <Toaster />
        </PermissionProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
