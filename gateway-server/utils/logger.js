/**
 * Distributed Systems Standard Logger
 * 
 * Centralized logging utility to standardize output formatting across all services.
 * In a real production environment, this would integrate with Datadog, ELK, or CloudWatch.
 */

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = {}) => {
    console.log(`[${getTimestamp()}] [INFO] ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[${getTimestamp()}] [WARN] ⚠️ ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  error: (message, error = null) => {
    const errMsg = error && error.message ? error.message : (error || '');
    const stack = error && error.stack ? `\n${error.stack}` : '';
    console.error(`[${getTimestamp()}] [ERROR] ❌ ${message} ${errMsg} ${stack}`);
  },
  system: (message) => {
    console.log(`\n[${getTimestamp()}] [SYSTEM] ⚙️  ${message}`);
  },
  network: (message) => {
    console.log(`[${getTimestamp()}] [NETWORK] 🌐 ${message}`);
  },
  security: (message) => {
    console.log(`[${getTimestamp()}] [SECURITY] 🛡️  ${message}`);
  }
};

module.exports = logger;
