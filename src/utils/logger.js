const env = require('../config/env');

const isDev = env.nodeEnv === 'development';

function log(level, ...args) {
  const prefix = `[${new Date().toISOString()}] [${level}]`;
  console.log(prefix, ...args);
}

const logger = {
  info(...args) {
    log('INFO', ...args);
  },
  warn(...args) {
    log('WARN', ...args);
  },
  error(...args) {
    log('ERROR', ...args);
  },
  debug(...args) {
    if (isDev) log('DEBUG', ...args);
  },
};

module.exports = logger;
