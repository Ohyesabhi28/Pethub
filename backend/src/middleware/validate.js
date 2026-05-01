// Joi validation middleware. Returns 400 with details on failure.
const { HttpError } = require('./error');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { value, error } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(new HttpError(400, 'Validation failed', error.details.map((d) => d.message)));
    }
    req[source] = value;
    next();
  };
}

module.exports = { validate };
