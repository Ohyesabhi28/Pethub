// Centralized error handler. Always returns JSON.
const log = require('../utils/logger');

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) {
    log.error('request failed', { path: req.path, message: err.message, stack: err.stack });
  } else {
    log.warn('request rejected', { path: req.path, status, message: err.message });
  }
  res.status(status).json({
    error: { message: err.message || 'Internal error', details: err.details || null },
  });
}

function notFound(_req, res) {
  res.status(404).json({ error: { message: 'Not found' } });
}

module.exports = { HttpError, errorHandler, notFound };
