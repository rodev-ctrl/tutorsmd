type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  message: string;
  meta?: Record<string, any>;
}

const log = (level: LogLevel, payload: LogPayload) => {
  const entry = {
    level,
    message: payload.message,
    ...payload.meta,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(entry));
};

export const logger = {
  info: (message: string, meta?: Record<string, any>) =>
    log("info", { message, meta }),

  warn: (message: string, meta?: Record<string, any>) =>
    log("warn", { message, meta }),

  error: (message: string, meta?: Record<string, any>) =>
    log("error", { message, meta }),
};