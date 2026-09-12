// Sensitive data sanitizer
function sanitize(message) {
  if (typeof message !== 'string') {
    try {
      message = JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  // Mask passwords
  message = message.replace(/("password"\s*:\s*)"[^"]+"/gi, '$1"***"');
  message = message.replace(/(password=)[^\s&]+/gi, '$1***');
  
  // Mask tokens/keys
  message = message.replace(/(token|secret|key|authorization|bearer)\s*[:=]\s*["']?[^"'\s,]+/gi, '$1=***');
  
  // Mask phone numbers (format: +998...)
  message = message.replace(/(\+?998\s?\d{2})\s?\d{3}\s?\d{2}\s?\d{2}/g, '$1***');

  return message;
}

const logger = {
  info: (...args) => {
    const time = new Date().toISOString();
    const sanitizedArgs = args.map((a) => (typeof a === 'string' ? sanitize(a) : a));
    console.log(`[INFO] [${time}]`, ...sanitizedArgs);
  },
  warn: (...args) => {
    const time = new Date().toISOString();
    const sanitizedArgs = args.map((a) => (typeof a === 'string' ? sanitize(a) : a));
    console.warn(`[WARN] [${time}]`, ...sanitizedArgs);
  },
  error: (...args) => {
    const time = new Date().toISOString();
    const sanitizedArgs = args.map((a) => {
      if (a instanceof Error) {
        return sanitize(a.message || a.toString());
      }
      return typeof a === 'string' ? sanitize(a) : a;
    });
    console.error(`[ERROR] [${time}]`, ...sanitizedArgs);
  },
};

module.exports = logger;
