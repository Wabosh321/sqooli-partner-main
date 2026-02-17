/**
 * LoggerProvider - React component to provide logger context
 */
import React, { ReactNode, useMemo } from "react";
import { LoggerContext, DefaultLoggerContext } from "./LoggerContext";
import { JellyLogger } from "../../core/Logger";
import { ConsoleTransport } from "../../transports/ConsoleTransport";
import { ILoggerConfig } from "../../core/interfaces/ILoggerConfig";

interface LoggerProviderProps {
  children: ReactNode;
  config?: Partial<ILoggerConfig>;
}

export const LoggerProvider: React.FC<LoggerProviderProps> = ({
  children,
  config,
}) => {
  const loggerContext = useMemo(() => {
    const mergedConfig: ILoggerConfig = {
      serviceName: config?.serviceName || "app",
      ...config,
    };

    const logger = JellyLogger.getInstance(mergedConfig);

    // Always add console transport for frontend
    if (!logger["transports"]?.has("console")) {
      logger.addTransport(new ConsoleTransport());
    }

    return new DefaultLoggerContext(logger);
  }, [config]);

  return (
    <LoggerContext.Provider value={loggerContext}>
      {children}
    </LoggerContext.Provider>
  );
};
