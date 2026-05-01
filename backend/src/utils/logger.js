// Tiny structured logger. No external dep — Morgan handles HTTP access logs.
const ts = () => new Date().toISOString();
const fmt = (level, msg, meta) => {
  const base = `[${ts()}] ${level} ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
};
module.exports = {
  info: (msg, meta) => console.log(fmt('INFO', msg, meta)),
  warn: (msg, meta) => console.warn(fmt('WARN', msg, meta)),
  error: (msg, meta) => console.error(fmt('ERROR', msg, meta)),
  debug: (msg, meta) => process.env.DEBUG ? console.log(fmt('DEBUG', msg, meta)) : null,
};
