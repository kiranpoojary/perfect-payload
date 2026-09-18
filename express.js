import {
  validateFrameworkConfig,
  validateFrameworkSources,
  validateFrameworkSourcesAsync,
} from "./framework.js";

export function validatePayload(config = {}) {
  const { rule, options = {} } = config;

  // Validate developer configuration when middleware is created,
  // not on every incoming request.
  validateFrameworkConfig({
    rule,
    options,
  });

  return function perfectPayloadExpressMiddleware(req, res, next) {
    try {
      const result = validateFrameworkSources({
        data: {
          headers: req.headers,
          params: req.params,
          query: req.query,
          body: req.body,
        },
        rule,
        options,
      });

      if (result.valid === true) {
        req.validatedPayload = result.validatedPayload;
        return next();
      }

      return res.status(result.statusCode ?? 400).json(result);
    } catch (error) {
      return next(error);
    }
  };
}

export function validatePayloadAsync(config = {}) {
  const { rule, options = {} } = config;

  // Validate developer configuration when middleware is created,
  // not on every incoming request.
  validateFrameworkConfig({
    rule,
    options,
  });

  return async function perfectPayloadExpressAsyncMiddleware(req, res, next) {
    try {
      const result = await validateFrameworkSourcesAsync({
        data: {
          headers: req.headers,
          params: req.params,
          query: req.query,
          body: req.body,
        },
        rule,
        options,
      });

      if (result.valid === true) {
        req.validatedPayload = result.validatedPayload;
        return next();
      }

      return res.status(result.statusCode ?? 400).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
