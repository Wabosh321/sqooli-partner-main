import React from "react";
import ReactDOM from "react-dom/client";

type Level = "log" | "info" | "warn" | "error";

const isDev = import.meta.env.DEV;

const maxLines = 200;

let rootEl: HTMLElement | null = null;
let lines: { level: Level; text: string; ts: number }[] = [];

function ensureRoot() {
  if (rootEl) return rootEl;
  rootEl = document.createElement("div");
  rootEl.id = "dev-logger-overlay";
  document.body.appendChild(rootEl);
  return rootEl;
}

function renderOverlay() {
  if (!isDev) return;
  const el = ensureRoot();
  const r = ReactDOM.createRoot(el);
  r.render(
    React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          right: 12,
          bottom: 12,
          width: "380px",
          maxHeight: "45vh",
          overflow: "auto",
          background: "rgba(17,17,19,0.95)",
          color: "#fff",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 12,
          borderRadius: 8,
          padding: 8,
          zIndex: 999999,
          boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
        },
      },
      React.createElement(
        "div",
        { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 6 } },
        React.createElement("strong", null, "Dev Logger"),
        React.createElement(
          "button",
          {
            onClick: () => {
              clear();
            },
            style: {
              marginLeft: "auto",
              background: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "4px 8px",
              borderRadius: 6,
              cursor: "pointer",
            },
          },
          "Clear"
        )
      ),
      ...lines.slice(-maxLines).map((l) =>
        React.createElement(
          "div",
          {
            key: String(l.ts) + l.level,
            style: {
              color: l.level === "error" ? "#ff6b6b" : l.level === "warn" ? "#ffd166" : "#cbd5e1",
              marginBottom: 6,
              whiteSpace: "pre-wrap",
              lineHeight: 1.2,
            },
          },
          `[${new Date(l.ts).toLocaleTimeString()}] ${l.text}`
        )
      )
    )
  );
}

function pushLine(level: Level, text: string) {
  lines.push({ level, text, ts: Date.now() });
  if (lines.length > maxLines) lines.shift();
  try {
    renderOverlay();
  } catch (e) {
    // ignore
  }
}

export function log(...args: any[]) {
  if (!isDev) return;
  const text = args.map(String).join(" ");
  console.log(...args);
  pushLine("log", text);
}

export function info(...args: any[]) {
  if (!isDev) return;
  const text = args.map(String).join(" ");
  console.info(...args);
  pushLine("info", text);
}

export function warn(...args: any[]) {
  if (!isDev) return;
  const text = args.map(String).join(" ");
  console.warn(...args);
  pushLine("warn", text);
}

export function error(...args: any[]) {
  if (!isDev) return;
  const text = args.map(String).join(" ");
  console.error(...args);
  pushLine("error", text);
}

export function clear() {
  if (!isDev) return;
  lines = [];
  if (rootEl) {
    try {
      rootEl.remove();
    } catch {}
    rootEl = null;
  }
}

export const devLogger = { log, info, warn, error, clear };

if (isDev) {
  try {
    // expose for quick access in the console
    (window as any).__devLogger = devLogger;
  } catch {}
}

export default devLogger;
