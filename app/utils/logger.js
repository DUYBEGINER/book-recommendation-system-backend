/**
 * Simple Logger Utility
 * Can be replaced with Winston or Pino for production
 */
class Logger {
  log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${level.toUpperCase()}]:`, message, ...args);
  }

  info(message, ...args) {
    this.log('info', message, ...args);
  }

  error(message, ...args) {
    this.log('error', message, ...args);
  }

  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, ...args);
    }
  }
}

export const logger = new Logger();