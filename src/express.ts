import {
  validateFrameworkConfig,
  validateFrameworkSources,
  validateFrameworkSourcesAsync,
} from "./framework.js";
import type { FrameworkConfig } from "./types/framework.js";

interface ExpressRequestLike {
  headers: Record<string, unknown>;
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  validatedPayload?: unknown;
}

interface ExpressResponseLike {
  status(code: number): ExpressResponseLike;
  json(body: unknown): unknown;
}

type ExpressNextFunction = (error?: unknown) => unknown;

export function validatePayload(config: FrameworkConfig = {}) {
  const { rule, options = {} } = config;

  // Validate developer configuration when middleware is created,
  // not on every incoming request.
  validateFrameworkConfig({
    rule,
    options,
  });

  return function perfectPayloadExpressMiddleware(
    req: ExpressRequestLike,
    res: ExpressResponseLike,
    next: ExpressNextFunction,
  ) {
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

export function validatePayloadAsync(config: FrameworkConfig = {}) {
  const { rule, options = {} } = config;

  // Validate developer configuration when middleware is created,
  // not on every incoming request.
  validateFrameworkConfig({
    rule,
    options,
  });

  return async function perfectPayloadExpressAsyncMiddleware(
    req: ExpressRequestLike,
    res: ExpressResponseLike,
    next: ExpressNextFunction,
  ) {
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
