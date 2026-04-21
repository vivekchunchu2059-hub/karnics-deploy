import log from "loglevel";

// Check environment
const isProduction = process.env.NODE_ENV === "production";

// Set log level
if (isProduction) {
  log.setLevel("info");
} else {
  log.setLevel("debug");
}

// Add timestamp
const originalFactory = log.methodFactory;

log.methodFactory = function (methodName, level, loggerName) {
  const rawMethod = originalFactory(methodName, level, loggerName);

  return function (...args) {
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    rawMethod(`[${timestamp}] [${methodName.toUpperCase()}]`, ...args);
  };
};

// Apply changes
log.setLevel(log.getLevel());

export default log;