/**
 * useLogger hook - Access logger from React component
 */
import { useContext } from "react";
import { LoggerContext } from "../context/LoggerContext";
import { ILoggerContext } from "../../core/interfaces/ILoggerContext";

export const useLogger = (): ILoggerContext => {
  const context = useContext(LoggerContext);

  if (!context) {
    throw new Error("useLogger must be used within LoggerProvider");
  }

  return context;
};
