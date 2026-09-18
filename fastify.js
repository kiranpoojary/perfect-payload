import {
  validateFrameworkConfig,
  validateFrameworkSources,
  validateFrameworkSourcesAsync,
} from "./framework.js";

export function validatePayload(config = {}) {
  const { rule, options = {} } = config;

  // Validate developer configuration when the hook is created,
  // not on every incoming request.
  validateFrameworkConfig({
    rule,
    options,
  });

  return async function perfectPayloadFastifyHook(request, reply) {
    const result = validateFrameworkSources({
      data: {
        headers: request.headers,
        params: request.params,
        query: request.query,
        body: request.body,
      },
      rule,
      options,
    });

    if (result.valid === true) {
      request.validatedPayload = result.validatedPayload;
      return;
    }

    return reply.code(result.statusCode ?? 400).send(result);
  };
}

export function validatePayloadAsync(config = {}) {
  const { rule, options = {} } = config;

  // Validate developer configuration when the hook is created,
  // not on every incoming request.
  validateFrameworkConfig({
    rule,
    options,
  });

  return async function perfectPayloadFastifyAsyncHook(request, reply) {
    const result = await validateFrameworkSourcesAsync({
      data: {
        headers: request.headers,
        params: request.params,
        query: request.query,
        body: request.body,
      },
      rule,
      options,
    });

    if (result.valid === true) {
      request.validatedPayload = result.validatedPayload;
      return;
    }

    return reply.code(result.statusCode ?? 400).send(result);
  };
}
