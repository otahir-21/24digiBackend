const { error } = require('../utils/response');
const { ValidationError } = require('../utils/errors');

/**
 * Centralized validation middleware. Validates req.body against the given Zod schema.
 * On success, replaces req.body with parsed value and calls next().
 * On failure, responds with 400 and error details.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);
      if (parsed.success) {
        req.body = parsed.data;
        return next();
      }
      const zodError = parsed.error;
      const details = zodError.errors?.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError(zodError.message || 'Validation failed', details);
    } catch (err) {
      if (err instanceof ValidationError) {
        return error(
          res,
          err.message,
          err.statusCode,
          err.code,
          err.details
        );
      }
      next(err);
    }
  };
}

module.exports = { validate };
